import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { approvedTenantFor, usePlatformData } from "@/hooks/use-data";
import { EmptyState, PageHeader } from "@/components/app/ui-bits";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({
    meta: [
      { title: "Community directory — Yegara" },
      { name: "description", content: "Guard view of houses and their current residents." },
      { property: "og:title", content: "Community directory — Yegara" },
      { property: "og:description", content: "Who lives where, for gate verification." },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const { data: user } = useCurrentUser();
  const platform = usePlatformData();

  if (!user || platform.isLoading) return <Skeleton className="h-64" />;

  const houses = platform.data?.houses ?? [];
  const assignments = platform.data?.assignments ?? [];
  const directory = platform.data?.directory ?? new Map();

  return (
    <>
      <PageHeader
        title="Community directory"
        description="Houses and the residents currently assigned to them."
      />
      {houses.length === 0 ? (
        <EmptyState icon={Users} title="No houses registered yet" />
      ) : (
        <>
          {/* Mobile Card View (visible on screens < md) */}
          <div className="space-y-3 md:hidden">
            {houses.map((house) => {
              const assignment = approvedTenantFor(assignments, house.id);
              const tenant = assignment ? directory.get(assignment.tenant_id) : null;
              return (
                <Card key={house.id} className="shadow-card">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-base">House {house.house_number}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tenant ? 'bg-primary-soft text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {tenant ? "Occupied" : "Vacant"}
                      </span>
                    </div>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p><span className="font-medium text-foreground">Resident:</span> {tenant?.full_name ?? "—"}</p>
                      <p><span className="font-medium text-foreground">Phone:</span> {tenant?.phone || "—"}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Desktop Table View (hidden on screens < md) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>House</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {houses.map((house) => {
                  const assignment = approvedTenantFor(assignments, house.id);
                  const tenant = assignment ? directory.get(assignment.tenant_id) : null;
                  return (
                    <TableRow key={house.id}>
                      <TableCell className="font-medium">{house.house_number}</TableCell>
                      <TableCell>{tenant?.full_name ?? "—"}</TableCell>
                      <TableCell>{tenant?.phone || "—"}</TableCell>
                      <TableCell>{tenant ? "Occupied" : "Vacant"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </>
  );
}
