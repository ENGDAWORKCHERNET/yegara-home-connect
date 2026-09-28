import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bath,
  Bed,
  Building2,
  CheckCircle2,
  Home,
  MapPin,
  Search,
  ShieldAlert,
  User as UserIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { approvedTenantFor, usePlatformData, type Building, type House } from "@/hooks/use-data";
import { EmptyState, PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { formatDate } from "@/lib/rent";

export const Route = createFileRoute("/_authenticated/find-houses")({
  head: () => ({
    meta: [
      { title: "Find a house — Yegara" },
      { name: "description", content: "Browse available buildings and request to rent a house." },
      { property: "og:title", content: "Find a house — Yegara" },
      { property: "og:description", content: "Available rentals grouped by building from verified owners." },
    ],
  }),
  component: FindHousesPage,
});

function FindHousesPage() {
  const { data: user } = useCurrentUser();
  const platform = usePlatformData();
  const queryClient = useQueryClient();

  const [selectedBuildingId, setSelectedBuildingId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [houseToRequest, setHouseToRequest] = React.useState<House | null>(null);

  const request = useMutation({
    mutationFn: async (houseId: string) => {
      if (!user) throw new Error("Not signed in.");
      const { error } = await supabase
        .from("tenant_assignments")
        .insert({ house_id: houseId, tenant_id: user.id, status: "pending" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-data"] });
      toast.success("Request sent to the owner.");
      setHouseToRequest(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setHouseToRequest(null);
    },
  });

  if (!user || platform.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden shadow-card">
              <Skeleton className="h-32 w-full" />
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (user.role !== "tenant") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Tenants only"
        description="Only tenants can browse and request houses."
      />
    );
  }

  const houses = platform.data?.houses ?? [];
  const buildings = platform.data?.buildings ?? [];
  const assignments = platform.data?.assignments ?? [];
  const directory = platform.data?.directory ?? new Map();

  const activeOwn = assignments.find(
    (a) => a.tenant_id === user.id && (a.status === "pending" || a.status === "approved"),
  );

  // Group houses by building_id
  const housesByBuilding = new Map<string, House[]>();
  for (const house of houses) {
    const bId = house.building_id || "unassigned";
    if (!housesByBuilding.has(bId)) {
      housesByBuilding.set(bId, []);
    }
    housesByBuilding.get(bId)!.push(house);
  }

  // Calculate available houses count per building
  const getAvailableCount = (buildingId: string) => {
    const buildingHouses = housesByBuilding.get(buildingId) ?? [];
    return buildingHouses.filter((h) => !approvedTenantFor(assignments, h.id)).length;
  };

  // Selected building object (if in View 2)
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);
  const selectedBuildingHouses = selectedBuildingId
    ? (housesByBuilding.get(selectedBuildingId) ?? [])
    : [];

  // Filtered buildings for View 1
  const filteredBuildings = buildings.filter((b) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = b.name.toLowerCase().includes(query);
    const locMatch = (b.location ?? "").toLowerCase().includes(query);
    const descMatch = (b.description ?? "").toLowerCase().includes(query);
    return nameMatch || locMatch || descMatch;
  });

  return (
    <div className="space-y-6">
      {/* Active Rental Banner */}
      {activeOwn && (
        <Card className="border-accent/40 bg-accent/5 shadow-sm">
          <CardContent className="flex items-center gap-3 py-4 text-sm font-medium">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/20 text-accent">
              <CheckCircle2 className="size-4" />
            </span>
            <div>
              You already have {activeOwn.status === "approved" ? "an approved rental" : "a pending request"}.
              Cancelling is done by contacting the owner directly.
            </div>
          </CardContent>
        </Card>
      )}

      {/* VIEW 2: HOUSES INSIDE SELECTED BUILDING */}
      {selectedBuilding ? (
        <div className="space-y-6">
          {/* Breadcrumb / Back button */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedBuildingId(null)}
              className="gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="size-3.5" />
              All Buildings
            </Button>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs font-semibold text-foreground truncate">{selectedBuilding.name}</span>
          </div>

          {/* Building Hero Info */}
          <Card className="shadow-card border-border/70 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-primary-soft to-background p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2">
                    <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                      <Building2 className="size-5" />
                    </span>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        {selectedBuilding.name}
                      </h1>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5 text-primary" />
                          {selectedBuilding.location || "Addis Ababa, Ethiopia"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <UserIcon className="size-3.5 text-muted-foreground" />
                          Owner: {directory.get(selectedBuilding.owner_id)?.full_name ?? "Verified Owner"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {selectedBuilding.description && (
                    <p className="text-sm text-muted-foreground max-w-2xl pt-1">
                      {selectedBuilding.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">
                    {getAvailableCount(selectedBuilding.id)} of {selectedBuildingHouses.length} units available
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Units Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Units & Houses</h2>
              <span className="text-xs text-muted-foreground">
                Showing {selectedBuildingHouses.length} {selectedBuildingHouses.length === 1 ? "unit" : "units"}
              </span>
            </div>

            {selectedBuildingHouses.length === 0 ? (
              <EmptyState
                icon={Home}
                title="No units registered"
                description="This building has no units listed at the moment."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selectedBuildingHouses.map((house) => {
                  const isApproved = approvedTenantFor(assignments, house.id);
                  const isMyPending = assignments.some(
                    (a) => a.house_id === house.id && a.tenant_id === user.id && a.status === "pending",
                  );
                  const isAvailable = !isApproved;

                  return (
                    <Card
                      key={house.id}
                      className={`shadow-card flex flex-col justify-between transition-all duration-200 ${
                        isAvailable ? "border-border/80 hover:border-primary/40" : "opacity-75 bg-muted/30"
                      }`}
                    >
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
                              <Home className="size-4" />
                            </span>
                            <div>
                              <p className="font-semibold text-base leading-tight">
                                House {house.house_number}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Next due: {formatDate(house.next_due_date)}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={isAvailable ? (isMyPending ? "outline" : "default") : "secondary"}
                            className="text-[11px] font-medium"
                          >
                            {isAvailable ? (isMyPending ? "Request Sent" : "Available") : "Occupied"}
                          </Badge>
                        </div>

                        {/* Room & Bath info (hidden for commercial / unset) */}
                        {((house.bedrooms != null && house.bedrooms > 0) ||
                          (house.bathrooms != null && house.bathrooms > 0)) && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2.5">
                            {house.bedrooms != null && house.bedrooms > 0 && (
                              <span className="inline-flex items-center gap-1.5 font-medium">
                                <Bed className="size-3.5 text-primary" />
                                {house.bedrooms} {house.bedrooms === 1 ? "Bedroom" : "Bedrooms"}
                              </span>
                            )}
                            {house.bathrooms != null && house.bathrooms > 0 && (
                              <span className="inline-flex items-center gap-1.5 font-medium">
                                <Bath className="size-3.5 text-primary" />
                                {house.bathrooms} {house.bathrooms === 1 ? "Bathroom" : "Bathrooms"}
                              </span>
                            )}
                          </div>
                        )}

                        {house.description ? (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {house.description}
                          </p>
                        ) : null}

                        <Button
                          className="w-full mt-2"
                          size="sm"
                          disabled={!isAvailable || Boolean(activeOwn) || request.isPending}
                          onClick={() => setHouseToRequest(house)}
                        >
                          {isMyPending ? "Requested" : "Request House"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VIEW 1: BUILDING CARDS GRID */
        <div className="space-y-6">
          <PageHeader
            title="Find a house"
            description="Browse buildings and compounds to find available rentals. You can submit one active request at a time."
          />

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by building name or location..."
              className="pl-9 bg-background shadow-xs"
            />
          </div>

          {filteredBuildings.length === 0 ? (
            <EmptyState
              icon={Search}
              title={searchQuery ? "No matching buildings" : "No buildings available yet"}
              description={
                searchQuery
                  ? "Try searching for a different building name or location."
                  : "Check back soon — owners add new properties regularly."
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBuildings.map((building) => {
                const totalUnits = (housesByBuilding.get(building.id) ?? []).length;
                const availableUnits = getAvailableCount(building.id);
                const ownerName = directory.get(building.owner_id)?.full_name ?? "Verified Owner";

                return (
                  <Card
                    key={building.id}
                    onClick={() => setSelectedBuildingId(building.id)}
                    className="group overflow-hidden shadow-card border-border/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/50 cursor-pointer flex flex-col justify-between"
                  >
                    {/* Visual Card Header */}
                    <div className="bg-gradient-to-br from-primary/15 via-primary-soft to-accent/10 p-6 flex items-center justify-between border-b border-border/50">
                      <span className="grid size-12 place-items-center rounded-2xl bg-background/90 text-primary shadow-xs group-hover:scale-105 transition-transform">
                        <Building2 className="size-6" />
                      </span>
                      <Badge
                        variant={availableUnits > 0 ? "default" : "secondary"}
                        className="text-xs font-semibold shadow-xs"
                      >
                        {availableUnits > 0
                          ? `${availableUnits} ${availableUnits === 1 ? "unit" : "units"} available`
                          : "Fully occupied"}
                      </Badge>
                    </div>

                    <CardContent className="space-y-3 p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {building.name}
                        </h3>

                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-primary shrink-0" />
                            <span className="truncate">{building.location || "Addis Ababa, Ethiopia"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">Owner: {ownerName}</span>
                          </div>
                        </div>

                        {building.description ? (
                          <p className="text-xs text-muted-foreground line-clamp-2 pt-1">
                            {building.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {totalUnits} {totalUnits === 1 ? "total unit" : "total units"}
                        </span>
                        <span className="font-semibold text-primary group-hover:underline">
                          View units →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog for Requesting a House */}
      <AlertDialog open={Boolean(houseToRequest)} onOpenChange={(open) => !open && setHouseToRequest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request to rent House {houseToRequest?.house_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Your rental request will be submitted to the property owner. You can have one active request at a time.
              Once approved, the owner will contact you directly to finalize your move-in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={request.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={request.isPending}
              onClick={() => {
                if (houseToRequest) {
                  request.mutate(houseToRequest.id);
                }
              }}
            >
              {request.isPending ? "Submitting..." : "Confirm Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

