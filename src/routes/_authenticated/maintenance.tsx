import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Wrench } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMaintenanceRequests, usePlatformData } from "@/hooks/use-data";
import { uploadPrivateImage } from "@/lib/storage";
import { EmptyState, MaintenanceStatusBadge, PageHeader } from "@/components/app/ui-bits";
import { SecureImageButton } from "@/components/app/secure-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/rent";

export const Route = createFileRoute("/_authenticated/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance — Yegara" },
      { name: "description", content: "Report house issues with photos and track repairs." },
      { property: "og:title", content: "Maintenance — Yegara" },
      { property: "og:description", content: "Report and resolve house issues on Yegara." },
    ],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const { data: user } = useCurrentUser();
  const platform = usePlatformData();
  const requests = useMaintenanceRequests();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const create = useMutation({
    mutationFn: async ({ houseId, description }: { houseId: string; description: string }) => {
      if (!user) throw new Error("Not signed in.");
      const parsed = z.string().trim().min(5, "Describe the issue in a bit more detail").max(1000)
        .safeParse(description);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      let imagePath: string | null = null;
      if (file) imagePath = await uploadPrivateImage(user.id, "maintenance", file);
      const { error } = await supabase.from("maintenance_requests").insert({
        house_id: houseId,
        tenant_id: user.id,
        description: parsed.data,
        image_path: imagePath,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      setFile(null);
      toast.success("Issue reported.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("maintenance_requests")
        .update({ status: status as "pending" | "in_progress" | "resolved" })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      toast.success("Status updated.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!user || platform.isLoading || requests.isLoading) return <Skeleton className="h-64" />;

  const houses = platform.data?.houses ?? [];
  const assignments = platform.data?.assignments ?? [];
  const directory = platform.data?.directory ?? new Map();
  const rows = requests.data ?? [];
  const assignment = assignments.find((a) => a.tenant_id === user.id && a.status === "approved");
  const myHouse = assignment ? houses.find((h) => h.id === assignment.house_id) : null;

  return (
    <>
      <PageHeader
        title="Maintenance"
        description={
          user.role === "tenant"
            ? "Report a problem in your house and follow the repair status."
            : "Issues reported across your properties."
        }
      />

      {user.role === "tenant" && myHouse && (
        <Card className="mb-8 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Report an issue — House {myHouse.house_number}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                create.mutate({
                  houseId: myHouse.id,
                  description: String(form.get("description") ?? ""),
                });
                event.currentTarget.reset();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="description">What is wrong?</Label>
                <Textarea id="description" name="description" rows={3} maxLength={1000} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo">Photo (optional)</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </div>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Submit report
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={Wrench} title="No maintenance requests" />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const house = houses.find((h) => h.id === row.house_id);
            return (
              <Card key={row.id} className="shadow-card">
                <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-6">
                  <div className="max-w-xl space-y-1">
                    <p className="text-sm font-semibold">
                      House {house?.house_number ?? "—"} ·{" "}
                      {directory.get(row.tenant_id)?.full_name ?? "Tenant"}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(row.created_at)}</p>
                    <p className="text-sm">{row.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <MaintenanceStatusBadge status={row.status} />
                    {row.image_path && (
                      <SecureImageButton
                        kind="maintenance"
                        id={row.id}
                        label="Photo"
                        title="Maintenance photo"
                      />
                    )}
                    {user.role === "owner" && (
                      <Select
                        value={row.status}
                        onValueChange={(status) => setStatus.mutate({ id: row.id, status })}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
