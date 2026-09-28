import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, Lock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Yegara Home Connect" },
      { name: "description", content: "Privacy Policy and data protection practices for Yegara Home Connect." },
      { property: "og:title", content: "Privacy Policy — Yegara Home Connect" },
      { property: "og:description", content: "Learn how Yegara Home Connect collects, protects, and handles your personal information." },
    ],
  }),
  component: PrivacyPolicyPage,
});

const sections = [
  { id: "overview", title: "1. Overview & Commitment" },
  { id: "information-collected", title: "2. Information We Collect" },
  { id: "payment-receipts", title: "3. Rent Receipts & Financial Data" },
  { id: "how-we-use", title: "4. How We Use Information" },
  { id: "information-sharing", title: "5. Information Sharing & Disclosure" },
  { id: "data-storage-security", title: "6. Data Storage & Security" },
  { id: "retention-deletion", title: "7. Data Retention & Account Deletion" },
  { id: "user-rights", title: "8. Your Privacy Rights" },
  { id: "cookies-storage", title: "9. Cookies & Local Storage" },
  { id: "ethiopian-law", title: "10. Compliance with Ethiopian Law" },
  { id: "policy-updates", title: "11. Policy Updates" },
  { id: "contact-us", title: "12. Contact Information" },
];

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary-soft text-primary">
              <Shield className="size-4" />
            </span>
            <span className="font-semibold text-sm">Yegara Privacy & Legal</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sticky Desktop Table of Contents */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Table of Contents
              </p>
              <nav className="space-y-1 text-xs">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Document Content */}
          <div className="lg:col-span-3">
            <Card className="shadow-card border-border">
              <CardHeader className="space-y-2 pb-6 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    <Lock className="size-3" /> Data Protection
                  </span>
                </div>
                <CardTitle className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</CardTitle>
                <p className="text-lg font-medium text-muted-foreground">Yegara Home Connect</p>
                <p className="text-xs text-muted-foreground">
                  <strong>Last Updated:</strong> September 28, 2026 · <strong>Effective Date:</strong> Immediate
                </p>
              </CardHeader>

              <CardContent className="space-y-10 pt-8 text-sm leading-relaxed sm:text-base sm:leading-relaxed">
                {/* 1. Overview */}
                <section id="overview" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">1. Overview & Commitment</h2>
                  <p>
                    Welcome to Yegara Home Connect (&quot;Yegara,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We are committed to protecting your privacy and ensuring your personal information is collected, processed, and safeguarded with the utmost care and transparency.
                  </p>
                  <p>
                    This Privacy Policy explains how we handle your personal data when you access or use the Yegara web application, mobile views, and related services (collectively, the &quot;Platform&quot;). By creating an account or using our Platform, you acknowledge that you have read and understood the practices described herein.
                  </p>
                </section>

                <Separator />

                {/* 2. Information We Collect */}
                <section id="information-collected" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">2. Information We Collect</h2>
                  <p>We collect information you directly provide to us and data automatically generated during your platform usage:</p>
                  <div className="space-y-2 pt-2">
                    <p className="font-semibold text-foreground">A. Account & Profile Information:</p>
                    <ul className="list-disc space-y-1 pl-6">
                      <li><strong>Personal Identification:</strong> Full name, email address, and phone number.</li>
                      <li><strong>User Role:</strong> Tenant or Property Owner designation.</li>
                      <li><strong>Authentication Credentials:</strong> Passwords securely hashed and managed through cryptographic protocols (we never store plain-text passwords).</li>
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="font-semibold text-foreground">B. Property & Tenancy Information:</p>
                    <ul className="list-disc space-y-1 pl-6">
                      <li><strong>Building & Unit Details:</strong> Unit number, building name, compound location, descriptions, and optional room configurations.</li>
                      <li><strong>Lease & Schedule Data:</strong> Agreed rent amounts, recurrence cycles (monthly, quarterly, yearly), and upcoming due dates.</li>
                      <li><strong>Tenancy Assignments:</strong> Associations linking a Tenant profile to a specific property listing upon owner approval.</li>
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="font-semibold text-foreground">C. Technical & Diagnostic Data:</p>
                    <ul className="list-disc space-y-1 pl-6">
                      <li>Browser type, device operating system, access timestamps, and error logs used exclusively to maintain reliability and performance.</li>
                    </ul>
                  </div>
                </section>

                <Separator />

                {/* 3. Receipts & Financial Data */}
                <section id="payment-receipts" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">3. Rent Receipts & Financial Data</h2>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <p className="font-semibold text-primary flex items-center gap-1.5">
                      <CheckCircle2 className="size-4" /> Important Clarification on Financial Transactions
                    </p>
                    <p className="text-xs sm:text-sm text-foreground/90">
                      <strong>Yegara is NOT a payment processor, bank, or escrow agent.</strong> We do not accept, hold, process, or disburse funds. Rent payments are made directly between Tenants and Owners through their chosen banking channels (e.g., CBE, Telebirr, Awash Bank, etc.).
                    </p>
                  </div>
                  <p>
                    When Tenants upload payment receipt images or bank transfer screenshots to confirm payment:
                  </p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Receipt images are stored in protected storage buckets.</li>
                    <li>Receipts are visible solely to the Tenant who uploaded them and the designated Property Owner of that house.</li>
                    <li>We do not extract, store, or sell banking credentials, account PINs, or debit/credit card numbers.</li>
                  </ul>
                </section>

                <Separator />

                {/* 4. How We Use Information */}
                <section id="how-we-use" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">4. How We Use Information</h2>
                  <p>We use the data we collect solely for lawful, legitimate purposes:</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li><strong>Service Delivery:</strong> Managing property listings, recording tenant assignments, and tracking rent due dates.</li>
                    <li><strong>Payment Verification:</strong> Facilitating receipt submission by tenants and visual verification by property owners.</li>
                    <li><strong>Notifications:</strong> Alerting users to upcoming due dates, maintenance requests, and announcements.</li>
                    <li><strong>Security & Authentication:</strong> Preventing unauthorized access, identity impersonation, and fraudulent submissions.</li>
                    <li><strong>Platform Improvement:</strong> Resolving technical errors and improving application usability.</li>
                  </ul>
                </section>

                <Separator />

                {/* 5. Information Sharing */}
                <section id="information-sharing" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">5. Information Sharing & Disclosure</h2>
                  <p className="font-semibold text-foreground">We never sell, rent, or trade your personal information.</p>
                  <p>Information is shared only in the following restricted scenarios:</p>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>
                      <strong>Between Tenant and Property Owner:</strong> When a tenant applies for or is assigned to a property, the owner receives the tenant&apos;s name and phone number to coordinate tenancy. Rent amounts and listings are managed directly between parties.
                    </li>
                    <li>
                      <strong>Infrastructure Service Providers:</strong> Trusted enterprise service providers (such as Supabase for database and authentication hosting, and Cloudflare Workers for edge hosting and CDN services) process data under strict confidentiality obligations.
                    </li>
                    <li>
                      <strong>Legal & Regulatory Obligations:</strong> Where required by valid legal process, court orders, or applicable law under the jurisdiction of the Federal Democratic Republic of Ethiopia.
                    </li>
                  </ul>
                </section>

                <Separator />

                {/* 6. Data Storage & Security */}
                <section id="data-storage-security" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">6. Data Storage & Security</h2>
                  <p>
                    We employ modern industry standards to protect your data against unauthorized access, alteration, or disclosure:
                  </p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li><strong>Row-Level Security (RLS):</strong> Granular database access policies enforce that users can only query and mutate their own authorized records.</li>
                    <li><strong>Encryption in Transit:</strong> All web traffic and API calls are encrypted using TLS 1.3 encryption.</li>
                    <li><strong>Authentication Hardening:</strong> Secure JSON Web Tokens (JWT) and modern session controls protect account sessions.</li>
                  </ul>
                </section>

                <Separator />

                {/* 7. Retention & Deletion */}
                <section id="retention-deletion" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">7. Data Retention & Account Deletion</h2>
                  <p>
                    We retain personal data as long as your account is active or needed to provide you with property management services.
                  </p>
                  <p>
                    <strong>Your Right to Delete:</strong> Property owners and tenants can remove houses, buildings, assignments, and uploaded records at any time. When an owner deletes a house or building, or when an account is closed, associated private records are removed or anonymized in accordance with data retention standards.
                  </p>
                </section>

                <Separator />

                {/* 8. User Rights */}
                <section id="user-rights" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">8. Your Privacy Rights</h2>
                  <p>You possess full control over your personal information:</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li><strong>Access & Review:</strong> View all property, tenant, and receipt data associated with your account from your dashboard.</li>
                    <li><strong>Correction & Update:</strong> Modify personal details, property descriptions, building names, and contact info at any time.</li>
                    <li><strong>Revocation of Consent:</strong> You may discontinue use of the platform and request complete deletion of your profile.</li>
                  </ul>
                </section>

                <Separator />

                {/* 9. Cookies & Local Storage */}
                <section id="cookies-storage" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">9. Cookies & Local Storage</h2>
                  <p>
                    Yegara uses browser local storage and essential session cookies strictly to maintain your authenticated login session and user preferences. We do not use third-party tracking cookies or advertising tracking pixels.
                  </p>
                </section>

                <Separator />

                {/* 10. Compliance with Ethiopian Law */}
                <section id="ethiopian-law" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">10. Compliance with Ethiopian Law</h2>
                  <p>
                    Yegara Home Connect operates in compliance with the laws of the Federal Democratic Republic of Ethiopia, including constitutional privacy protections, electronic transaction regulations, and civil code provisions governing tenancy documentation.
                  </p>
                </section>

                <Separator />

                {/* 11. Policy Updates */}
                <section id="policy-updates" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">11. Policy Updates</h2>
                  <p>
                    We may update this Privacy Policy periodically to reflect enhancements to our features or regulatory requirements. We will update the &quot;Last Updated&quot; date at the top of this policy and provide prominent notice within the application when material modifications take place.
                  </p>
                </section>

                <Separator />

                {/* 12. Contact Information */}
                <section id="contact-us" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">12. Contact Information</h2>
                  <p>If you have any questions, inquiries, or privacy concerns regarding this Privacy Policy, please reach out to us:</p>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-sm">
                    <p className="font-semibold text-foreground">Yegara Home Connect — Data Support</p>
                    <p>
                      <strong>Email:</strong>{" "}
                      <a href="mailto:engdaworkmichael2@gmail.com" className="text-primary hover:underline">
                        engdaworkmichael2@gmail.com
                      </a>
                    </p>
                    <p>
                      <strong>Phone / Telegram:</strong>{" "}
                      <a href="tel:+251965290270" className="text-primary hover:underline">
                        0965290270 / +251 965 290 270
                      </a>
                    </p>
                    <p className="text-xs text-muted-foreground pt-1">
                      Addis Ababa, Ethiopia
                    </p>
                  </div>
                </section>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
