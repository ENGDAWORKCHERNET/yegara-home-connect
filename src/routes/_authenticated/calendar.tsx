import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { approvedTenantFor, usePlatformData } from "@/hooks/use-data";
import { DueDateBadge, EmptyState, PageHeader } from "@/components/app/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { daysUntil, formatBirr, formatDate } from "@/lib/rent";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Rent calendar — Yegara" },
      { name: "description", content: "See upcoming and overdue rent dates at a glance." },
      { property: "og:title", content: "Rent calendar — Yegara" },
      { property: "og:description", content: "Upcoming rent due dates on Yegara." },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { data: user } = useCurrentUser();
  const platform = usePlatformData();

  if (!user || platform.isLoading) return <Skeleton className="h-64" />;

  const assignments = platform.data?.assignments ?? [];
  const directory = platform.data?.directory ?? new Map();
  const houses = (platform.data?.houses ?? []).filter((house) => {
    if (user.role === "owner") return house.owner_id === user.id;
    const mine = assignments.find(
      (a) => a.tenant_id === user.id && a.status === "approved" && a.house_id === house.id,
    );
    return user.role === "guard" ? true : Boolean(mine);
  });

  const sorted = [...houses].sort((a, b) => daysUntil(a.next_due_date) - daysUntil(b.next_due_date));

  return (
    <>
      <PageHeader
        title="Rent calendar"
        description="Ordered by urgency — overdue houses come first."
      />
      {sorted.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nothing scheduled yet" />
      ) : (
        <div className="space-y-3">
          {sorted.map((house) => {
            const assignment = approvedTenantFor(assignments, house.id);
            const tenant = assignment ? directory.get(assignment.tenant_id) : null;
            return (
              <Card key={house.id} className="shadow-card">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                  <div>
                    <p className="font-semibold">House {house.house_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {tenant?.full_name ?? "Vacant"} · {formatBirr(house.rent_amount)} ·{" "}
                      {house.recurrence}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(house.next_due_date)}
                    </span>
                    <DueDateBadge dueDate={house.next_due_date} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
