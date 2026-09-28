import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Receipt, Upload } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePayments, usePlatformData } from "@/hooks/use-data";
import { approvePayment, verifyReceipt } from "@/lib/payments.functions";
import { uploadPrivateImage } from "@/lib/storage";
import { EmptyState, PageHeader, PaymentStatusBadge, TrustBadge } from "@/components/app/ui-bits";
import { DownloadReceiptButton, SecureImageButton } from "@/components/app/secure-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBirr, formatDateTime } from "@/lib/rent";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "Payments — Yegara" },
      { name: "description", content: "Upload rent receipts and track verification status." },
      { property: "og:title", content: "Payments — Yegara" },
      { property: "og:description", content: "AI-checked rent receipts with trust scores." },
    ],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const { data: user } = useCurrentUser();
  const platform = usePlatformData();
  const payments = usePayments();
  const queryClient = useQueryClient();
  const runVerify = useServerFn(verifyReceipt);
  const runApprove = useServerFn(approvePayment);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const upload = useMutation({
    mutationFn: async ({ houseId }: { houseId: string }) => {
      if (!user || !file) throw new Error("Choose a receipt image first.");
      setProgress(25);
      const path = await uploadPrivateImage(user.id, "receipts", file);
      setProgress(65);
      const result = await runVerify({ data: { houseId, receiptPath: path } });
      setProgress(100);
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setFile(null);
      setProgress(0);
      toast.success(`Receipt uploaded — AI trust score: ${result.trust_score}.`);
    },
    onError: (error: Error) => {
      setProgress(0);
      toast.error(error.message);
    },
  });

  const approve = useMutation({
    mutationFn: async (paymentId: string) => runApprove({ data: { paymentId } }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["platform-data"] });
      toast.success(`Payment verified. Next rent due ${result.nextDueDate}.`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!user || platform.isLoading || payments.isLoading) return <Skeleton className="h-64" />;

  const houses = platform.data?.houses ?? [];
  const assignments = platform.data?.assignments ?? [];
  const directory = platform.data?.directory ?? new Map();
  const allPayments = payments.data ?? [];

  if (user.role === "tenant") {
    const assignment = assignments.find((a) => a.tenant_id === user.id && a.status === "approved");
    const house = assignment ? houses.find((h) => h.id === assignment.house_id) : null;
    const mine = allPayments.filter((p) => p.tenant_id === user.id);

    return (
      <>
        <PageHeader title="Payments" description="Upload your rent receipt and follow its status." />

        {!house ? (
          <EmptyState
            icon={Receipt}
            title="No active rental"
            description="Once an owner approves your request you can upload receipts here."
          />
        ) : (
          <Card className="mb-8 shadow-card">
            <CardHeader>
              <CardTitle className="text-base">
                Upload receipt — House {house.house_number} · {formatBirr(house.rent_amount)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt image (JPG/PNG/WEBP, max 5MB)</Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </div>
              {upload.isPending && <Progress value={progress} />}
              <Button
                disabled={!file || upload.isPending}
                onClick={() => upload.mutate({ houseId: house.id })}
              >
                {upload.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 size-4" />
                )}
                Upload &amp; verify
              </Button>
            </CardContent>
          </Card>
        )}

        {mine.length === 0 ? (
          <EmptyState icon={Receipt} title="No payments yet" />
        ) : (
          <PaymentTable
            rows={mine.map((payment) => ({ payment, who: "You" }))}
            showActions={false}
          />
        )}
      </>
    );
  }

  if (user.role !== "owner") {
    return <EmptyState icon={Receipt} title="Not available for your role" />;
  }

  const myHouseIds = new Set(houses.filter((h) => h.owner_id === user.id).map((h) => h.id));
  const rows = allPayments
    .filter((p) => myHouseIds.has(p.house_id))
    .map((payment) => ({
      payment,
      who: `${directory.get(payment.tenant_id)?.full_name ?? "Tenant"} · House ${
        houses.find((h) => h.id === payment.house_id)?.house_number ?? "—"
      }`,
    }));

  return (
    <>
      <PageHeader
        title="Payment verification"
        description="Review uploaded receipts, check the AI trust score and approve payments."
      />
      {rows.length === 0 ? (
        <EmptyState icon={Receipt} title="No receipts submitted yet" />
      ) : (
        <PaymentTable
          rows={rows}
          showActions
          onApprove={(id) => approve.mutate(id)}
          approving={approve.isPending}
        />
      )}
    </>
  );
}

function PaymentTable({
  rows,
  showActions,
  onApprove,
  approving,
}: {
  rows: Array<{ payment: import("@/hooks/use-data").Payment; who: string }>;
  showActions: boolean;
  onApprove?: (id: string) => void;
  approving?: boolean;
}) {
  return (
    <>
      {/* Mobile Card View (visible on screens < md) */}
      <div className="space-y-3 md:hidden">
        {rows.map(({ payment, who }) => (
          <Card key={payment.id} className="shadow-card">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{who}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(payment.created_at)}</p>
                </div>
                <PaymentStatusBadge status={payment.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs rounded-lg bg-muted/60 p-2.5">
                <div>
                  <p className="text-muted-foreground">Expected</p>
                  <p className="font-medium">{formatBirr(payment.expected_amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">AI Extracted</p>
                  <p className="font-medium">
                    {payment.extracted_amount === null ? "—" : formatBirr(payment.extracted_amount)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <TrustBadge score={payment.trust_score} />
                <div className="flex items-center gap-2">
                  <SecureImageButton kind="receipt" id={payment.id} label="View" title="Payment receipt" />
                  <DownloadReceiptButton paymentId={payment.id} filename={`receipt-${payment.id.slice(0, 8)}.jpg`} />
                  {showActions && payment.status !== "paid" && (
                    <Button size="sm" className="h-8 text-xs" disabled={approving} onClick={() => onApprove?.(payment.id)}>
                      Verify
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View (hidden on screens < md) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant / house</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>AI amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Trust</TableHead>
              <TableHead className="text-right">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ payment, who }) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{who}</TableCell>
                <TableCell>{formatDateTime(payment.created_at)}</TableCell>
                <TableCell>{formatBirr(payment.expected_amount)}</TableCell>
                <TableCell>
                  {payment.extracted_amount === null ? "—" : formatBirr(payment.extracted_amount)}
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={payment.status} />
                </TableCell>
                <TableCell>
                  <TrustBadge score={payment.trust_score} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    <SecureImageButton kind="receipt" id={payment.id} label="View" title="Payment receipt" />
                    <DownloadReceiptButton paymentId={payment.id} filename={`receipt-${payment.id.slice(0, 8)}.jpg`} />
                    {showActions && payment.status !== "paid" && (
                      <Button size="sm" disabled={approving} onClick={() => onApprove?.(payment.id)}>
                        Verify
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
