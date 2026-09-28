import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { registerUserAccount } from "@/lib/user.functions";
import { ConsentGate } from "@/components/ConsentGate";
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

const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your full name").max(100),
    email: z.string().trim().email("Enter a valid email address").max(255),
    phone: z
      .string()
      .trim()
      .min(9, "Enter a valid phone number")
      .max(20)
      .regex(/^[0-9+\-\s()]+$/, "Phone can only contain digits and + - ( )"),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirmPassword: z.string().min(8, "Please confirm your password"),
    role: z.enum(["owner", "tenant", "guard"]),
    consent: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the Terms of Service to create an account" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState(search.mode === "signup" ? "signup" : "signin");
  const [loading, setLoading] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(search.mode === "reset");

  // Consent gate state: defaults to false unless already consented in this session or reset mode
  const [gatePassed, setGatePassed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    if (search.mode === "reset") return true;
    return (
      sessionStorage.getItem("yegara_consent_shown") === "true" ||
      localStorage.getItem("yegara_consent_agreed") === "true"
    );
  });

  const [consentChecked, setConsentChecked] = useState(false);

  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (search.mode === "reset") return;

    // Listen for auth state changes (e.g. when OAuth or callback completes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (window.location.hash.includes("access_token") || window.location.search.includes("code"))) {
        toast.success("Signed in successfully!");
        navigate({ to: "/dashboard", replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, search.mode]);

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        toast.error("Incorrect email or password.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    if (data.session && data.user) {
      // Check if existing user has given consent
      const { data: profile } = await supabase
        .from("profiles")
        .select("consent_given_at")
        .eq("id", data.user.id)
        .maybeSingle();

      const userConsent = profile?.consent_given_at || data.user.user_metadata?.consent_given_at;

      if (!userConsent) {
        // User has not consented yet - show consent gate
        sessionStorage.removeItem("yegara_consent_shown");
        localStorage.removeItem("yegara_consent_agreed");
        setGatePassed(false);
        toast.info("Please review and accept our updated Terms of Service.");
        return;
      }

      toast.success("Welcome back!");
      navigate({ to: "/dashboard", replace: true });
    }
  }

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consentChecked) {
      toast.error("You must agree to the Terms of Service to create an account");
      return;
    }

    const form = new FormData(event.currentTarget);
    const parsed = signUpSchema.safeParse({
      fullName: form.get("fullName"),
      email: form.get("email"),
      phone: form.get("phone"),
      password: form.get("password"),
      confirmPassword: form.get("confirmPassword"),
      role: form.get("role"),
      consent: consentChecked,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setLoading(true);
    try {
      // Server-side registration: creates auth user with email confirmed + sets role & profile
      await registerUserAccount({
        data: {
          email: parsed.data.email,
          password: parsed.data.password,
          fullName: parsed.data.fullName,
          phone: parsed.data.phone,
          role: parsed.data.role,
          consentGiven: true,
        },
      });
      // Immediately sign in — no email verification needed
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      setLoading(false);
      if (signInErr) {
        toast.error("Account created but could not sign in: " + signInErr.message);
        setTab("signin");
        return;
      }
      if (signInData.session) {
        toast.success("Welcome to Yegara! Your account is ready.");
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err: any) {
      setLoading(false);
      toast.error(err?.message ?? "Failed to create account. Please try again.");
    }
  }

  async function handleForgot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent. Check your inbox.");
  }

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated.");
      navigate({ to: "/dashboard", replace: true });
    }
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

      <main className="flex items-center justify-center px-3 py-6 sm:px-4 sm:py-12">
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
                // If a user was already logged in when consenting, update their profile
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const now = new Date().toISOString();
                  await supabase
                    .from("profiles")
                    .update({ consent_given_at: now })
                    .eq("id", user.id);
                  navigate({ to: "/dashboard", replace: true });
                }
              }}
            />
          ) : search.mode === "reset" ? (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Set a new password</CardTitle>
                <CardDescription>
                  {recoveryReady
                    ? "Choose a new password for your account."
                    : "Open this page from the link in your reset email."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        name="password"
                        type={showResetPassword ? "text" : "password"}
                        autoComplete="new-password"
                        minLength={8}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showResetPassword ? "Hide password" : "Show password"}
                      >
                        {showResetPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Update password
                  </Button>
                  <Button asChild variant="ghost" className="w-full">
                    <Link to="/auth">Back to sign in</Link>
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Welcome to Yegara</CardTitle>
                <CardDescription>Sign in or create an account to continue.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign in</TabsTrigger>
                    <TabsTrigger value="signup">Sign up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="mt-6">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          maxLength={255}
                          required
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
                            required
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
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Sign in
                      </Button>
                    </form>

                    <details className="mt-4 text-sm">
                      <summary className="cursor-pointer text-muted-foreground">
                        Forgot your password?
                      </summary>
                      <form onSubmit={handleForgot} className="mt-3 flex gap-2">
                        <Input name="email" type="email" placeholder="you@example.com" required />
                        <Button type="submit" variant="outline" disabled={loading}>
                          Send link
                        </Button>
                      </form>
                    </details>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-6">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="full-name">Full name</Label>
                        <Input id="full-name" name="fullName" maxLength={100} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          maxLength={255}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-phone">Phone</Label>
                        <Input
                          id="signup-phone"
                          name="phone"
                          type="tel"
                          placeholder="+251 9xx xxx xxx"
                          maxLength={20}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-role">I am a</Label>
                        <Select name="role" defaultValue="tenant">
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
                            minLength={8}
                            className="pr-10"
                            required
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
                            minLength={8}
                            className="pr-10"
                            required
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
                          required
                        />
                        <Label
                          htmlFor="signup-consent"
                          className="text-xs leading-relaxed font-normal text-muted-foreground cursor-pointer"
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

                      <Button type="submit" className="w-full" disabled={loading || !consentChecked}>
                        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Create account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
