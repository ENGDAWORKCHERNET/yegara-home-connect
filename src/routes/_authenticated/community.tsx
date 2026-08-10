import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { approvedTenantFor, usePlatformData } from "@/hooks/use-data";
import { EmptyState, PageHeader } from "@/components/app/ui-bits";
import { Skeleton } from "@/components/ui/skeleton";
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
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
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
      )}
    </>
  );
}
