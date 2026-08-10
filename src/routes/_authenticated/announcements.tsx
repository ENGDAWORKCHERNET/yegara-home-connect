import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Megaphone } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAnnouncements, usePlatformData } from "@/hooks/use-data";
import { EmptyState, PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/rent";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — Yegara" },
      { name: "description", content: "Notices from owners to everyone in the compound." },
      { property: "og:title", content: "Announcements — Yegara" },
      { property: "og:description", content: "Community notices on Yegara." },
    ],
  }),
  component: AnnouncementsPage,
});

const schema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(120),
  message: z.string().trim().min(5, "Message is too short").max(2000),
});

function AnnouncementsPage() {
  const { data: user } = useCurrentUser();
  const platform = usePlatformData();
  const announcements = useAnnouncements();
  const queryClient = useQueryClient();

  const post = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      if (!user) throw new Error("Not signed in.");
      const { error } = await supabase
        .from("announcements")
        .insert({ ...values, author_id: user.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement posted.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!user || announcements.isLoading || platform.isLoading) return <Skeleton className="h-64" />;

  const directory = platform.data?.directory ?? new Map();
  const rows = announcements.data ?? [];

  return (
    <>
      <PageHeader title="Announcements" description="Notices shared with everyone on the platform." />

      {user.role === "owner" && (
        <Card className="mb-8 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Post an announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const parsed = schema.safeParse({
                  title: form.get("title"),
                  message: form.get("message"),
                });
                if (!parsed.success) {
                  toast.error(parsed.error.issues[0]!.message);
                  return;
                }
                post.mutate(parsed.data);
                event.currentTarget.reset();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" maxLength={120} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" rows={4} maxLength={2000} required />
              </div>
              <Button type="submit" disabled={post.isPending}>
                {post.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Publish
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.id} className="shadow-card">
              <CardContent className="space-y-2 pt-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{row.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {directory.get(row.author_id)?.full_name ?? "Owner"} ·{" "}
                    {formatDateTime(row.created_at)}
                  </p>
                </div>
                <p className="text-sm whitespace-pre-line">{row.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
