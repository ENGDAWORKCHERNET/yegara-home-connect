import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roleInputSchema = z.object({
  role: z.enum(["owner", "tenant", "guard"]),
  fullName: z.string().optional(),
  phone: z.string().optional(),
});

/**
 * Sets or updates the user's role (owner, tenant, guard) and optional profile details.
 */
export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    if (typeof input === "object" && input !== null && "data" in input) {
      return roleInputSchema.parse((input as any).data);
    }
    return roleInputSchema.parse(input);
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Always update user_metadata in auth.users (guaranteed to succeed without tables)
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        role: data.role,
        ...(data.fullName ? { full_name: data.fullName } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
      },
    });

    // 2. Safely sync to user_roles table if it exists
    try {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: data.role,
      });
    } catch (e) {
      console.warn("Could not write to user_roles table:", e);
    }

    // 3. Safely sync to profiles table if it exists
    try {
      const { data: userAuth } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = userAuth?.user?.email || "";
      const profileData: Record<string, string> = {
        id: userId,
        email: email,
        updated_at: new Date().toISOString(),
      };
      if (data.fullName) profileData["full_name"] = data.fullName;
      if (data.phone) profileData["phone"] = data.phone;
      await supabaseAdmin.from("profiles").upsert(profileData);
    } catch (e) {
      console.warn("Could not write to profiles table:", e);
    }

    return { success: true };
  });

const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().min(9),
  role: z.enum(["owner", "tenant", "guard"]),
  consentGiven: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Terms of Service to create an account",
  }),
});

/**
 * Registers a new user using the admin API (bypasses email confirmation),
 * inserts their role and profile — so they can sign in immediately after.
 */
export const registerUserAccount = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (typeof input === "object" && input !== null && "data" in input) {
      return registerInputSchema.parse((input as any).data);
    }
    return registerInputSchema.parse(input);
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Check if email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === data.email.toLowerCase()
    );
    if (alreadyExists) {
      throw new Error("An account with this email already exists. Please sign in instead.");
    }

    const consentGivenAt = new Date().toISOString();

    // 2. Create the auth user — email_confirm: true skips confirmation email
    const { data: authData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        phone: data.phone,
        role: data.role,
        consent_given_at: consentGivenAt,
      },
    });

    if (createErr || !authData.user) {
      throw new Error(createErr?.message ?? "Failed to create account.");
    }

    const userId = authData.user.id;

    // 3. Try to insert role into user_roles table if table exists
    try {
      await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: data.role,
      });
    } catch (e) {
      console.warn("Could not insert to user_roles table:", e);
    }

    // 4. Try to upsert profile into profiles table if table exists
    try {
      const profilePayload: Record<string, any> = {
        id: userId,
        email: data.email,
        full_name: data.fullName,
        phone: data.phone,
        updated_at: new Date().toISOString(),
        consent_given_at: consentGivenAt,
      };

      const { error: profileErr } = await supabaseAdmin.from("profiles").upsert(profilePayload);
      if (profileErr) {
        // Fallback without consent_given_at in case the column hasn't been added yet
        delete profilePayload.consent_given_at;
        await supabaseAdmin.from("profiles").upsert(profilePayload);
      }
    } catch (e) {
      console.warn("Could not insert to profiles table:", e);
    }

    return { success: true };
  });

/**
 * Deletes the authenticated user's account and all associated database records.
 * Uses service role client server-side to clean up all foreign key dependencies.
 */
export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Get user's houses if they are an owner
    const { data: userHouses } = await supabaseAdmin
      .from("houses")
      .select("id")
      .eq("owner_id", userId);

    const houseIds = (userHouses ?? []).map((h) => h.id);

    // 2. Clean up payments & maintenance connected to user or user's houses
    if (houseIds.length > 0) {
      await supabaseAdmin.from("payments").delete().in("house_id", houseIds);
      await supabaseAdmin.from("maintenance_requests").delete().in("house_id", houseIds);
      await supabaseAdmin.from("tenant_assignments").delete().in("house_id", houseIds);
    }

    await supabaseAdmin.from("payments").delete().eq("tenant_id", userId);
    await supabaseAdmin.from("maintenance_requests").delete().eq("tenant_id", userId);
    await supabaseAdmin.from("tenant_assignments").delete().eq("tenant_id", userId);
    await supabaseAdmin.from("announcements").delete().eq("author_id", userId);

    // 3. Delete houses owned by user
    if (houseIds.length > 0) {
      await supabaseAdmin.from("houses").delete().eq("owner_id", userId);
    }

    // 4. Delete user roles & profile
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    // 5. Delete user from auth.users
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("[deleteUserAccount] Error deleting auth user:", error);
      throw new Error(error.message);
    }

    return { success: true };
  });
