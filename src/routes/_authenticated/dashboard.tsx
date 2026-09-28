import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  Home,
  LogOut,
  Megaphone,
  Phone,
  Receipt,
  UserCheck,
  Users,
  UserX,
  Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  approvedTenantFor,
  useAnnouncements,
  useMaintenanceRequests,
  usePayments,
  usePlatformData,
} from "@/hooks/use-data";
import {
  DueDateBadge,
  EmptyState,
  PageHeader,
  PaymentStatusBadge,
  StatCard,
  TrustBadge,
} from "@/components/app/ui-bits";
import { DownloadReceiptButton, SecureImageButton } from "@/components/app/secure-image";
import { approvePayment } from "@/lib/payments.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatBirr, formatDate, formatDateTime, rentUrgency } from "@/lib/rent";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Yegara" },
      { name: "description", content: "Your Yegara overview: rent alerts, payments and requests." },
      { property: "og:title", content: "Dashboard — Yegara" },
      { property: "og:description", content: "Rent alerts, payments and property activity at a glance." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: user } = useCurrentUser();
  const platform = usePlatformData();
  const payments = usePayments();
  const maintenance = useMaintenanceRequests();
  const announcements = useAnnouncements();
  const queryClient = useQueryClient();

  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [removingTenant, setRemovingTenant] = useState<{
    assignmentId: string;
    houseNumber: string;
    tenantName: string;
  } | null>(null);

  const leaveHouseMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase.from("tenant_assignments").delete().eq("id", assignmentId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-data"] });
      toast.success("You have left the house.");
      setLeaveConfirm(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeTenantMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase.from("tenant_assignments").delete().eq("id", assignmentId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-data"] });
      toast.success("Tenant removed from house.");
      setRemovingTenant(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const runApprove = useServerFn(approvePayment);
  const approvePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => runApprove({ data: { paymentId } }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["platform-data"] });
      toast.success(`Payment verified. Next rent due ${result.nextDueDate}.`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!user || platform.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const houses = platform.data?.houses ?? [];
  const assignments = platform.data?.assignments ?? [];
  const directory = platform.data?.directory ?? new Map();

  if (user.role === "owner") {
    const myHouses = houses.filter((h) => h.owner_id === user.id);
    const myHouseIds = new Set(myHouses.map((h) => h.id));
    const activeAssignments = assignments.filter(
      (a) => a.status === "approved" && myHouseIds.has(a.house_id),
    );
    const pendingRequests = assignments.filter(
      (a) => a.status === "pending" && myHouseIds.has(a.house_id),
    );
    const ownerPayments = (payments.data ?? []).filter((p) => myHouseIds.has(p.house_id));
    const pendingPayments = ownerPayments.filter((p) => p.status !== "paid");
    const openMaintenance = (maintenance.data ?? []).filter(
      (m) => myHouseIds.has(m.house_id) && m.status !== "resolved",
    );
    const alerts = myHouses.filter((h) => rentUrgency(h.next_due_date) !== "ok");
    const buildings = platform.data?.buildings ?? [];

    return (
      <>
        <PageHeader
          title={`Hello, ${user.fullName.split(" ")[0]}`}
          description="Here is what is happening across your properties."
          action={
            <div className="flex gap-2">
              <Button asChild size="sm">
                <Link to="/properties">Add a house</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/announcements">Post announcement</Link>
              </Button>
            </div>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total houses" value={myHouses.length} icon={Home} />
          <StatCard label="Active tenants" value={activeAssignments.length} icon={Users} />
          <StatCard
            label="Payments to review"
            value={pendingPayments.length}
            icon={Receipt}
            tone="accent"
          />
          <StatCard
            label="Open maintenance"
            value={openMaintenance.length}
            icon={Wrench}
            tone="destructive"
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4 text-destructive" /> Rent alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No rent is due in the next 3 days. Everything is on track.
                </p>
              ) : (
                <ul className="space-y-3">
                  {alerts.map((house) => {
                    const tenant = approvedTenantFor(assignments, house.id);
                    return (
                      <li
                        key={house.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">House {house.house_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {tenant
                              ? (directory.get(tenant.tenant_id)?.full_name ?? "Tenant")
                              : "Vacant"}{" "}
                            · {formatBirr(house.rent_amount)}
                          </p>
                        </div>
                        <DueDateBadge dueDate={house.next_due_date} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="size-4 text-primary" /> Pending tenant requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No requests waiting for you.</p>
              ) : (
                <ul className="space-y-3">
                  {pendingRequests.slice(0, 5).map((request) => {
                    const house = myHouses.find((h) => h.id === request.house_id);
                    return (
                      <li
                        key={request.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {directory.get(request.tenant_id)?.full_name ?? "Tenant"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            House {house?.house_number ?? "—"} ·{" "}
                            {formatDate(request.created_at)}
                          </p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link to="/requests">Review</Link>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Tenants Management & Removal */}
        <Card className="mt-6 shadow-card">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4 text-primary" /> Active tenants ({activeAssignments.length})
              </CardTitle>
              <CardDescription>
                Occupants residing in your houses. You can manage their tenancy or remove them to vacate a house.
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/properties">Manage properties</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activeAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No active tenants currently assigned to your properties.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeAssignments.map((assignment) => {
                  const house = myHouses.find((h) => h.id === assignment.house_id);
                  const building = house?.building_id
                    ? buildings.find((b) => b.id === house.building_id)
                    : null;
                  const tenant = directory.get(assignment.tenant_id);

                  return (
                    <div
                      key={assignment.id}
                      className="flex flex-col justify-between rounded-xl border border-border p-3.5 space-y-3 bg-muted/20"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {tenant?.full_name ?? "Tenant"}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                              <Phone className="size-3 shrink-0" />
                              {tenant?.phone || "No phone listed"}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            House {house?.house_number ?? "—"}
                          </span>
                        </div>

                        {building && (
                          <p className="text-xs text-muted-foreground">
                            Building: <span className="font-medium text-foreground">{building.name}</span>
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                          <span className="text-muted-foreground">Rent</span>
                          <span className="font-semibold text-foreground">
                            {formatBirr(house?.rent_amount ?? 0)}
                          </span>
                        </div>

                        {house && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Next due</span>
                            <DueDateBadge dueDate={house.next_due_date} />
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-xs h-8"
                          disabled={removeTenantMutation.isPending}
                          onClick={() =>
                            setRemovingTenant({
                              assignmentId: assignment.id,
                              houseNumber: house?.house_number ?? "—",
                              tenantName: tenant?.full_name ?? "Tenant",
                            })
                          }
                        >
                          <UserX className="mr-1.5 size-3.5" /> Remove tenant
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tenant Receipts & Payment History with Download */}
        <Card className="mt-6 shadow-card">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="size-4 text-primary" /> Tenant receipts & payments ({ownerPayments.length})
              </CardTitle>
              <CardDescription>
                View submitted bank deposit slips, check AI trust scores, and download receipt copies directly.
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/payments">All payments & verify</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ownerPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No receipts submitted yet by tenants.
              </p>
            ) : (
              <div className="space-y-3">
                {ownerPayments.slice(0, 6).map((payment) => {
                  const house = myHouses.find((h) => h.id === payment.house_id);
                  const tenant = directory.get(payment.tenant_id);
                  const receiptFilename = `receipt-house-${house?.house_number ?? "house"}-${payment.created_at.slice(0, 10)}.jpg`;

                  return (
                    <div
                      key={payment.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border p-3.5 bg-muted/20"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">
                            {tenant?.full_name ?? "Tenant"} · House {house?.house_number ?? "—"}
                          </p>
                          <PaymentStatusBadge status={payment.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>Uploaded: {formatDateTime(payment.created_at)}</span>
                          <span>•</span>
                          <span>
                            Expected: <strong className="text-foreground">{formatBirr(payment.expected_amount)}</strong>
                          </span>
                          {payment.extracted_amount !== null && (
                            <>
                              <span>•</span>
                              <span>
                                AI read: <strong className="text-foreground">{formatBirr(payment.extracted_amount)}</strong>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                        <TrustBadge score={payment.trust_score} />
                        <SecureImageButton
                          kind="receipt"
                          id={payment.id}
                          label="View"
                          title={`Receipt — House ${house?.house_number ?? "—"}`}
                          filename={receiptFilename}
                        />
                        <DownloadReceiptButton
                          paymentId={payment.id}
                          filename={receiptFilename}
                        />
                        {payment.status !== "paid" && (
                          <Button
                            size="sm"
                            className="h-8 text-xs"
                            disabled={approvePaymentMutation.isPending}
                            onClick={() => approvePaymentMutation.mutate(payment.id)}
                          >
                            Verify
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Remove Tenant Confirmation Dialog */}
        <AlertDialog
          open={removingTenant !== null}
          onOpenChange={(open) => !open && setRemovingTenant(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Remove Tenant from House {removingTenant?.houseNumber}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <strong>{removingTenant?.tenantName}</strong> from House{" "}
                <strong>{removingTenant?.houseNumber}</strong>? This will immediately cancel their rental
                assignment and mark the house as vacant for new tenants.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={removeTenantMutation.isPending}
                onClick={() => {
                  if (removingTenant) removeTenantMutation.mutate(removingTenant.assignmentId);
                }}
              >
                {removeTenantMutation.isPending ? "Removing..." : "Yes, remove tenant"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  if (user.role === "tenant") {
    const myAssignment =
      assignments.find((a) => a.tenant_id === user.id && a.status === "approved") ??
      assignments.find((a) => a.tenant_id === user.id && a.status === "pending") ??
      null;
    const house = myAssignment ? houses.find((h) => h.id === myAssignment.house_id) : null;
    const myPayments = (payments.data ?? []).filter((p) => p.tenant_id === user.id);
    const myMaintenance = (maintenance.data ?? []).filter((m) => m.tenant_id === user.id);

    return (
      <>
        <PageHeader
          title={`Hello, ${user.fullName.split(" ")[0]}`}
          description="Your rental, payments and requests."
        />

        {!myAssignment && (
          <EmptyState
            icon={Home}
            title="You have not requested a house yet"
            description="Browse available houses and send a rental request to the owner."
            action={
              <Button asChild>
                <Link to="/find-houses">Find a house</Link>
              </Button>
            }
          />
        )}

        {myAssignment?.status === "pending" && house && (
          <Card className="border-accent/60 shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Pending approval</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Your request for house {house.house_number} is waiting for the owner's decision.
            </CardContent>
          </Card>
        )}

        {myAssignment?.status === "approved" && house && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Your house" value={`No. ${house.house_number}`} icon={Home} />
              <StatCard label="Monthly rent" value={formatBirr(house.rent_amount)} icon={Receipt} />
              <StatCard
                label="Next rent due"
                value={formatDate(house.next_due_date)}
                icon={CalendarDays}
                tone={rentUrgency(house.next_due_date) === "ok" ? "primary" : "accent"}
              />
              <StatCard
                label="Open requests"
                value={myMaintenance.filter((m) => m.status !== "resolved").length}
                icon={Wrench}
                tone="destructive"
              />
            </div>

            {rentUrgency(house.next_due_date) !== "ok" && (
              <Card className="mt-6 border-destructive/40 bg-destructive-soft shadow-card">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <p className="text-sm font-medium text-destructive">
                    {rentUrgency(house.next_due_date) === "overdue"
                      ? `Your rent was due on ${formatDate(house.next_due_date)}.`
                      : `Your rent is due on ${formatDate(house.next_due_date)}.`}
                  </p>
                  <Button asChild size="sm">
                    <Link to="/payments">Upload receipt</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-base">Recent payments</CardTitle>
                </CardHeader>
                <CardContent>
                  {myPayments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No receipts uploaded yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {myPayments.slice(0, 5).map((payment) => (
                        <li
                          key={payment.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                        >
                          <span className="text-sm">{formatDateTime(payment.created_at)}</span>
                          <PaymentStatusBadge status={payment.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Owner contact & Rental status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {directory.get(house.owner_id)?.full_name ?? "Property owner"}
                    </p>
                    <p className="text-muted-foreground">
                      {directory.get(house.owner_id)?.phone || "Phone not shared"}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      disabled={leaveHouseMutation.isPending}
                      onClick={() => setLeaveConfirm(true)}
                    >
                      <LogOut className="mr-2 size-3.5" /> Leave house
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <AlertDialog open={leaveConfirm} onOpenChange={setLeaveConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave House {house.house_number}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to leave this house? Your rental assignment will be cancelled and the house will become available for other tenants.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      if (myAssignment) leaveHouseMutation.mutate(myAssignment.id);
                    }}
                  >
                    Yes, leave house
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </>
    );
  }

  const occupied = houses.filter((h) => approvedTenantFor(assignments, h.id));
  return (
    <>
      <PageHeader
        title={`Hello, ${user.fullName.split(" ")[0]}`}
        description="Community overview for guards."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Houses in community" value={houses.length} icon={Building2} />
        <StatCard label="Occupied houses" value={occupied.length} icon={Users} tone="accent" />
        <StatCard
          label="Announcements"
          value={(announcements.data ?? []).length}
          icon={Megaphone}
          tone="destructive"
        />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/community">Open community report</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/announcements">Read announcements</Link>
        </Button>
      </div>
    </>
  );
}
