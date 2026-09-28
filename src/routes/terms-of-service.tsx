import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms-of-service")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Yegara Home Connect" },
      { name: "description", content: "Terms of Service for Yegara Home Connect rent management platform." },
      { property: "og:title", content: "Terms of Service — Yegara Home Connect" },
      { property: "og:description", content: "Terms of Service and legal agreements for Yegara Home Connect." },
    ],
  }),
  component: TermsOfServicePage,
});

const sections = [
  { id: "overview", title: "1. Overview" },
  { id: "definitions", title: "2. Definitions" },
  { id: "eligibility", title: "3. Eligibility" },
  { id: "account-registration", title: "4. Account Registration" },
  { id: "user-roles", title: "5. User Roles and Permissions" },
  { id: "data-collection", title: "6. Data Collection and Usage" },
  { id: "receipt-verification", title: "7. Receipt Upload and Verification" },
  { id: "acceptable-use", title: "8. Acceptable Use Policy" },
  { id: "content-ownership", title: "9. Content Ownership and License" },
  { id: "termination", title: "10. Termination and Suspension" },
  { id: "disclaimer-warranties", title: "11. Disclaimer of Warranties" },
  { id: "limitation-liability", title: "12. Limitation of Liability" },
  { id: "indemnification", title: "13. Indemnification" },
  { id: "dispute-resolution", title: "14. Dispute Resolution" },
  { id: "changes-to-terms", title: "15. Changes to Terms" },
  { id: "miscellaneous", title: "16. Miscellaneous" },
  { id: "contact-information", title: "17. Contact Information" },
  { id: "ethiopian-law", title: "18. Compliance with Ethiopian Law" },
  { id: "receipt-guidelines", title: "19. Receipt Management Guidelines" },
  { id: "platform-availability", title: "20. Platform Availability" },
  { id: "fees", title: "21. Fees" },
  { id: "intellectual-property", title: "22. Intellectual Property" },
  { id: "data-security", title: "23. Data Security" },
  { id: "user-responsibilities", title: "24. User Responsibilities Summary" },
  { id: "acknowledgment", title: "25. Acknowledgment" },
  { id: "additional-disclaimers", title: "26. Additional Disclaimers" },
  { id: "force-majeure", title: "27. Force Majeure" },
  { id: "legal-notices", title: "28. Contact for Legal Notices" },
  { id: "platform-features", title: "29. Platform Features" },
  { id: "severability", title: "30. Severability and Savings Clause" },
  { id: "waiver", title: "31. Waiver of Rights" },
  { id: "relationship-parties", title: "32. Relationship of Parties" },
  { id: "third-party-services", title: "33. Third-Party Services" },
  { id: "data-retention", title: "34. Data Retention" },
  { id: "user-appeals", title: "35. User Appeals" },
  { id: "general-provisions", title: "36. General Provisions" },
  { id: "acceptance", title: "37. Acknowledgment and Acceptance" },
  { id: "effective-date", title: "38. Effective Date" },
];

