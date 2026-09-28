import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { getReceiptUrl, getMaintenanceImageUrl } from "@/lib/payments.functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Helper to download a file from a URL to the client's device */
export async function triggerDownload(url: string, filename: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch image file");
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    // Direct link fallback
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/** Standalone button to download a payment receipt directly */
export function DownloadReceiptButton({
  paymentId,
  filename = "receipt.jpg",
  variant = "outline",
  size = "sm",
  className = "",
  showText = true,
}: {
  paymentId: string;
  filename?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}) {
  const fetchReceipt = useServerFn(getReceiptUrl);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload(e?: React.MouseEvent) {
    e?.stopPropagation();
    setDownloading(true);
    try {
      const result = await fetchReceipt({ data: { paymentId } });
      await triggerDownload(result.url, filename);
      toast.success("Receipt download started.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not download receipt.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleDownload}
      disabled={downloading}
      title="Download receipt"
    >
      {downloading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Download className="size-3.5" />
      )}
      {showText && <span className="ml-1.5 hidden sm:inline">Download</span>}
    </Button>
  );
}

/** Opens a private image behind a short-lived signed URL with a download option. */
export function SecureImageButton({
  kind,
  id,
  label = "View image",
  title = "Attachment",
  filename,
}: {
  kind: "receipt" | "maintenance";
  id: string;
  label?: string;
  title?: string;
  filename?: string;
}) {
  const fetchReceipt = useServerFn(getReceiptUrl);
  const fetchMaintenance = useServerFn(getMaintenanceImageUrl);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

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

  async function handleDownload() {
    if (!url) return;
    setDownloading(true);
    try {
      const defaultName =
        filename ||
        (kind === "receipt" ? `receipt-${id.slice(0, 8)}.jpg` : `maintenance-${id.slice(0, 8)}.jpg`);
      await triggerDownload(url, defaultName);
      toast.success("Download started.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed.");
    } finally {
      setDownloading(false);
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
          <DialogHeader className="flex flex-row items-center justify-between pr-8">
            <DialogTitle>{title}</DialogTitle>
            {url && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                Download
              </Button>
            )}
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
