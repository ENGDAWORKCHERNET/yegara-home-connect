import { useEffect, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // Check if previously dismissed in this session/week
    const lastDismissed = localStorage.getItem("yegara_pwa_dismissed");
    if (lastDismissed && Date.now() - Number(lastDismissed) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    setDismissed(false);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // Capture standard PWA install prompt on Chromium browsers
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDismissed(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("yegara_pwa_dismissed", Date.now().toString());
  };

  if (isStandalone || dismissed) return null;
  // If neither Chromium prompt nor iOS, don't show
  if (!deferredPrompt && !isIOS) return null;

  return (
    <aside
      aria-label="Install Yegara App"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border border-primary/20 bg-background/95 p-4 shadow-xl backdrop-blur-md transition-all sm:bottom-6 sm:left-auto sm:right-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Smartphone className="size-6" />
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight text-foreground">
              Install Yegara App
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isIOS ? (
                <>
                  Tap <Share className="inline size-3.5 text-primary" /> Share and choose{" "}
                  <strong>Add to Home Screen</strong> for a full-screen app.
                </>
              ) : (
                "Install on your phone for faster access, offline mode & full-screen view."
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Dismiss banner"
        >
          <X className="size-4" />
        </button>
      </div>

      {!isIOS && deferredPrompt && (
        <div className="mt-3 flex justify-end gap-2 border-t border-border/60 pt-2.5">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleDismiss}>
            Not now
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleInstallClick}>
            <Download className="size-3.5" />
            Install App
          </Button>
        </div>
      )}
    </aside>
  );
}
