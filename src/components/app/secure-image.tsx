import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getReceiptUrl, getMaintenanceImageUrl } from "@/lib/payments.functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Opens a private image behind a short-lived signed URL. */
export function SecureImageButton({
  kind,
  id,
  label = "View image",
  title = "Attachment",
}: {
  kind: "receipt" | "maintenance";
  id: string;
  label?: string;
  title?: string;
}) {
  const fetchReceipt = useServerFn(getReceiptUrl);
  const fetchMaintenance = useServerFn(getMaintenanceImageUrl);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function open() {
    setLoading(true);
    try {
      const result =
        kind === "receipt"
          ? await fetchReceipt({ data: { paymentId: id } })
          : await fetchMaintenance({ data: { requestId: id } });
      setUrl(result.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open the image.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={open} disabled={loading}>
        {loading && <Loader2 className="mr-2 size-3.5 animate-spin" />}
        {label}
      </Button>
      <Dialog open={url !== null} onOpenChange={(next) => !next && setUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {url && (
            <img
              src={url}
              alt={title}
              className="max-h-[70vh] w-full rounded-lg object-contain"
              loading="lazy"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
