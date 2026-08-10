import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDate, rentUrgency } from "@/lib/rent";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "primary" | "accent" | "destructive";
}) {
  const tones = {
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent-soft text-accent-foreground",
    destructive: "bg-destructive-soft text-destructive",
  } as const;

  return (
    <Card className="shadow-card">
      <CardContent className="flex items-center gap-4 pt-6">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", tones[tone])}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-accent-soft text-accent-foreground" },
    verified: { label: "Verified", className: "bg-primary-soft text-primary" },
    paid: { label: "Paid", className: "bg-primary-soft text-primary" },
    late: { label: "Late", className: "bg-destructive-soft text-destructive" },
  };
  const item = map[status] ?? map["pending"]!;
  return <Badge className={cn("border-0", item.className)}>{item.label}</Badge>;
}

export function TrustBadge({ score }: { score: string }) {
  const map: Record<string, string> = {
    high: "bg-primary-soft text-primary",
    medium: "bg-accent-soft text-accent-foreground",
    low: "bg-destructive-soft text-destructive",
  };
  return (
    <Badge className={cn("border-0 capitalize", map[score] ?? map["low"])}>
      {score} trust
    </Badge>
  );
}

export function MaintenanceStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-destructive-soft text-destructive" },
    in_progress: { label: "In progress", className: "bg-accent-soft text-accent-foreground" },
    resolved: { label: "Resolved", className: "bg-primary-soft text-primary" },
  };
  const item = map[status] ?? map["pending"]!;
  return <Badge className={cn("border-0", item.className)}>{item.label}</Badge>;
}

export function DueDateBadge({ dueDate }: { dueDate: string }) {
  const urgency = rentUrgency(dueDate);
  const map = {
    overdue: { label: "Overdue", className: "bg-destructive-soft text-destructive" },
    due_soon: { label: "Due soon", className: "bg-accent-soft text-accent-foreground" },
    ok: { label: "On track", className: "bg-primary-soft text-primary" },
  } as const;
  const item = map[urgency];
  return (
    <span className="inline-flex items-center gap-2">
      <Badge className={cn("border-0", item.className)}>{item.label}</Badge>
      <span className="text-sm text-muted-foreground">{formatDate(dueDate)}</span>
    </span>
  );
}
