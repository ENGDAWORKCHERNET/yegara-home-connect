import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bath,
  Bed,
  Building2,
  Home,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserX,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { approvedTenantFor, usePlatformData, type House, type Building } from "@/hooks/use-data";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
      { name: "description", content: "Add and manage the houses and buildings you rent out on Yegara." },
      { property: "og:title", content: "My properties — Yegara" },
      { property: "og:description", content: "Add houses, set rent and track occupancy." },
    ],
  }),
  component: PropertiesPage,
});

const buildingSchema = z.object({
  name: z.string().trim().min(1, "Building name is required").max(100),
  location: z.string().trim().max(100).optional(),
  description: z.string().trim().max(500).optional(),
});

function BuildingForm({
  building,
  onDelete,
  onDone,
}: {
  building?: Building;
  onDelete?: () => void;
  onDone: () => void;
}) {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof buildingSchema>) => {
      if (!user) throw new Error("Not signed in.");
      if (building) {
        const { error } = await supabase
          .from("buildings")
          .update({ ...values, updated_at: new Date().toISOString() })
          .eq("id", building.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("buildings")
          .insert({
            name: values.name,
            location: values.location || "Addis Ababa, Ethiopia",
            description: values.description || "",
            owner_id: user.id,
          });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-data"] });
      toast.success(building ? "Building updated." : "Building created.");
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = buildingSchema.safeParse({
      name: form.get("name"),
      location: form.get("location") || "Addis Ababa, Ethiopia",
      description: form.get("description") || "",
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
        <Label htmlFor="building_name">Building / Compound Name</Label>
        <Input
          id="building_name"
          name="name"
          placeholder="e.g. Bole Sunshine Complex, Yegara Residences..."
          defaultValue={building?.name}
          maxLength={100}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="building_location">Location / City</Label>
        <Input
          id="building_location"
          name="location"
          placeholder="e.g. Bole, Addis Ababa, Ethiopia"
          defaultValue={building?.location || "Addis Ababa, Ethiopia"}
          maxLength={100}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="building_description">Description (optional)</Label>
        <Textarea
          id="building_description"
          name="description"
          placeholder="Property features, security notes, commercial use details..."
          defaultValue={building?.description || ""}
          maxLength={500}
          rows={3}
        />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {building ? "Save building changes" : "Create building"}
        </Button>
        {building && onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            className="px-3"
            title="Delete building"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </form>
  );
}

function MultiBuildingContactDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary mb-2">
            <Building2 className="size-6" />
          </div>
          <DialogTitle className="text-center text-xl">Manage Multiple Buildings?</DialogTitle>
          <DialogDescription className="text-center text-sm pt-1">
            Standard owner accounts include 1 managed building. To add additional buildings or commercial compounds, please contact us for custom activation and plan details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <a
            href="mailto:engdaworkmichael2@gmail.com?subject=Additional%20Building%20Activation%20Inquiry%20-%20Yegara"
            className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Mail className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Email Support</p>
                <p className="text-xs text-muted-foreground">engdaworkmichael2@gmail.com</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-primary group-hover:underline">Send Email →</span>
          </a>

          <a
            href="tel:+251965290270"
            className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Phone className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Call / Telegram</p>
                <p className="text-xs text-muted-foreground">0965290270 / +251 965 290 270</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-primary group-hover:underline">Call Now →</span>
          </a>
        </div>

        <div className="pt-2">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const houseSchema = z.object({
  house_number: z.string().trim().min(1, "House number is required").max(40),
  description: z.string().trim().max(500),
  rent_amount: z.number().min(0, "Rent must be positive").max(10_000_000),
  recurrence: z.enum(["monthly", "quarterly", "yearly"]),
  next_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid due date"),
  building_id: z.string().nullable().optional(),
  bedrooms: z.number().min(0).max(50).nullable().optional(),
  bathrooms: z.number().min(0).max(50).nullable().optional(),
});

function HouseForm({
  house,
  buildings = [],
  onOpenMultiBuildingContact,
  onDelete,
  onDone,
}: {
  house?: House;
  buildings?: Building[];
  onOpenMultiBuildingContact?: () => void;
  onDelete?: () => void;
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

    const rawBedrooms = form.get("bedrooms");
    const rawBathrooms = form.get("bathrooms");
    const rawBuildingId = form.get("building_id");

    const bedrooms =
      rawBedrooms !== null && String(rawBedrooms).trim() !== "" ? Number(rawBedrooms) : null;
    const bathrooms =
      rawBathrooms !== null && String(rawBathrooms).trim() !== "" ? Number(rawBathrooms) : null;
    const building_id =
      rawBuildingId !== null && String(rawBuildingId).trim() !== "" && String(rawBuildingId) !== "none"
        ? String(rawBuildingId)
        : null;

    const parsed = houseSchema.safeParse({
      house_number: form.get("house_number"),
      description: form.get("description") ?? "",
      rent_amount: Number(form.get("rent_amount")),
      recurrence: form.get("recurrence"),
      next_due_date: form.get("next_due_date"),
      building_id,
      bedrooms,
      bathrooms,
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
        <Label htmlFor="house_number">House / Unit number</Label>
        <Input
          id="house_number"
          name="house_number"
          placeholder="e.g. 734/2 or Shop #12"
          defaultValue={house?.house_number}
          maxLength={40}
          required
        />
      </div>

      {buildings.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="building_id">Building / Compound</Label>
            {onOpenMultiBuildingContact && (
              <button
                type="button"
                onClick={onOpenMultiBuildingContact}
                className="text-xs text-primary hover:underline font-medium"
              >
                + Add another building
              </button>
            )}
          </div>
          <Select name="building_id" defaultValue={house?.building_id ?? buildings[0]?.id ?? "none"}>
            <SelectTrigger id="building_id">
              <SelectValue placeholder="Select building" />
            </SelectTrigger>
            <SelectContent>
              {buildings.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name} {b.location ? `(${b.location})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Optional Bedrooms & Bathrooms (blank for commercial properties) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bedrooms" className="text-xs sm:text-sm">
            Bedrooms <span className="text-muted-foreground text-xs">(optional / commercial)</span>
          </Label>
          <Input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min={0}
            max={50}
            placeholder="Leave blank if commercial"
            defaultValue={house?.bedrooms ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bathrooms" className="text-xs sm:text-sm">
            Bathrooms <span className="text-muted-foreground text-xs">(optional / commercial)</span>
          </Label>
          <Input
            id="bathrooms"
            name="bathrooms"
            type="number"
            min={0}
            max={50}
            placeholder="Leave blank if commercial"
            defaultValue={house?.bathrooms ?? ""}
          />
        </div>
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
          placeholder="Property details, floor level, commercial use notes..."
          defaultValue={house?.description}
          maxLength={500}
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {house ? "Save changes" : "Add house"}
        </Button>
        {house && onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            className="px-3"
            title="Delete house"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </form>
  );
}

function PropertiesPage() {
  const { data: user } = useCurrentUser();
  const platform = usePlatformData();
  const queryClient = useQueryClient();

  const [addHouseOpen, setAddHouseOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [addBuildingOpen, setAddBuildingOpen] = useState(false);
  const [multiBuildingPromptOpen, setMultiBuildingPromptOpen] = useState(false);
  const [removingTarget, setRemovingTarget] = useState<{ assignmentId: string; houseNumber: string; tenantName: string } | null>(null);
  const [deletingHouseTarget, setDeletingHouseTarget] = useState<House | null>(null);
  const [deletingBuildingTarget, setDeletingBuildingTarget] = useState<Building | null>(null);

  const removeTenantMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase.from("tenant_assignments").delete().eq("id", assignmentId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-data"] });
      toast.success("Tenant removed from house.");
      setRemovingTarget(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteHouseMutation = useMutation({
    mutationFn: async (houseId: string) => {
      const { error } = await supabase.from("houses").delete().eq("id", houseId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-data"] });
      toast.success("House deleted successfully.");
      setDeletingHouseTarget(null);
      setEditingHouse(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteBuildingMutation = useMutation({
    mutationFn: async (buildingId: string) => {
      // 1. Unlink houses from this building first
      const { error: unlinkError } = await supabase
        .from("houses")
        .update({ building_id: null })
        .eq("building_id", buildingId);
      if (unlinkError) throw new Error(unlinkError.message);

      // 2. Delete the building
      const { error } = await supabase.from("buildings").delete().eq("id", buildingId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-data"] });
      toast.success("Building deleted.");
      setDeletingBuildingTarget(null);
      setEditingBuilding(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

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

  const buildings = platform.data?.buildings ?? [];
  const ownerBuildings = buildings.filter((b) => b.owner_id === user.id);
  const houses = (platform.data?.houses ?? []).filter((h) => h.owner_id === user.id);
  const assignments = platform.data?.assignments ?? [];
  const directory = platform.data?.directory ?? new Map();

  const hasBuilding = ownerBuildings.length > 0;
  const primaryBuilding = ownerBuildings[0];

  function handleAddBuildingClick() {
    if (ownerBuildings.length >= 1) {
      setMultiBuildingPromptOpen(true);
    } else {
      setAddBuildingOpen(true);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My properties"
        description="Every house and building you rent out, with its rent schedule and current tenant."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleAddBuildingClick}>
              <Building2 className="mr-1.5 size-4" />
              {hasBuilding ? "My Building" : "Name Building"}
            </Button>

            <Dialog open={addHouseOpen} onOpenChange={setAddHouseOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-1.5 size-4" /> Add house
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a house or unit</DialogTitle>
                  <DialogDescription>Set the rent amount, unit number, and optional bedrooms/bathrooms.</DialogDescription>
                </DialogHeader>
                <HouseForm
                  buildings={ownerBuildings}
                  onOpenMultiBuildingContact={() => {
                    setAddHouseOpen(false);
                    setMultiBuildingPromptOpen(true);
                  }}
                  onDone={() => setAddHouseOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Building Summary / Name Onboarding Card */}
      {hasBuilding ? (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary-soft to-background shadow-xs">
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <Building2 className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{primaryBuilding.name}</h2>
                  <Badge variant="secondary" className="text-[11px] font-semibold">
                    {houses.length} {houses.length === 1 ? "unit" : "units"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="size-3 text-primary" />
                  <span>{primaryBuilding.location || "Addis Ababa, Ethiopia"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => setEditingBuilding(primaryBuilding)}
              >
                <Pencil className="mr-1.5 size-3" /> Edit Building Name
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeletingBuildingTarget(primaryBuilding)}
                title="Delete building"
              >
                <Trash2 className="size-3.5 mr-1" /> Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 text-muted-foreground hover:text-foreground"
                onClick={() => setMultiBuildingPromptOpen(true)}
              >
                + Add Another Building
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-accent/40 bg-accent/5 shadow-xs">
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/20 text-accent">
                <Sparkles className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold text-sm">Give your building or compound a name</h3>
                <p className="text-xs text-muted-foreground">
                  Customizing your building name makes it easier for prospective tenants to identify and find your listings.
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => setAddBuildingOpen(true)} className="shrink-0">
              <Building2 className="mr-1.5 size-3.5" /> Add & Name Building
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Houses List */}
      {houses.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No houses yet"
          description="Add your first property or unit to start receiving tenant requests."
          action={<Button onClick={() => setAddHouseOpen(true)}>Add house</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {houses.map((house) => {
            const tenantAssignment = approvedTenantFor(assignments, house.id);
            const tenant = tenantAssignment ? directory.get(tenantAssignment.tenant_id) : null;
            const building = buildings.find((b) => b.id === house.building_id);
            const hasBedrooms = house.bedrooms != null && house.bedrooms > 0;
            const hasBathrooms = house.bathrooms != null && house.bathrooms > 0;

            return (
              <Card key={house.id} className="shadow-card">
                <CardContent className="space-y-3 p-4 sm:pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-base sm:text-lg font-semibold truncate">House {house.house_number}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {formatBirr(house.rent_amount)} · {house.recurrence}
                      </p>
                      {building && (
                        <p className="text-xs text-primary font-medium flex items-center gap-1 mt-0.5">
                          <Building2 className="size-3" /> {building.name}
                        </p>
                      )}
                    </div>
                    <Badge
                      className={
                        tenant
                          ? "border-0 bg-primary-soft text-primary shrink-0 text-xs"
                          : "border-0 bg-accent-soft text-accent-foreground shrink-0 text-xs"
                      }
                    >
                      {tenant ? "Occupied" : "Vacant"}
                    </Badge>
                  </div>

                  {/* Optional Room & Bath info (hidden for commercial / unset) */}
                  {(hasBedrooms || hasBathrooms) && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/40 rounded-md px-2.5 py-1.5">
                      {hasBedrooms && (
                        <span className="inline-flex items-center gap-1">
                          <Bed className="size-3.5 text-primary" />
                          {house.bedrooms} {house.bedrooms === 1 ? "Bed" : "Beds"}
                        </span>
                      )}
                      {hasBathrooms && (
                        <span className="inline-flex items-center gap-1">
                          <Bath className="size-3.5 text-primary" />
                          {house.bathrooms} {house.bathrooms === 1 ? "Bath" : "Baths"}
                        </span>
                      )}
                    </div>
                  )}

                  {house.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{house.description}</p>
                  )}

                  <DueDateBadge dueDate={house.next_due_date} />

                  <div className="rounded-lg bg-muted p-2.5 sm:p-3 text-xs sm:text-sm">
                    {tenant && tenantAssignment ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{tenant.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{tenant.phone || "No phone"}</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full sm:w-auto h-7 px-2 text-xs"
                          disabled={removeTenantMutation.isPending}
                          onClick={() => setRemovingTarget({ assignmentId: tenantAssignment.id, houseNumber: house.house_number, tenantName: tenant.full_name })}
                        >
                          <UserX className="mr-1 size-3" /> Remove
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No tenant assigned</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => setEditingHouse(house)}>
                      <Pencil className="mr-1.5 size-3.5" /> Edit details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeletingHouseTarget(house)}
                      title="Delete house"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit House Dialog */}
      <Dialog open={editingHouse !== null} onOpenChange={(open) => !open && setEditingHouse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit house {editingHouse?.house_number}</DialogTitle>
            <DialogDescription>Update rent, schedule, building, or description.</DialogDescription>
          </DialogHeader>
          {editingHouse && (
            <HouseForm
              house={editingHouse}
              buildings={ownerBuildings}
              onOpenMultiBuildingContact={() => {
                setEditingHouse(null);
                setMultiBuildingPromptOpen(true);
              }}
              onDelete={() => {
                const h = editingHouse;
                setEditingHouse(null);
                setDeletingHouseTarget(h);
              }}
              onDone={() => setEditingHouse(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Building Dialog */}
      <Dialog open={addBuildingOpen} onOpenChange={setAddBuildingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add & Name Building</DialogTitle>
            <DialogDescription>Name your building or residential compound.</DialogDescription>
          </DialogHeader>
          <BuildingForm onDone={() => setAddBuildingOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Building Dialog */}
      <Dialog open={editingBuilding !== null} onOpenChange={(open) => !open && setEditingBuilding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Building Name & Details</DialogTitle>
            <DialogDescription>Update your building name, location, and description.</DialogDescription>
          </DialogHeader>
          {editingBuilding && (
            <BuildingForm
              building={editingBuilding}
              onDelete={() => {
                const b = editingBuilding;
                setEditingBuilding(null);
                setDeletingBuildingTarget(b);
              }}
              onDone={() => setEditingBuilding(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Multi-Building Upgrade Contact Modal */}
      <MultiBuildingContactDialog
        open={multiBuildingPromptOpen}
        onOpenChange={setMultiBuildingPromptOpen}
      />

      {/* Remove Tenant Confirmation Dialog */}
      <AlertDialog open={removingTarget !== null} onOpenChange={(open) => !open && setRemovingTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{removingTarget?.tenantName}</strong> from House <strong>{removingTarget?.houseNumber}</strong>? The house will become vacant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeTenantMutation.isPending}
              onClick={() => {
                if (removingTarget) removeTenantMutation.mutate(removingTarget.assignmentId);
              }}
            >
              {removeTenantMutation.isPending ? "Removing..." : "Remove tenant"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete House Confirmation Dialog */}
      <AlertDialog open={deletingHouseTarget !== null} onOpenChange={(open) => !open && setDeletingHouseTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete House {deletingHouseTarget?.house_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this house? All associated records (tenant assignments, payment history, maintenance requests) will also be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteHouseMutation.isPending}
              onClick={() => {
                if (deletingHouseTarget) deleteHouseMutation.mutate(deletingHouseTarget.id);
              }}
            >
              {deleteHouseMutation.isPending ? "Deleting..." : "Delete House"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Building Confirmation Dialog */}
      <AlertDialog open={deletingBuildingTarget !== null} onOpenChange={(open) => !open && setDeletingBuildingTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Building &quot;{deletingBuildingTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this building? Any units currently in this building will be preserved but unlinked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteBuildingMutation.isPending}
              onClick={() => {
                if (deletingBuildingTarget) deleteBuildingMutation.mutate(deletingBuildingTarget.id);
              }}
            >
              {deleteBuildingMutation.isPending ? "Deleting..." : "Delete Building"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

