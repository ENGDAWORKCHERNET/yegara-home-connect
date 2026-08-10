import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Receipt,
  Search,
  ShieldCheck,
  UserCheck,
  Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, type AppRole } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
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
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const items = navItems.filter((item) => !user || item.roles.includes(user.role));

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
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
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                {brand}
                {nav}
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              {isLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <>
                  <p className="truncate text-sm font-semibold">{user?.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user ? roleLabels[user.role] : ""}
                  </p>
                </>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut} className="md:hidden">
            <LogOut className="size-4" />
          </Button>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
