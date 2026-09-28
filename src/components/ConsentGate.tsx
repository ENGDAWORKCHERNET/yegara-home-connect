import { useState, useRef, useEffect } from "react";
import { ChevronDown, ScrollText, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ConsentGateProps {
  onConsent: () => void;
}

export function ConsentGate({ onConsent }: ConsentGateProps) {
  const [agreed, setAgreed] = useState(false);
  const [showScrollArrow, setShowScrollArrow] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const checkScrollBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 16;
    setShowScrollArrow(!isAtBottom);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScrollBottom();
    el.addEventListener("scroll", checkScrollBottom, { passive: true });
    return () => el.removeEventListener("scroll", checkScrollBottom);
  }, []);

  const handleScrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleContinue = () => {
    if (!agreed) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("yegara_consent_shown", "true");
      localStorage.setItem("yegara_consent_agreed", "true");
    }
    onConsent();
  };

  return (
    <Card className="w-full max-w-[600px] shadow-card border-border">
      <CardHeader className="text-center pb-3 space-y-1">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-sm">
          <ScrollText className="size-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Before You Continue</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Please review and accept our Terms of Service
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Scrollable Container with Relative Anchor for Floating Arrow & Bottom Fade */}
        <div className="relative rounded-xl border border-border/80 bg-muted/20 p-1">
          <div
            ref={scrollRef}
            className="h-[300px] sm:h-[380px] overflow-y-auto px-4 py-3 text-sm leading-relaxed space-y-4 text-foreground/90 scroll-smooth pr-6"
            tabIndex={0}
            role="region"
            aria-label="Terms of Service summary"
          >
            <div className="border-b border-border/60 pb-2">
              <p className="font-semibold text-foreground text-base">
                Yegara Home Connect — Key Terms Summary
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Welcome to Yegara. Before you continue, please understand the following:
              </p>
            </div>

            <section className="space-y-1">
              <p className="font-semibold text-foreground">What Yegara Does:</p>
              <p className="text-muted-foreground">
                Yegara is a rent management platform. Tenants upload screenshots of rent payment receipts, and Owners verify them. That&apos;s it.
              </p>
            </section>

            <section className="space-y-1">
              <p className="font-semibold text-foreground">What Yegara Does NOT Do:</p>
              <p className="text-muted-foreground">
                We do NOT process payments. We do NOT verify receipt authenticity. We are NOT a party to any rental agreement. We are NOT responsible for disputes between Tenants and Owners.
              </p>
            </section>

            <section className="space-y-1">
              <p className="font-semibold text-foreground">Your Data:</p>
              <p className="text-muted-foreground">
                We collect your name, email, phone number, and any receipts you upload. We do NOT collect bank details or payment information. We do NOT sell your data. All data is encrypted in transit (TLS 1.2+) and at rest (AES-256).
              </p>
            </section>

            <section className="space-y-1">
              <p className="font-semibold text-foreground">Your Responsibilities:</p>
              <p className="text-muted-foreground">
                You must be 18 or older. You must upload only authentic receipts. You must not use the platform for fraud, harassment, or illegal activities. You are responsible for the accuracy of your information.
              </p>
            </section>

            <section className="space-y-1">
              <p className="font-semibold text-foreground">Your Rights:</p>
              <p className="text-muted-foreground">
                You can access, correct, or delete your data at any time. You can terminate your account at any time. You can request a copy of your data by emailing{" "}
                <a href="mailto:engdaworkchernet@outlook.com" className="text-primary underline">
                  engdaworkchernet@outlook.com
                </a>
                .
              </p>
            </section>

            <section className="space-y-1">
              <p className="font-semibold text-foreground">Platform Liability:</p>
              <p className="text-muted-foreground">
                Yegara is provided &quot;as is.&quot; We are not liable for disputes, non-payment, fraudulent receipts, or any damages beyond 1,000 ETB. This is a passive intermediary platform — all verification is done by the Owner, not by us.
              </p>
            </section>

            <section className="space-y-1">
              <p className="font-semibold text-foreground">Governing Law:</p>
              <p className="text-muted-foreground">
                These terms are governed by the laws of the Federal Democratic Republic of Ethiopia. Disputes are resolved in the courts of Addis Ababa.
              </p>
            </section>

            <section className="space-y-1">
              <p className="font-semibold text-foreground">Questions?</p>
              <p className="text-muted-foreground">
                Email{" "}
                <a href="mailto:engdaworkchernet@outlook.com" className="text-primary underline">
                  engdaworkchernet@outlook.com
                </a>
              </p>
            </section>

            <div className="pt-2 text-xs text-muted-foreground/80 border-t border-border/40">
              By checking the box below, you confirm that you have read, understood, and agree to the full Terms of Service.
            </div>
          </div>

          {/* Bottom Gradient Fade Hint */}
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-xl bg-gradient-to-t from-background/90 via-background/40 to-transparent transition-opacity duration-300 ${
              showScrollArrow ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Floating Smooth Scroll Down Arrow Button */}
          {showScrollArrow && (
            <button
              type="button"
              onClick={handleScrollToBottom}
              className="absolute bottom-3 right-4 z-10 flex size-8 items-center justify-center rounded-full border border-border bg-background/95 text-foreground shadow-md backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-muted active:scale-95 cursor-pointer"
              aria-label="Scroll to bottom"
              title="Scroll to bottom"
            >
              <ChevronDown className="size-4 animate-bounce" />
            </button>
          )}
        </div>

        {/* Read Full Terms Link */}
        <div className="flex justify-end pt-0.5">
          <a
            href="/terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline hover:text-primary/80"
          >
            <span>Read Full Terms (38 Sections)</span>
            <ExternalLink className="size-3" />
          </a>
        </div>

        {/* Consent Checkbox */}
        <div className="flex items-start space-x-2.5 rounded-lg border border-border/70 bg-card p-3 shadow-xs">
          <Checkbox
            id="gate-consent-checkbox"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(Boolean(checked))}
            className="mt-0.5"
          />
          <Label
            htmlFor="gate-consent-checkbox"
            className="text-xs sm:text-sm leading-relaxed font-normal text-muted-foreground cursor-pointer select-none"
          >
            I have read and agree to the{" "}
            <a
              href="/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium underline underline-offset-2 hover:text-primary/80"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium underline underline-offset-2 hover:text-primary/80"
            >
              Privacy Policy
            </a>
          </Label>
        </div>

        {/* Continue Button */}
        <Button
          type="button"
          onClick={handleContinue}
          disabled={!agreed}
          className="w-full text-sm font-semibold h-10 shadow-sm"
        >
          I Agree — Continue
        </Button>
      </CardContent>
    </Card>
  );
}