function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary-soft text-primary">
              <FileText className="size-4" />
            </span>
            <span className="font-semibold text-sm">Yegara Legal</span>
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
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Legal Agreement</p>
                <CardTitle className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</CardTitle>
                <p className="text-lg font-medium text-muted-foreground">Yegara Home Connect</p>
                <p className="text-xs text-muted-foreground">
                  <strong>Last Updated:</strong> September 14, 2024
                </p>
              </CardHeader>

              <CardContent className="space-y-10 pt-8 text-sm leading-relaxed sm:text-base sm:leading-relaxed">
                {/* 1. Overview */}
                <section id="overview" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">1. Overview</h2>
                  <p>
                    Welcome to Yegara Home Connect (&quot;Yegara,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). Yegara is a rent management platform that facilitates communication between Tenants and Property Owners by streamlining the process of rent payment verification.
                  </p>
                  <div className="space-y-2 pt-2">
                    <p className="font-semibold text-foreground">What We Do:</p>
                    <ul className="list-disc space-y-1 pl-6">
                      <li>Tenants upload screenshots of their rent payment receipts</li>
                      <li>Property Owners view and verify these receipts</li>
                      <li>All communication and verification happens through our platform</li>
                    </ul>
                  </div>
                  <div className="space-y-2 pt-2">
                    <p className="font-semibold text-foreground">What We Do NOT Do:</p>
                    <ul className="list-disc space-y-1 pl-6">
                      <li>We do NOT process, handle, or transfer any money</li>
                      <li>We do NOT verify the authenticity of receipts (this is the Owner&apos;s responsibility)</li>
                      <li>We are NOT a party to any rental agreement between Tenants and Owners</li>
                      <li>We are NOT responsible for disputes regarding rent payments</li>
                    </ul>
                  </div>
                  <p className="pt-2">
                    By using Yegara Home Connect, you agree to these Terms of Service (&quot;Terms&quot;). If you do not agree, please do not use our platform.
                  </p>
                </section>

                <Separator />

                {/* 2. Definitions */}
                <section id="definitions" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">2. Definitions</h2>
                  <ul className="list-disc space-y-2 pl-6">
                    <li><strong>&quot;Platform&quot;</strong> — The Yegara Home Connect website and mobile application</li>
                    <li><strong>&quot;User&quot;</strong> — Any person who registers and uses the Platform</li>
                    <li><strong>&quot;Tenant&quot;</strong> — A User who rents a property and uploads payment receipts</li>
                    <li><strong>&quot;Owner&quot;</strong> — A User who owns a property and verifies tenant receipts</li>
                    <li><strong>&quot;Guard&quot;</strong> — A User who manages property access (limited functionality)</li>
                    <li><strong>&quot;Receipt&quot;</strong> — A screenshot or image of a rent payment confirmation uploaded by a Tenant</li>
                    <li><strong>&quot;Content&quot;</strong> — Any information, data, text, images, or materials uploaded to the Platform</li>
                  </ul>
                </section>

                <Separator />

                {/* 3. Eligibility */}
                <section id="eligibility" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">3. Eligibility</h2>
                  <p>By using Yegara Home Connect, you represent and warrant that:</p>
                  <ol className="list-decimal space-y-1.5 pl-6">
                    <li>You are at least 18 years old</li>
                    <li>You are legally capable of entering into a binding contract</li>
                    <li>You are using the Platform for legitimate rental management purposes</li>
                    <li>All information you provide is accurate and complete</li>
                  </ol>
                  <p>We reserve the right to suspend or terminate accounts that violate these requirements.</p>
                </section>

                <Separator />

                {/* 4. Account Registration */}
                <section id="account-registration" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">4. Account Registration</h2>
                  <p>To use Yegara Home Connect, you must create an account and provide:</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Full Name (legal name)</li>
                    <li>Email Address (valid and accessible)</li>
                    <li>Phone Number (for verification and support)</li>
                  </ul>
                  <div className="space-y-2 pt-2">
                    <p className="font-semibold text-foreground">You are responsible for:</p>
                    <ul className="list-disc space-y-1 pl-6">
                      <li>Maintaining the confidentiality of your login credentials</li>
                      <li>All activities that occur under your account</li>
                      <li>Immediately notifying us of any unauthorized use</li>
                      <li>Keeping your account information up to date</li>
                    </ul>
                  </div>
                  <div className="space-y-2 pt-2">
                    <p className="font-semibold text-foreground">You may not:</p>
                    <ul className="list-disc space-y-1 pl-6">
                      <li>Share your account with others</li>
                      <li>Create multiple accounts</li>
                      <li>Impersonate another person or entity</li>
                      <li>Use false or misleading information</li>
                    </ul>
                  </div>
                </section>

                <Separator />

                {/* 5. User Roles and Permissions */}
                <section id="user-roles" className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">5. User Roles and Permissions</h2>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">5.1 Tenants</h3>
                    <p>As a Tenant, you may:</p>
                    <ul className="list-disc space-y-1 pl-6">
                      <li>Upload rent payment receipts for your property</li>
                      <li>View your payment history</li>
                      <li>Receive notifications about rent verification</li>
                      <li>Update your contact information</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">5.2 Owners</h3>
                    <p>As an Owner, you may:</p>
                    <ul className="list-disc space-y-1 pl-6">
                      <li>View receipts uploaded by your Tenants</li>
                      <li>Mark receipts as &quot;Verified&quot; or &quot;Unverified&quot;</li>
                      <li>Manage multiple properties and tenants</li>
                      <li>Receive notifications about new receipts</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">5.3 Guards</h3>
                    <p>As a Guard, you may:</p>
                    <ul className="list-disc space-y-1 pl-6">
                      <li>View basic property information</li>
                      <li>Access limited platform features</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">5.4 Role Changes</h3>
                    <p>
                      Users may request to change their role. We reserve the right to approve or deny role change requests based on verification and platform policies.
                    </p>
                  </div>
                </section>

                <Separator />

                {/* 6. Data Collection and Usage */}
                <section id="data-collection" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">6. Data Collection and Usage</h2>
                  <p>We collect the following information:</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li><strong>Personal Information</strong> — Name, Email, Phone Number (for account creation and communication)</li>
                    <li><strong>Property Information</strong> — Address, Property Details (for facilitating rent management)</li>
                    <li><strong>Payment Receipts</strong> — Screenshots of bank transfers (for rent verification)</li>
                    <li><strong>Usage Data</strong> — Login times, page views (for platform improvement)</li>
                  </ul>
                  <div className="rounded-lg border border-border bg-muted/40 p-4">
                    <p className="font-semibold text-foreground">Important:</p>
                    <p className="text-muted-foreground mt-1">
                      We do NOT collect or store bank account details, credit card information, financial institution credentials, or any direct payment information.
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <p className="font-semibold text-foreground">Data Usage:</p>
                    <ul className="list-disc space-y-1 pl-6">
                      <li>We use your data only for platform functionality</li>
                      <li>We do NOT share your data with third parties except for legal compliance (court orders, law enforcement) or platform hosting (Supabase, Cloudflare)</li>
                      <li>We do NOT sell your data to anyone</li>
                    </ul>
                  </div>
                </section>

                <Separator />

                {/* 7. Receipt Upload and Verification */}
                <section id="receipt-verification" className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">7. Receipt Upload and Verification</h2>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">7.1 Tenant Responsibilities</h3>
                    <p>When uploading a receipt, Tenants agree that:</p>
                    <ol className="list-decimal space-y-1 pl-6">
                      <li>The receipt is genuine and represents an actual payment</li>
                      <li>The receipt is for the correct property and rental period</li>
                      <li>The receipt contains no fraudulent or misleading information</li>
                      <li>They have the right to upload the receipt</li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">7.2 Owner Responsibilities</h3>
                    <p>When verifying receipts, Owners agree that:</p>
                    <ol className="list-decimal space-y-1 pl-6">
                      <li>They will independently verify the authenticity of receipts</li>
                      <li>They will not make false claims about payment status</li>
                      <li>They will not harass or intimidate Tenants regarding payments</li>
                      <li>They understand that Yegara does not guarantee receipt accuracy</li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">7.3 Platform Disclaimer</h3>
                    <p className="font-semibold text-destructive uppercase tracking-wide">
                      YEGARA DOES NOT VERIFY THE AUTHENTICITY OF RECEIPTS.
                    </p>
                    <p>
                      We are a passive intermediary that facilitates communication. It is the Owner&apos;s responsibility to verify that rent has been paid. We do not confirm that payments were actually received, validate bank transfer receipts, or act as an escrow service or payment processor.
                    </p>
                  </div>
                </section>

                <Separator />

                {/* 8. Acceptable Use Policy */}
                <section id="acceptable-use" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">8. Acceptable Use Policy</h2>
                  <p>You agree not to use the Platform for:</p>
                  <ol className="list-decimal space-y-2 pl-6">
                    <li><strong>Fraudulent Activities</strong> — Uploading fake receipts, impersonating owners or tenants, creating fake rental agreements</li>
                    <li><strong>Harassment and Abuse</strong> — Threatening users, stalking, posting offensive content</li>
                    <li><strong>Illegal Activities</strong> — Money laundering, tax evasion, violation of Ethiopian laws</li>
                    <li><strong>Technical Misuse</strong> — Hacking, uploading malware, bypassing security, excessive API calls</li>
                    <li><strong>Misrepresentation</strong> — Falsifying ownership, creating fake contracts, misrepresenting identity</li>
                  </ol>
                  <p className="text-muted-foreground pt-1">
                    Violation of this policy may result in immediate account suspension and legal action.
                  </p>
                </section>

                <Separator />

                {/* 9. Content Ownership and License */}
                <section id="content-ownership" className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">9. Content Ownership and License</h2>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">9.1 Your Content</h3>
                    <p>You retain full ownership of all content you upload to Yegara (receipts, property information, etc.).</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">9.2 Our License</h3>
                    <p>
                      By uploading content, you grant Yegara a non-exclusive, worldwide, royalty-free license to store, display, and process your content for the purpose of providing platform services.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">9.3 Your Rights</h3>
                    <p>You may delete your content at any time, request removal of your content, or download a copy of your data.</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">9.4 Our Content</h3>
                    <p>All platform content (logos, code, design) is our property and may not be copied or used without permission.</p>
                  </div>
                </section>

                <Separator />

                {/* 10. Termination and Suspension */}
                <section id="termination" className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">10. Termination and Suspension</h2>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">10.1 Termination by User</h3>
                    <p>
                      You may terminate your account at any time by requesting deletion through the platform or emailing{" "}
                      <a href="mailto:engdaworkchernet@outlook.com" className="text-primary underline">
                        engdaworkchernet@outlook.com
                      </a>
                      . Upon termination, we will delete your data within 30 days.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">10.2 Termination by Yegara</h3>
                    <p>
                      We may suspend or terminate your account if you violate these Terms, engage in fraudulent activity, create a safety or security risk, or if we are required to do so by law.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">10.3 Effect of Termination</h3>
                    <p>
                      Upon termination, your account will be deactivated, your content will be deleted (subject to legal retention requirements), and you may not create a new account without our permission.
                    </p>
                  </div>
                </section>

                <Separator />

                {/* 11. Disclaimer of Warranties */}
                <section id="disclaimer-warranties" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">11. Disclaimer of Warranties</h2>
                  <p className="font-semibold uppercase tracking-wide">
                    YEGARA HOME CONNECT IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot;
                  </p>
                  <p>
                    We make no warranties regarding the accuracy or reliability of user-uploaded receipts, the availability or uptime of the platform, the success or effectiveness of the platform, or the quality or reliability of any user-uploaded information.
                  </p>
                  <p>
                    WE DISCLAIM ALL WARRANTIES, INCLUDING merchantability, fitness for a particular purpose, non-infringement, title, and accuracy of information.
                  </p>
                </section>

                <Separator />

                {/* 12. Limitation of Liability */}
                <section id="limitation-liability" className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">12. Limitation of Liability</h2>
                  <p className="font-semibold uppercase tracking-wide">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">12.1 No Liability for Disputes</h3>
                    <p>
                      Yegara is not liable for disputes between Tenants and Owners, non-payment of rent, incorrect or fraudulent receipts, property damage or loss, or eviction or housing issues.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">12.2 No Liability for Content</h3>
                    <p>
                      Yegara is not liable for the accuracy of any user-uploaded content, loss or damage resulting from reliance on user content, or data breaches caused by external factors.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">12.3 Maximum Liability</h3>
                    <p>
                      In no event shall Yegara&apos;s total liability exceed the amount paid by you to use the Platform (if any), and in any case, no more than 1,000 ETB (or equivalent).
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">12.4 No Indirect Damages</h3>
                    <p>
                      Yegara is not liable for lost profits or revenues, lost business opportunities, loss of data, reputational damage, or any indirect, incidental, or consequential damages.
                    </p>
                  </div>
                </section>

                <Separator />

                {/* 13. Indemnification */}
                <section id="indemnification" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">13. Indemnification</h2>
                  <p>
                    You agree to indemnify and hold harmless Yegara, its owners, employees, and affiliates from any claims arising from your use of the Platform, any violation of these Terms, any violation of applicable laws, any disputes with other users, and any damages caused by your actions. This includes covering our legal fees and costs associated with defending against such claims.
                  </p>
                </section>

                <Separator />

                {/* 14. Dispute Resolution */}
                <section id="dispute-resolution" className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">14. Dispute Resolution</h2>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">14.1 Informal Resolution</h3>
                    <p>Before taking legal action, you agree to contact us first to try to resolve the dispute informally.</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">14.2 Governing Law</h3>
                    <p>These Terms are governed by the laws of the Federal Democratic Republic of Ethiopia.</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">14.3 Jurisdiction</h3>
                    <p>Any legal disputes shall be resolved in the courts of Addis Ababa, Ethiopia.</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">14.4 No Class Actions</h3>
                    <p>You agree to resolve disputes individually and not as part of a class action or collective action.</p>
                  </div>
                </section>

                <Separator />

                {/* 15. Changes to Terms */}
                <section id="changes-to-terms" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">15. Changes to Terms</h2>
                  <p>We reserve the right to update these Terms at any time.</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li><strong>Minor changes:</strong> We&apos;ll update the &quot;Last Updated&quot; date</li>
                    <li><strong>Major changes:</strong> We&apos;ll notify you via email or platform notification</li>
                    <li><strong>Material changes:</strong> We&apos;ll require your consent before continuing to use the Platform</li>
                  </ul>
                  <p>Your continued use after changes means you accept the new Terms.</p>
                </section>

                <Separator />

                {/* 16. Miscellaneous */}
                <section id="miscellaneous" className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">16. Miscellaneous</h2>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">16.1 Severability</h3>
                    <p>If any part of these Terms is found invalid, the rest remain in effect.</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">16.2 Waiver</h3>
                    <p>If we don&apos;t enforce a right, we don&apos;t lose the right to enforce it later.</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">16.3 Assignment</h3>
                    <p>You may not transfer your account without our permission. We may transfer our rights without notifying you.</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">16.4 Entire Agreement</h3>
                    <p>These Terms represent the complete agreement between you and Yegara regarding the Platform.</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">16.5 Language</h3>
                    <p>If these Terms are translated into other languages, the English version prevails.</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">16.6 Survival</h3>
                    <p>Sections regarding liability, indemnification, and governing law survive termination.</p>
                  </div>
                </section>

                <Separator />

                {/* 17. Contact Information */}
                <section id="contact-information" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">17. Contact Information</h2>
                  <p><strong>Yegara Home Connect</strong></p>
                  <p>
                    Email:{" "}
                    <a href="mailto:engdaworkchernet@outlook.com" className="text-primary underline">
                      engdaworkchernet@outlook.com
                    </a>
                  </p>
                  <p>
                    For legal inquiries, support, or data requests:{" "}
                    <a href="mailto:engdaworkchernet@outlook.com" className="text-primary underline">
                      engdaworkchernet@outlook.com
                    </a>
                  </p>
                  <p className="text-muted-foreground">We aim to respond to all inquiries within 48 hours.</p>
                </section>

                <Separator />

                {/* 18. Compliance with Ethiopian Law */}
                <section id="ethiopian-law" className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">18. Compliance with Ethiopian Law</h2>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">18.1 Personal Data Protection</h3>
                    <p>
                      We are committed to complying with Ethiopia&apos;s Personal Data Protection Proclamation No. 1321/2024. We are actively working toward full compliance, including implementing informed consent mechanisms, data subject rights processes, and evaluating data hosting solutions that meet localization requirements. Users have rights to access their personal data, correct inaccurate data, request deletion of their data, and object to data processing.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">18.2 Consumer Protection</h3>
                    <p>
                      We comply with the Trade Competition and Consumer Protection Proclamation. Users have the right to accurate information about our services, fair treatment without discrimination, complaint resolution, and consumer education on platform use.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">18.3 Government Authority</h3>
                    <p>We cooperate with authorized Ethiopian government agencies for legal compliance.</p>
                  </div>
                </section>

                <Separator />

                {/* 19. Receipt Management Guidelines */}
                <section id="receipt-guidelines" className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">19. Receipt Management Guidelines</h2>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">19.1 For Tenants</h3>
                    <ul className="list-disc space-y-1 pl-6">
                      <li>Upload only authentic payment receipts</li>
                      <li>Ensure receipts are legible and complete</li>
                      <li>Upload receipts promptly after payment</li>
                      <li>Do not alter or falsify receipt images</li>
                      <li>Report any discrepancies to the Owner directly</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">19.2 For Owners</h3>
                    <ul className="list-disc space-y-1 pl-6">
                      <li>Verify receipts promptly</li>
                      <li>Communicate clearly with Tenants</li>
                      <li>Do not use receipts to harass Tenants</li>
                      <li>Understand that we do not verify payment authenticity</li>
                    </ul>
                  </div>
                </section>

                <Separator />

                {/* 20. Platform Availability */}
                <section id="platform-availability" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">20. Platform Availability</h2>
                  <p>
                    We strive to keep the Platform available, but do not guarantee 100% uptime, uninterrupted service, or compatibility with all devices and browsers. We may perform maintenance that temporarily affects availability.
                  </p>
                </section>

                <Separator />

                {/* 21. Fees */}
                <section id="fees" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">21. Fees</h2>
                  <p>
                    Yegara Home Connect is currently free to use. We reserve the right to introduce fees in the future. If we do, we will notify you at least 30 days in advance, and you may choose to continue or terminate your account.
                  </p>
                </section>

                <Separator />

                {/* 22. Intellectual Property */}
                <section id="intellectual-property" className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">22. Intellectual Property</h2>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">22.1 Our IP</h3>
                    <p>
                      The Yegara name, logo, and design are our property. Our platform code, software, and features are protected by copyright. We reserve all rights not expressly granted.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">22.2 User Content</h3>
                    <p>
                      You own your uploaded content. You grant us limited rights to use your content to provide services. We will not use your content for marketing without permission.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">22.3 Trademarks</h3>
                    <p>
                      &quot;Yegara&quot; and &quot;Yegara Home Connect&quot; are our trademarks. You may not use our trademarks without permission.
                    </p>
                  </div>
                </section>

                <Separator />

                {/* 23. Data Security */}
                <section id="data-security" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">23. Data Security</h2>
                  <p>
                    All data transmitted between your device and Yegara is encrypted in transit using TLS 1.2 or higher. All data stored on our servers is encrypted at rest using AES-256 encryption, provided by our enterprise-grade infrastructure partner (Supabase). Receipt images are stored in encrypted cloud storage with access controls.
                  </p>
                  <p>
                    We are committed to protecting your data. However, no system is 100% secure. You are responsible for maintaining the confidentiality of your login credentials.
                  </p>
                </section>

                <Separator />

                {/* 24. User Responsibilities Summary */}
                <section id="user-responsibilities" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">24. User Responsibilities Summary</h2>
                  <ul className="list-disc space-y-2 pl-6">
                    <li><strong>All Users:</strong> Keep login credentials secure, provide accurate information, comply with laws, report issues promptly</li>
                    <li><strong>Tenants:</strong> Upload authentic receipts, pay rent on time, communicate clearly with Owners</li>
                    <li><strong>Owners:</strong> Verify receipts promptly, treat Tenants fairly, use the platform for legitimate purposes</li>
                    <li><strong>Guards:</strong> Follow property access protocols, maintain professionalism</li>
                  </ul>
                </section>

                <Separator />

                {/* 25. Acknowledgment */}
                <section id="acknowledgment" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">25. Acknowledgment</h2>
                  <p>By using Yegara Home Connect, you acknowledge that:</p>
                  <ol className="list-decimal space-y-1.5 pl-6">
                    <li>You have read and understand these Terms</li>
                    <li>You agree to be bound by these Terms</li>
                    <li>You are legally responsible for your actions on the Platform</li>
                    <li>You are using the Platform at your own risk</li>
                    <li>Yegara is an intermediary and not responsible for user interactions</li>
                    <li>You will use the Platform in compliance with Ethiopian laws</li>
                  </ol>
                </section>

                <Separator />

                {/* 26. Additional Disclaimers */}
                <section id="additional-disclaimers" className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">26. Additional Disclaimers</h2>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">26.1 No Legal Advice</h3>
                    <p>
                      Yegara does not provide legal advice. For assistance regarding rental agreements, property law, or tenant rights, please consult a qualified Ethiopian lawyer.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">26.2 No Financial Advice</h3>
                    <p>
                      Yegara does not provide financial advice. For advice on rent payments, budgeting, or financial matters, please consult a financial professional.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">26.3 No Verification</h3>
                    <p>
                      Yegara does not verify the identity of users beyond basic registration, the authenticity of uploaded receipts, the existence of rental agreements, or the financial status of users.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">26.4 No Liability for Offline Conduct</h3>
                    <p>
                      Yegara is not responsible for any actions or interactions that occur offline between users, including physical altercations, disputes over property conditions, eviction proceedings, or non-payment of rent.
                    </p>
                  </div>
                </section>

                <Separator />

                {/* 27. Force Majeure */}
                <section id="force-majeure" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">27. Force Majeure</h2>
                  <p>
                    Yegara is not liable for any failure or delay in performance due to events beyond our reasonable control, including natural disasters, pandemics, government actions, internet outages, labor disputes, or civil unrest.
                  </p>
                </section>

                <Separator />

                {/* 28. Contact for Legal Notices */}
                <section id="legal-notices" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">28. Contact for Legal Notices</h2>
                  <p>
                    For legal notices, subpoenas, or court orders:{" "}
                    <a href="mailto:engdaworkchernet@outlook.com" className="text-primary underline">
                      engdaworkchernet@outlook.com
                    </a>
                  </p>
                  <p className="text-muted-foreground">
                    Please include &quot;Legal Process&quot; in the subject line. We aim to respond within 5 business days.
                  </p>
                </section>

                <Separator />

                {/* 29. Platform Features */}
                <section id="platform-features" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">29. Platform Features</h2>
                  <ul className="list-disc space-y-1.5 pl-6">
                    <li><strong>Dashboard:</strong> Role-based views for Owners, Tenants, and Guards</li>
                    <li><strong>Receipt Upload (Tenants):</strong> Upload screenshots, add metadata, view verification status</li>
                    <li><strong>Receipt Review (Owners):</strong> View receipts, verify as Paid/Unpaid, track payment history</li>
                    <li><strong>Announcements:</strong> Owners can send announcements to Tenants</li>
                    <li><strong>Profile Management:</strong> Update info, change roles, manage property associations</li>
                  </ul>
                </section>

                <Separator />

                {/* 30. Severability and Savings Clause */}
                <section id="severability" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">30. Severability and Savings Clause</h2>
                  <p>
                    If any provision of these Terms is found to be illegal, invalid, or unenforceable, the provision will be modified to the minimum extent necessary to make it enforceable. If it cannot be modified, it will be removed, and the remaining provisions remain in full force and effect.
                  </p>
                </section>

                <Separator />

                {/* 31. Waiver of Rights */}
                <section id="waiver" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">31. Waiver of Rights</h2>
                  <p>
                    No delay or failure to exercise a right under these Terms constitutes a waiver of that right. A waiver is only valid if it is in writing and signed by an authorized representative of Yegara.
                  </p>
                </section>

                <Separator />

                {/* 32. Relationship of Parties */}
                <section id="relationship-parties" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">32. Relationship of Parties</h2>
                  <p>
                    These Terms do not create an employment relationship, a partnership or joint venture, an agency relationship, or a fiduciary duty. Users are independent contractors and are solely responsible for their own taxes, compliance, and obligations.
                  </p>
                </section>

                <Separator />

                {/* 33. Third-Party Services */}
                <section id="third-party-services" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">33. Third-Party Services</h2>
                  <p>Yegara Home Connect integrates with third-party services:</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li><strong>Supabase</strong> — Database and Authentication (stores user data, receipts)</li>
                    <li><strong>Cloudflare</strong> — CDN and Hosting (serves website assets)</li>
                    <li><strong>Google Gemini</strong> — Receipt verification AI (processes receipt images if enabled)</li>
                  </ul>
                  <p className="text-muted-foreground">
                    We are not responsible for the privacy practices of third parties. Please review their policies separately.
                  </p>
                </section>

                <Separator />

                {/* 34. Data Retention */}
                <section id="data-retention" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">34. Data Retention</h2>
                  <ul className="list-disc space-y-1.5 pl-6">
                    <li><strong>Account Information:</strong> Until account deletion</li>
                    <li><strong>Receipts:</strong> Until account deletion + 30 days</li>
                    <li><strong>Usage Logs:</strong> 180 days</li>
                    <li><strong>Deleted Data:</strong> 30 days (recovery period)</li>
                  </ul>
                  <p className="text-muted-foreground">
                    After account deletion, data is permanently removed and cannot be recovered.
                  </p>
                </section>

                <Separator />

                {/* 35. User Appeals */}
                <section id="user-appeals" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">35. User Appeals</h2>
                  <p>
                    If your account is suspended or terminated, you may appeal by contacting{" "}
                    <a href="mailto:engdaworkchernet@outlook.com" className="text-primary underline">
                      engdaworkchernet@outlook.com
                    </a>{" "}
                    with the subject line &quot;Appeal of Suspension - [YOUR USERNAME]&quot;. We will respond within 10 business days.
                  </p>
                </section>

                <Separator />

                {/* 36. General Provisions */}
                <section id="general-provisions" className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">36. General Provisions</h2>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">36.1 Ethiopian Law Prevails</h3>
                    <p>These Terms are governed by Ethiopian law. Any ambiguity will be resolved in favor of Ethiopian law.</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">36.2 No Surrender of Rights</h3>
                    <p>Our enforcement of these Terms does not prevent us from taking other legal action.</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">36.3 Headings</h3>
                    <p>Section headings are for convenience only and do not affect interpretation.</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">36.4 Time Periods</h3>
                    <p>Unless otherwise specified, time periods are measured in Ethiopian Standard Time (EAT, UTC+3).</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">36.5 Notice</h3>
                    <p>Notices to users will be sent via email (to the address on file), platform notifications, or website announcements.</p>
                  </div>
                </section>

                <Separator />

                {/* 37. Acknowledgment and Acceptance */}
                <section id="acceptance" className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground">37. Acknowledgment and Acceptance</h2>
                  <p className="font-semibold uppercase tracking-wide">
                    BY CREATING AN ACCOUNT AND USING YEGARA HOME CONNECT, YOU:
                  </p>
                  <ul className="list-disc space-y-1.5 pl-6">
                    <li>Acknowledge that you have read these Terms</li>
                    <li>Agree to be bound by these Terms</li>
                    <li>Confirm that you are at least 18 years old</li>
                    <li>Accept that Yegara is an intermediary platform</li>
                    <li>Understand that we do not handle payments</li>
                    <li>Agree to use the Platform in compliance with Ethiopian law</li>
                    <li>Accept that you use the Platform at your own risk</li>
                  </ul>
                </section>

                <Separator />

                {/* 38. Effective Date */}
                <section id="effective-date" className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">38. Effective Date</h2>
                  <p>These Terms are effective as of September 14, 2024.</p>
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <p className="font-semibold text-foreground">Yegara Home Connect</p>
                    <p className="text-muted-foreground text-xs mt-0.5">Making rent management easier for everyone.</p>
                    <p className="mt-3 text-sm">
                      Contact:{" "}
                      <a href="mailto:engdaworkchernet@outlook.com" className="text-primary underline font-medium">
                        engdaworkchernet@outlook.com
                      </a>
                    </p>
                  </div>
                </section>

                <Separator />

                {/* Back to Home Button at bottom */}
                <div className="pt-2 flex justify-between items-center">
                  <Button asChild variant="outline">
                    <Link to="/">
                      <ArrowLeft className="mr-2 size-4" />
                      Back to Home
                    </Link>
                  </Button>
                  <a href="#overview" className="text-xs text-muted-foreground hover:text-foreground">
                    Back to top ↑
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
