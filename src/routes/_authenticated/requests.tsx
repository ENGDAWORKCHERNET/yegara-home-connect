import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Loader2, ShieldAlert, UserCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePlatformData } from "@/hooks/use-data";
import { EmptyState, PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBirr, formatDateTime } from "@/lib/rent";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({
    meta: [
      { title: "Tenant requests — Yegara" },
      { name: "description", content: "Approve or reject rental requests for your houses." },
      { property: "og:title", content: "Tenant requests — Yegara" },
      { property: "og:description", content: "Review who wants to rent your properties." },
    ],
  }),
  component: RequestsPage,
});

function RequestsPage() {
  const { data: user } = useCurrentUser();
  const platform = usePlatformData();
  const queryClient = useQueryClient();

  const decide = useMutation({
    mutationFn: async ({
      requestId,
      houseId,
      approve,
    }: {
      requestId: string;
      houseId: string;
      approve: boolean;
    }) => {
      const { error } = await supabase
        .from("tenant_assignments")
        .update({ status: approve ? "approved" : "rejected" })
        .eq("id", requestId);
      if (error) throw new Error(error.message);

      if (approve) {
        // Auto-reject every other pending request for the same house.
        const { error: rejectError } = await supabase
          .from("tenant_assignments")
          .update({ status: "rejected" })
          .eq("house_id", houseId)
          .eq("status", "pending")
          .neq("id", requestId);
        if (rejectError) throw new Error(rejectError.message);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["platform-data"] });
      toast.success(variables.approve ? "Tenant approved." : "Request rejected.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!user || platform.isLoading) return <Skeleton className="h-64" />;

  if (user.role !== "owner") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Owners only"
        description="Only property owners review tenant requests."
      />
    );
  }

  const myHouses = (platform.data?.houses ?? []).filter((h) => h.owner_id === user.id);
  const myHouseIds = new Set(myHouses.map((h) => h.id));
  const directory = platform.data?.directory ?? new Map();
  const pending = (platform.data?.assignments ?? []).filter(
    (a) => a.status === "pending" && myHouseIds.has(a.house_id),
  );
  const decided = (platform.data?.assignments ?? []).filter(
    (a) => a.status !== "pending" && myHouseIds.has(a.house_id),
  );

  return (
    <>
      <PageHeader
        title="Tenant requests"
        description="Approve the tenant you want; other pending requests for that house are rejected automatically."
      />

      {pending.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No pending requests"
          description="When a tenant requests one of your houses it will appear here."
        />
      ) : (
        <div className="space-y-3">
          {pending.map((request) => {
            const house = myHouses.find((h) => h.id === request.house_id);
            const tenant = directory.get(request.tenant_id);
            return (
              <Card key={request.id} className="shadow-card">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                  <div>
                    <p className="font-semibold">{tenant?.full_name ?? "Tenant"}</p>
                    <p className="text-sm text-muted-foreground">
                      {tenant?.phone || "No phone"} · {tenant?.email}
                    </p>
                    <p className="mt-1 text-sm">
                      House {house?.house_number} · {formatBirr(house?.rent_amount ?? 0)} ·{" "}
                      requested {formatDateTime(request.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={decide.isPending}
                      onClick={() =>
                        decide.mutate({
                          requestId: request.id,
                          houseId: request.house_id,
                          approve: true,
                        })
                      }
                    >
                      {decide.isPending ? (
                        <Loader2 className="mr-2 size-3.5 animate-spin" />
                      ) : (
                        <Check className="mr-2 size-3.5" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={decide.isPending}
                      onClick={() =>
                        decide.mutate({
                          requestId: request.id,
                          houseId: request.house_id,
                          approve: false,
                        })
                      }
                    >
                      <X className="mr-2 size-3.5" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {decided.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase">History</h2>
          <div className="space-y-2">
            {decided.map((request) => {
              const house = myHouses.find((h) => h.id === request.house_id);
              return (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 text-sm"
                >
                  <span>
                    {directory.get(request.tenant_id)?.full_name ?? "Tenant"} · House{" "}
                    {house?.house_number}
                  </span>
                  <span className="text-muted-foreground capitalize">{request.status}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
