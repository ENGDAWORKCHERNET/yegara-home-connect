export type Recurrence = "monthly" | "quarterly" | "yearly";

export function addRecurrence(date: Date, recurrence: Recurrence): Date {
  const next = new Date(date.getTime());
  if (recurrence === "monthly") next.setMonth(next.getMonth() + 1);
  else if (recurrence === "quarterly") next.setMonth(next.getMonth() + 3);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

export function nextDueDateFrom(currentDue: string, recurrence: Recurrence): string {
  const base = new Date(`${currentDue}T00:00:00`);
  const today = startOfToday();
  let next = addRecurrence(base, recurrence);
  // If the due date is far in the past, roll forward until it is in the future.
  let guard = 0;
  while (next < today && guard < 120) {
    next = addRecurrence(next, recurrence);
    guard += 1;
  }
  return toDateString(next);
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function toDateString(date: Date): string {
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function daysUntil(dueDate: string): number {
  const due = new Date(`${dueDate}T00:00:00`);
  return Math.round((due.getTime() - startOfToday().getTime()) / 86_400_000);
}

export type RentUrgency = "overdue" | "due_soon" | "ok";

export function rentUrgency(dueDate: string): RentUrgency {
  const days = daysUntil(dueDate);
  if (days < 0) return "overdue";
  if (days <= 3) return "due_soon";
  return "ok";
}

export function formatBirr(amount: number | string | null | undefined): string {
  const value = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)} ETB`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
