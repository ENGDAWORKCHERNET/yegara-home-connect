import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Home, Loader2, Pencil, Plus, ShieldAlert } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { approvedTenantFor, usePlatformData, type House } from "@/hooks/use-data";
import { DueDateBadge, EmptyState, PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBirr } from "@/lib/rent";

export const Route = createFileRoute("/_authenticated/properties")({
  head: () => ({
    meta: [
      { title: "My properties — Yegara" },
      { name: "description", content: "Add and manage the houses you rent out on Yegara." },
      { property: "og:title", content: "My properties — Yegara" },
      { property: "og:description", content: "Add houses, set rent and track occupancy." },
    ],
  }),
  component: PropertiesPage,
});

const houseSchema = z.object({
  house_number: z.string().trim().min(1, "House number is required").max(40),
  description: z.string().trim().max(500),
  rent_amount: z.number().min(0, "Rent must be positive").max(10_000_000),
  recurrence: z.enum(["monthly", "quarterly", "yearly"]),
  next_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid due date"),
});

function HouseForm({
  house,
  onDone,
}: {
  house?: House;
  onDone: () => void;
}) {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof houseSchema>) => {
      if (!user) throw new Error("Not signed in.");
      if (house) {
        const { error } = await supabase.from("houses").update(values).eq("id", house.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("houses").insert({ ...values, owner_id: user.id });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-data"] });
      toast.success(house ? "House updated." : "House added.");
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = houseSchema.safeParse({
      house_number: form.get("house_number"),
      description: form.get("description") ?? "",
      rent_amount: Number(form.get("rent_amount")),
      recurrence: form.get("recurrence"),
      next_due_date: form.get("next_due_date"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    mutation.mutate(parsed.data);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="house_number">House number</Label>
        <Input
          id="house_number"
          name="house_number"
          defaultValue={house?.house_number}
          maxLength={40}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rent_amount">Rent amount (ETB)</Label>
        <Input
          id="rent_amount"
          name="rent_amount"
          type="number"
          min={0}
          step="0.01"
          defaultValue={house ? Number(house.rent_amount) : undefined}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="recurrence">Recurrence</Label>
          <Select name="recurrence" defaultValue={house?.recurrence ?? "monthly"}>
            <SelectTrigger id="recurrence">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="next_due_date">Next due date</Label>
          <Input
            id="next_due_date"
            name="next_due_date"
            type="date"
            defaultValue={house?.next_due_date}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={house?.description}
          maxLength={500}
          rows={3}
        />
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
        {house ? "Save changes" : "Add house"}
      </Button>
    </form>
  );
}

function PropertiesPage() {
  const { data: user } = useCurrentUser();
  const platform = usePlatformData();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<House | null>(null);

  if (!user || platform.isLoading) return <Skeleton className="h-64" />;

  if (user.role !== "owner") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Owners only"
        description="This section is available to property owners."
      />
    );
  }

  const houses = (platform.data?.houses ?? []).filter((h) => h.owner_id === user.id);
  const assignments = platform.data?.assignments ?? [];
  const directory = platform.data?.directory ?? new Map();

  return (
    <>
      <PageHeader
        title="My properties"
        description="Every house you rent out, with its rent schedule and current tenant."
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" /> Add house
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a house</DialogTitle>
                <DialogDescription>Set the rent amount and payment schedule.</DialogDescription>
              </DialogHeader>
              <HouseForm onDone={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      {houses.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No houses yet"
          description="Add your first property to start receiving tenant requests."
          action={<Button onClick={() => setAddOpen(true)}>Add house</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {houses.map((house) => {
            const tenantAssignment = approvedTenantFor(assignments, house.id);
            const tenant = tenantAssignment ? directory.get(tenantAssignment.tenant_id) : null;
            return (
              <Card key={house.id} className="shadow-card">
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold">House {house.house_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatBirr(house.rent_amount)} · {house.recurrence}
                      </p>
                    </div>
                    <Badge
                      className={
                        tenant
                          ? "border-0 bg-primary-soft text-primary"
                          : "border-0 bg-accent-soft text-accent-foreground"
                      }
                    >
                      {tenant ? "Occupied" : "Vacant"}
                    </Badge>
                  </div>

                  {house.description && (
                    <p className="text-sm text-muted-foreground">{house.description}</p>
                  )}

                  <DueDateBadge dueDate={house.next_due_date} />

                  <div className="rounded-lg bg-muted p-3 text-sm">
                    {tenant ? (
                      <>
                        <p className="font-medium">{tenant.full_name}</p>
                        <p className="text-muted-foreground">{tenant.phone || "No phone"}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No tenant assigned</p>
                    )}
                  </div>

                  <Button variant="outline" size="sm" onClick={() => setEditing(house)}>
                    <Pencil className="mr-2 size-3.5" /> Edit details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit house {editing?.house_number}</DialogTitle>
            <DialogDescription>Update rent, schedule or description.</DialogDescription>
          </DialogHeader>
          {editing && <HouseForm house={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
