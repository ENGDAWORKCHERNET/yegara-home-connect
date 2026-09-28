import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, ShieldCheck, Sparkles, Receipt, Wrench, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yegara — Rent, Receipts & Property Management in Ethiopia" },
      {
        name: "description",
        content:
          "Yegara is a secure housing platform for Ethiopian landlords, tenants and guards: track rent, verify payment receipts with AI, and manage maintenance in one place.",
      },
      { property: "og:title", content: "Yegara — Housing Management for Ethiopia" },
      {
        property: "og:description",
        content:
          "Track rent, verify receipts with AI and manage maintenance requests across your properties.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Building2,
    title: "Property management",
    body: "Add houses, set rent and recurrence, and see at a glance which units are vacant or occupied.",
  },
  {
    icon: Receipt,
    title: "AI-checked receipts",
    body: "Tenants upload payment receipts; our AI reads the amount and gives each one a trust score.",
  },
  {
    icon: CalendarDays,
    title: "Rent alerts & calendar",
    body: "Colour-coded reminders for upcoming and overdue rent, with a calendar of every due date.",
  },
  {
    icon: Wrench,
    title: "Maintenance requests",
    body: "Tenants report issues with photos. Owners move them from pending to in-progress to resolved.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Every dashboard is protected. Receipts live in private storage behind time-limited links.",
  },
  {
    icon: Sparkles,
    title: "Community announcements",
    body: "Owners post notices; tenants and guards see them in a single chronological feed.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-4">
          <span className="flex items-center gap-2 font-semibold">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shrink-0">
              <Building2 className="size-5" />
            </span>
            <span className="text-base sm:text-lg">Yegara</span>
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2.5 sm:px-3 text-xs sm:text-sm">
              <Link to="/auth">Log in</Link>
            </Button>
            <Button asChild size="sm" className="h-8 px-3 sm:px-4 text-xs sm:text-sm">
              <Link to="/auth" search={{ mode: "signup" }}>
                Get started
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-3 sm:px-4 pt-10 pb-10 sm:pt-16 sm:pb-14 md:pt-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" /> Built for Ethiopian housing
            </span>
            <h1 className="mt-4 sm:mt-5 text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl md:text-6xl">
              Rent, receipts and repairs — <span className="text-gradient-brand">all in one place</span>
            </h1>
            <p className="mt-3 sm:mt-5 max-w-2xl text-sm sm:text-base text-muted-foreground md:text-lg">
              Yegara gives property owners, tenants and community guards a single trusted workspace:
              approve tenants, verify payment receipts with AI, and never miss a rent due date again.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto h-11 sm:h-12 text-sm sm:text-base">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create your account
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-11 sm:h-12 text-sm sm:text-base">
                <Link to="/auth">I already have an account</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-3 sm:px-4 pb-14 sm:pb-20">
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/70 shadow-card">
                <CardContent className="pt-6">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                    <feature.icon className="size-5" />
                  </span>
                  <h2 className="mt-4 font-semibold">{feature.title}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{feature.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-border/70 bg-card">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-3">
            {[
              { role: "Owners", body: "List houses, approve tenant requests and verify payments." },
              { role: "Tenants", body: "Find a house, upload receipts and report maintenance issues." },
              { role: "Guards", body: "See who lives where, with owner and tenant contact details." },
            ].map((item) => (
              <div key={item.role}>
                <h3 className="font-semibold text-primary">{item.role}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Yegara Housing Platform
      </footer>
    </div>
  );
}
