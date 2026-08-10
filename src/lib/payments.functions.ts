import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { nextDueDateFrom, rentUrgency, type Recurrence } from "@/lib/rent";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/**
 * Uploads are done client-side into the tenant's own private folder.
 * This function validates ownership, runs AI receipt verification and records
 * the payment. AI failure never blocks the upload (trust score falls back to "low").
 */
export const verifyReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        houseId: z.string().uuid(),
        receiptPath: z.string().min(3).max(400),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (!data.receiptPath.startsWith(`${userId}/`)) {
      throw new Error("Invalid receipt location.");
    }

    const { data: assignment } = await supabase
      .from("tenant_assignments")
      .select("id")
      .eq("tenant_id", userId)
      .eq("house_id", data.houseId)
      .eq("status", "approved")
      .maybeSingle();

    if (!assignment) throw new Error("You do not have an approved rental for this house.");

    const { data: house } = await supabase
      .from("houses")
      .select("id, rent_amount, recurrence, next_due_date")
      .eq("id", data.houseId)
      .maybeSingle();

    if (!house) throw new Error("House not found.");

    const expected = Number(house.rent_amount);
    let trustScore: "high" | "medium" | "low" = "low";
    let extractedAmount: number | null = null;
    let aiNotes = "";

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const download = await supabaseAdmin.storage.from("receipts").download(data.receiptPath);
      if (download.error || !download.data) throw new Error("Receipt file could not be read.");

      const blob = download.data;
      const mime = blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";
      const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");

      const response = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]!}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3.5-flash",
          messages: [
            {
              role: "system",
              content:
                'You verify rent payment receipts. Reply ONLY with compact JSON: {"extracted_amount": number|null, "amount_match": "yes"|"no", "is_valid_receipt": "yes"|"no", "notes": string}.',
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Expected rent amount: ${expected} ETB. Inspect this payment receipt image: is it a genuine bank/mobile-money payment receipt, and what total amount was paid? Keep notes under 200 characters.`,
                },
                { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
              ],
            },
          ],
        }),
      });

      if (!response.ok) throw new Error(`AI verification unavailable (${response.status}).`);

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = payload.choices?.[0]?.message?.content ?? "";
      const jsonText = raw.replace(/```json|```/g, "").trim();
      const match = jsonText.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : jsonText) as {
        extracted_amount?: number | string | null;
        amount_match?: string;
        is_valid_receipt?: string;
        notes?: string;
      };

      const amountNumber = Number(parsed.extracted_amount);
      extractedAmount = Number.isFinite(amountNumber) ? amountNumber : null;
      aiNotes = String(parsed.notes ?? "").slice(0, 400);

      const valid = String(parsed.is_valid_receipt).toLowerCase() === "yes";
      const amountsMatch =
        String(parsed.amount_match).toLowerCase() === "yes" ||
        (extractedAmount !== null && Math.abs(extractedAmount - expected) < 0.01);

      trustScore = valid ? (amountsMatch ? "high" : "medium") : "low";
    } catch (error) {
      trustScore = "low";
      aiNotes =
        error instanceof Error
          ? `Automatic check unavailable: ${error.message}`
          : "Automatic check unavailable.";
    }

    const late = rentUrgency(house.next_due_date) === "overdue";

    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        house_id: data.houseId,
        tenant_id: userId,
        receipt_path: data.receiptPath,
        expected_amount: expected,
        extracted_amount: extractedAmount,
        status: late ? "late" : "pending",
        trust_score: trustScore,
        ai_notes: aiNotes,
      })
      .select("id, status, trust_score, extracted_amount, ai_notes")
      .single();

    if (error) throw new Error(error.message);
    return payment;
  });

/** Owner-side approval: marks the payment verified and rolls the house due date forward. */
export const approvePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ paymentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: payment } = await supabase
      .from("payments")
      .select("id, house_id, houses!inner(id, owner_id, recurrence, next_due_date)")
      .eq("id", data.paymentId)
      .maybeSingle();

    if (!payment) throw new Error("Payment not found.");
    const house = payment.houses as unknown as {
      id: string;
      owner_id: string;
      recurrence: Recurrence;
      next_due_date: string;
    };
    if (house.owner_id !== userId) throw new Error("You do not own this property.");

    const { error: payErr } = await supabase
      .from("payments")
      .update({ status: "paid", verified_at: new Date().toISOString() })
      .eq("id", data.paymentId);
    if (payErr) throw new Error(payErr.message);

    const nextDue = nextDueDateFrom(house.next_due_date, house.recurrence);
    const { error: houseErr } = await supabase
      .from("houses")
      .update({ next_due_date: nextDue })
      .eq("id", house.id);
    if (houseErr) throw new Error(houseErr.message);

    return { nextDueDate: nextDue };
  });

/** Returns a short-lived signed URL for a receipt, only for the tenant or the property owner. */
export const getReceiptUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ paymentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    // RLS restricts this read to the tenant who paid or the owner of the house.
    const { data: payment } = await context.supabase
      .from("payments")
      .select("receipt_path")
      .eq("id", data.paymentId)
      .maybeSingle();

    if (!payment) throw new Error("Receipt not available.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("receipts")
      .createSignedUrl(payment.receipt_path, 300);

    if (error || !signed) throw new Error("Could not create a secure link for this receipt.");
    return { url: signed.signedUrl };
  });

/** Signed URL for a maintenance photo, for the reporting tenant or the property owner. */
export const getMaintenanceImageUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: request } = await context.supabase
      .from("maintenance_requests")
      .select("image_path")
      .eq("id", data.requestId)
      .maybeSingle();

    if (!request?.image_path) throw new Error("No photo attached to this request.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("receipts")
      .createSignedUrl(request.image_path, 300);

    if (error || !signed) throw new Error("Could not create a secure link for this photo.");
    return { url: signed.signedUrl };
  });
