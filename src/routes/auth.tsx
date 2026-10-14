import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, Loader2, Eye, EyeOff } from "lucide-react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { supabase } from "@/integrations/supabase/client";
import { ConsentGate } from "@/components/ConsentGate";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot", "reset"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Yegara Housing Platform" },
      {
        name: "description",
        content:
          "Log in or create a Yegara account as a property owner, tenant or community guard.",
      },
      { property: "og:title", content: "Sign in — Yegara Housing Platform" },
      {
        property: "og:description",
        content: "Access your Yegara dashboard for rent, receipts and maintenance.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  // Top-level tab: 'phone' or 'email'
  const [tab, setTab] = useState<"phone" | "email">("phone");
  // Phone flow step: 'phone' or 'otp'
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  // Email sub-tabs (preserved for future email migration)
  const [emailSubTab, setEmailSubTab] = useState<"signin" | "signup">(
    search.mode === "signup" ? "signup" : "signin"
  );
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  // Consent gate state for email signup
  const [gatePassed, setGatePassed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    if (search.mode === "reset") return true;
    return (
      sessionStorage.getItem("yegara_consent_shown") === "true" ||
      localStorage.getItem("yegara_consent_agreed") === "true"
    );
  });

  // Phone OTP: Step 1 - Send SMS verification code
  async function handleSendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const raw = String(form.get("phone") ?? "").trim();

    // Normalize to +251XXXXXXXXX
    const digits = raw.replace(/\D/g, "").replace(/^0/, "");
    if (digits.length < 9) {
      toast.error("Please enter a valid Ethiopian phone number.");
      return;
    }
    const fullPhone = `+251${digits}`;

    setLoading(true);
    try {
      // Clean up any existing verifier
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {
          /* ignore */
        }
        window.recaptchaVerifier = undefined;
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
      });

      const confirmation = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmation;
      setPhoneNumber(fullPhone);
      setStep("otp");
      toast.success("Code sent. Check your SMS.");
    } catch (err: any) {
      console.error("sendCode error:", err);
      toast.error(err?.message ?? "Failed to send code. Please try again.");
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {
          /* ignore */
        }
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  }

  // Phone OTP: Step 2 - Verify OTP code & establish session
  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirmationResult) {
      toast.error("Session expired. Please resend the code.");
      setStep("phone");
      return;
    }
    const form = new FormData(event.currentTarget);
    const code = String(form.get("otp") ?? "").trim();

    setLoading(true);
    try {
      const result = await window.confirmationResult.confirm(code);
      const user = result.user;
      const uid = user.uid;
      const phone = user.phoneNumber ?? phoneNumber;

      // Force a fresh token AFTER sign-in (one time only)
      await user.getIdToken(true);

      // Upsert profile row
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: uid,
            phone: phone,
            phone_number: phone,
            consent_given_at: new Date().toISOString(),
          } as any,
          { onConflict: "id" }
        );

      if (profileError) {
        console.warn("Profile upsert failed:", profileError);
        // Don't block login — user still has a Firebase session
      }

      // Ensure a role row exists (defaults to 'tenant')
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .limit(1);

      if (!existingRole || existingRole.length === 0) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: uid, role: "tenant" });

        if (roleError) {
          console.warn("Role insert failed:", roleError);
        }
      }

      toast.success("Welcome to Yegara!");
      navigate({ to: "/dashboard", replace: true });
    } catch (err: any) {
      console.error("verifyOtp error:", err);
      if (err?.code === "auth/invalid-verification-code") {
        toast.error("Invalid code. Please check and try again.");
      } else {
        toast.error(err?.message ?? "Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleResend() {
    setStep("phone");
    toast.info("Please verify your number and click Send code.");
  }

  // Stubbed handlers for email flow (migration in next phase)
  function handleEmailDisabled(event: React.FormEvent) {
    event.preventDefault();
    toast.info("Email login is coming soon. Please use phone login.");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-gradient-brand p-10 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-primary-foreground/15">
            <Building2 className="size-5" />
          </span>
          Yegara
        </Link>
        <div>
          <h2 className="text-3xl font-bold">Housing management, done properly.</h2>
          <p className="mt-3 max-w-md text-primary-foreground/85">
            One secure workspace for owners, tenants and guards — rent tracking, AI-verified
            receipts and maintenance requests.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">
          Your data is protected by per-user access rules.
        </p>
      </aside>

      <main className="relative flex items-center justify-center px-3 py-6 sm:px-4 sm:py-12">
        <div className="absolute top-4 right-4">
          <ThemeToggle className="size-8" />
        </div>
        <div className="w-full max-w-md">
          <Link to="/" className="mb-4 sm:mb-6 flex items-center gap-2 font-semibold lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-brand text-primary-foreground">
              <Building2 className="size-5" />
            </span>
            Yegara
          </Link>

          {!gatePassed ? (
            <ConsentGate
              onConsent={async () => {
                setGatePassed(true);
              }}
            />
          ) : search.mode === "reset" ? (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Set a new password</CardTitle>
                <CardDescription>
                  Password reset via email is being migrated. Please contact support.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 mb-4">
                  <p className="text-xs text-amber-900 dark:text-amber-200">
                    Password reset via email is temporarily unavailable while we migrate to our new auth system. Please contact support or use phone login.
                  </p>
                </div>
                <Button type="button" className="w-full" disabled>
                  Coming soon
                </Button>
                <Button asChild variant="ghost" className="w-full mt-2">
                  <Link to="/auth">Back to sign in</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Welcome to Yegara</CardTitle>
                <CardDescription>Sign in or create an account to continue.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={tab} onValueChange={(val) => setTab(val as "phone" | "email")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="phone">Phone</TabsTrigger>
                    <TabsTrigger value="email">Email</TabsTrigger>
                  </TabsList>

                  {/* PHONE TAB */}
                  <TabsContent value="phone" className="mt-6">
                    {step === "phone" ? (
                      <form onSubmit={handleSendCode} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone number</Label>
                          <div className="flex gap-2">
                            <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-medium shrink-0">
                              🇪🇹 +251
                            </div>
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              inputMode="numeric"
                              placeholder="911 234 567"
                              maxLength={15}
                              required
                              autoFocus
                              className="flex-1"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            We'll send you a 6-digit verification code via SMS.
                          </p>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                          Send code
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="otp">Verification code</Label>
                          <Input
                            id="otp"
                            name="otp"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]{6}"
                            maxLength={6}
                            placeholder="123456"
                            required
                            autoFocus
                            className="text-center text-lg tracking-[0.5em] font-mono"
                          />
                          <p className="text-xs text-muted-foreground">
                            We sent a code to <strong>{phoneNumber}</strong>.
                          </p>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                          Verify
                        </Button>
                        <div className="flex justify-between text-xs">
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={() => setStep("phone")}
                          >
                            ← Change number
                          </button>
                          <button
                            type="button"
                            className="text-primary hover:text-primary/80 font-medium cursor-pointer"
                            onClick={handleResend}
                            disabled={loading}
                          >
                            Resend code
                          </button>
                        </div>
                      </form>
                    )}
                  </TabsContent>

                  {/* EMAIL TAB (Disabled during migration) */}
                  <TabsContent value="email" className="mt-6">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 mb-4">
                      <p className="text-xs text-amber-900 dark:text-amber-200">
                        Email login is being migrated to our new auth system. Please use{" "}
                        <button
                          type="button"
                          onClick={() => setTab("phone")}
                          className="font-semibold underline cursor-pointer"
                        >
                          phone login
                        </button>{" "}
                        for now.
                      </p>
                    </div>

                    {/* TODO: Migrate email auth to Firebase EmailAuthProvider */}
                    <Tabs
                      value={emailSubTab}
                      onValueChange={(val) => setEmailSubTab(val as "signin" | "signup")}
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="signin">Sign in</TabsTrigger>
                        <TabsTrigger value="signup">Sign up</TabsTrigger>
                      </TabsList>

                      <TabsContent value="signin" className="mt-6">
                        <form onSubmit={handleEmailDisabled} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="signin-email">Email</Label>
                            <Input
                              id="signin-email"
                              name="email"
                              type="email"
                              autoComplete="email"
                              maxLength={255}
                              disabled
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signin-password">Password</Label>
                            <div className="relative">
                              <Input
                                id="signin-password"
                                name="password"
                                type={showSignInPassword ? "text" : "password"}
                                autoComplete="current-password"
                                className="pr-10"
                                disabled
                              />
                              <button
                                type="button"
                                onClick={() => setShowSignInPassword(!showSignInPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={showSignInPassword ? "Hide password" : "Show password"}
                              >
                                {showSignInPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              </button>
                            </div>
                          </div>
                          <Button type="submit" className="w-full" disabled>
                            Coming soon
                          </Button>
                        </form>
                      </TabsContent>

                      <TabsContent value="signup" className="mt-6">
                        <form onSubmit={handleEmailDisabled} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="full-name">Full name</Label>
                            <Input id="full-name" name="fullName" maxLength={100} disabled />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <Input id="signup-email" name="email" type="email" maxLength={255} disabled />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signup-phone">Phone</Label>
                            <Input id="signup-phone" name="phone" type="tel" maxLength={20} disabled />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signup-role">I am a</Label>
                            <Select name="role" defaultValue="tenant" disabled>
                              <SelectTrigger id="signup-role">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="owner">Property owner</SelectItem>
                                <SelectItem value="tenant">Tenant</SelectItem>
                                <SelectItem value="guard">Community guard</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <div className="relative">
                              <Input
                                id="signup-password"
                                name="password"
                                type={showSignUpPassword ? "text" : "password"}
                                autoComplete="new-password"
                                className="pr-10"
                                disabled
                              />
                              <button
                                type="button"
                                onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                              >
                                {showSignUpPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm password</Label>
                            <div className="relative">
                              <Input
                                id="confirm-password"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                autoComplete="new-password"
                                className="pr-10"
                                disabled
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                              >
                                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2.5 pt-1">
                            <Checkbox
                              id="signup-consent"
                              checked={consentChecked}
                              onCheckedChange={(checked) => setConsentChecked(Boolean(checked))}
                              className="mt-0.5"
                              disabled
                            />
                            <Label
                              htmlFor="signup-consent"
                              className="text-xs leading-relaxed font-normal text-muted-foreground"
                            >
                              I have read and agree to the{" "}
                              <Link
                                to="/terms-of-service"
                                target="_blank"
                                className="text-primary underline font-medium hover:text-primary/80"
                              >
                                Terms of Service
                              </Link>{" "}
                              and{" "}
                              <Link
                                to="/privacy-policy"
                                target="_blank"
                                className="text-primary underline font-medium hover:text-primary/80"
                              >
                                Privacy Policy
                              </Link>
                            </Label>
                          </div>

                          <Button type="submit" className="w-full" disabled>
                            Coming soon
                          </Button>
                        </form>
                      </TabsContent>
                    </Tabs>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 text-center text-xs text-muted-foreground">
                  By continuing, you agree to our{" "}
                  <Link
                    to="/terms-of-service"
                    target="_blank"
                    className="underline hover:text-foreground"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy-policy"
                    target="_blank"
                    className="underline hover:text-foreground"
                  >
                    Privacy Policy
                  </Link>
                  .
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Invisible reCAPTCHA container required by Firebase Phone Auth */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
