import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Home, Search, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { approvedTenantFor, usePlatformData } from "@/hooks/use-data";
import { EmptyState, PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBirr, formatDate } from "@/lib/rent";

export const Route = createFileRoute("/_authenticated/find-houses")({
  head: () => ({
    meta: [
      { title: "Find a house — Yegara" },
      { name: "description", content: "Browse available houses and request to rent one." },
      { property: "og:title", content: "Find a house — Yegara" },
      { property: "og:description", content: "Available rentals from verified owners." },
    ],
  }),
  component: FindHousesPage,
});

function FindHousesPage() {
  const { data: user } = useCurrentUser();
  const platform = usePlatformData();
  const queryClient = useQueryClient();

  const request = useMutation({
    mutationFn: async (houseId: string) => {
      if (!user) throw new Error("Not signed in.");
      const { error } = await supabase
        .from("tenant_assignments")
        .insert({ house_id: houseId, tenant_id: user.id, status: "pending" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-data"] });
      toast.success("Request sent to the owner.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!user || platform.isLoading) return <Skeleton className="h-64" />;

  if (user.role !== "tenant") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Tenants only"
        description="Only tenants can browse and request houses."
      />
    );
  }

  const houses = platform.data?.houses ?? [];
  const assignments = platform.data?.assignments ?? [];
  const directory = platform.data?.directory ?? new Map();
  const activeOwn = assignments.find(
    (a) => a.tenant_id === user.id && (a.status === "pending" || a.status === "approved"),
  );
  const available = houses.filter((house) => !approvedTenantFor(assignments, house.id));

  return (
    <>
      <PageHeader
        title="Find a house"
        description="Houses without an approved tenant. You can have one active request at a time."
      />

      {activeOwn && (
        <Card className="mb-6 border-accent/50 shadow-card">
          <CardContent className="pt-6 text-sm">
            You already have {activeOwn.status === "approved" ? "an approved rental" : "a pending request"}.
            Cancelling is done by contacting the owner.
          </CardContent>
        </Card>
      )}

      {available.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No houses available right now"
          description="Check back soon — owners add new properties regularly."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {available.map((house) => (
            <Card key={house.id} className="shadow-card">
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Home className="size-4" />
                  </span>
                  <div>
                    <p className="font-semibold">House {house.house_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Owner: {directory.get(house.owner_id)?.full_name ?? "—"}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-bold">{formatBirr(house.rent_amount)}</p>
                <p className="text-sm text-muted-foreground">
                  {house.recurrence} · next due {formatDate(house.next_due_date)}
                </p>
                {house.description && <p className="text-sm">{house.description}</p>}
                <Button
                  className="w-full"
                  disabled={Boolean(activeOwn) || request.isPending}
                  onClick={() => request.mutate(house.id)}
                >
                  Request to rent
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
