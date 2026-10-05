import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  CalendarDays,
  Home,
  LayoutDashboard,
  Loader2,
  LogOut,
  Megaphone,
  Menu,
  Receipt,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, type AppRole } from "@/hooks/use-current-user";
import { deleteUserAccount, setUserRole } from "@/lib/user.functions";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/app/notifications-bell";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  roles: AppRole[];
};

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["owner", "tenant", "guard"] },
  { to: "/properties", label: "My properties", icon: Home, roles: ["owner"] },
  { to: "/requests", label: "Tenant requests", icon: UserCheck, roles: ["owner"] },
  { to: "/find-houses", label: "Find a house", icon: Search, roles: ["tenant"] },
  { to: "/payments", label: "Payments", icon: Receipt, roles: ["owner", "tenant"] },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, roles: ["owner", "tenant"] },
  { to: "/calendar", label: "Rent calendar", icon: CalendarDays, roles: ["owner", "tenant"] },
  { to: "/community", label: "Community report", icon: ShieldCheck, roles: ["guard", "owner"] },
  { to: "/announcements", label: "Announcements", icon: Megaphone, roles: ["owner", "tenant", "guard"] },
];

const roleLabels: Record<AppRole, string> = {
  owner: "Property owner",
  tenant: "Tenant",
  guard: "Community guard",
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [savingRole, setSavingRole] = useState(false);

  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const items = navItems.filter((item) => !user || item.roles.includes(user.role));

  const shouldPromptRole = !!user && !user.hasExplicitRole;

  async function saveRole(role: AppRole) {
    setSavingRole(true);
    try {
      await setUserRole({ data: { role } });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      queryClient.invalidateQueries({ queryKey: ["platform-data"] });
      toast.success(`Role updated to ${roleLabels[role]}`);
      setRoleModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update role");
    } finally {
      setSavingRole(false);
    }
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      await deleteUserAccount();
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      toast.success("Your account has been deleted.");
      navigate({ to: "/auth", replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete account.");
      setIsDeleting(false);
    }
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4 text-sidebar-foreground">
      <span className="grid size-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
        <Building2 className="size-5" />
      </span>
      <span className="font-semibold">Yegara</span>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar md:flex">
        {brand}
        {nav}
        <div className="space-y-1 border-t border-sidebar-border p-3">
          <button
            onClick={() => setRoleModalOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <UserCheck className="size-4" /> Change role ({user ? roleLabels[user.role] : ""})
          </button>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" /> Sign out
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="size-4" /> Delete account
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-border bg-background/90 px-3 sm:px-4 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9 shrink-0 md:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 max-w-[85vw] bg-sidebar p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                {brand}
                {nav}
                <div className="space-y-1 border-t border-sidebar-border p-3">
                  <button
                    onClick={() => {
                      setOpen(false);
                      setRoleModalOpen(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <UserCheck className="size-4" /> Change role
                  </button>
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                  <button
                    onClick={() => {
                      setOpen(false);
                      setDeleteConfirm(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" /> Delete account
                  </button>
                </div>
              </SheetContent>
            </Sheet>
            <NotificationsBell />
            <div className="min-w-0 flex items-center gap-2">
              {isLoading ? (
                <Skeleton className="h-5 w-24 sm:w-32" />
              ) : (
                <>
                  <div className="min-w-0">
                    <p className="truncate text-xs sm:text-sm font-semibold max-w-[110px] sm:max-w-[180px]">{user?.fullName}</p>
                    <p className="truncate text-[10px] sm:text-xs text-muted-foreground">
                      {user ? roleLabels[user.role] : ""}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setRoleModalOpen(true)} className="h-7 px-2 text-[11px] sm:text-xs shrink-0">
                    Switch role
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirm(true)}
              className="h-8 px-2 sm:px-3 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Delete account</span>
            </Button>
            <Button variant="outline" size="icon" onClick={signOut} className="size-8 md:hidden" aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-3 sm:p-4 md:p-8 overflow-x-hidden">{children}</main>
      </div>

      {/* Role Selection Modal (Manual trigger only via menu) */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select your Yegara Role</DialogTitle>
            <DialogDescription>
              Choose how you want to use Yegara. You can switch your role anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <button
              disabled={savingRole}
              onClick={() => saveRole("owner")}
              className="flex items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent hover:border-primary"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary shrink-0">
                <Building2 className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground">Property owner</p>
                <p className="text-xs text-muted-foreground">List houses, manage rent schedules, approve tenants and track receipts.</p>
              </div>
            </button>
            <button
              disabled={savingRole}
              onClick={() => saveRole("tenant")}
              className="flex items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent hover:border-primary"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary shrink-0">
                <Home className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground">Tenant</p>
                <p className="text-xs text-muted-foreground">Find houses, upload rent receipts and submit maintenance requests.</p>
              </div>
            </button>
            <button
              disabled={savingRole}
              onClick={() => saveRole("guard")}
              className="flex items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent hover:border-primary"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary shrink-0">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground">Community guard</p>
                <p className="text-xs text-muted-foreground">View community directory, check occupied houses and read announcements.</p>
              </div>
            </button>
          </div>
          {savingRole && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Saving role...
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete your Yegara account? All your data, profile details, and property links will be permanently erased. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
            >
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Permanently delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
