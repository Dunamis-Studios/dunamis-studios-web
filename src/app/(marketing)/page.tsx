import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroGradient } from "@/components/marketing/hero-gradient";
import { ProductTile } from "@/components/marketing/product-tile";
import { CustomerLogoStrip } from "@/components/marketing/customer-logo-strip";

export default function LandingPage() {
  return (
    <>
      {/* ---- HERO ---- */}
      <div className="relative overflow-hidden">
        <HeroGradient />
        <Container size="xl" className="py-24 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center stagger">
            <Badge variant="accent" className="mx-auto">
              <Sparkles className="h-3 w-3" aria-hidden />
              Studio of one, built with care
            </Badge>
            <h1 className="mt-6 font-[var(--font-display)] text-5xl font-medium tracking-[-0.03em] leading-[1.02] text-[var(--fg)] sm:text-6xl lg:text-7xl">
              Precision tools for
              <span className="relative inline-block px-1">
                <span className="relative z-10 italic text-[var(--accent)]">
                  HubSpot
                </span>
              </span>
              .
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-[var(--fg-muted)]">
              Dunamis Studios builds focused, reliable apps for the HubSpot
              marketplace. One account, every entitlement, every portal.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Create an account
                  <ArrowRight className="ml-0.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* ---- PRODUCTS ---- */}
      <Section className="relative">
        <Container size="xl">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                Products
              </div>
              <h2 className="mt-2 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
                Built for operators who live in HubSpot.
              </h2>
            </div>
            <p className="max-w-sm text-[var(--fg-muted)]">
              Each app solves one specific problem, end-to-end. No toolbelts,
              no half-finished features.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <ProductTile
              accent="pulse"
              name="Property Pulse"
              tagline="Real-time deal health for HubSpot CRM"
              href="/products/property-pulse"
              description="Watches every deal property you care about and surfaces drift, staleness, and risk before it shows up on a forecast call."
            />
            <ProductTile
              accent="brief"
              name="Debrief"
              tagline="AI-assisted call summaries inside HubSpot"
              href="/products/debrief"
              description="Automatic, structured recaps for every meeting — linked to the right deal, contact, and next steps, no copy-paste required."
            />
            <ProductTile
              accent="muted"
              comingSoon
              name="More, soon"
              tagline="Quietly in the lab"
              href="#"
              description="We ship slowly and deliberately. New apps land when they're sharper than what already exists."
            />
          </div>
        </Container>
      </Section>

      {/* ---- SOCIAL PROOF STRIP ---- */}
      <CustomerLogoStrip />

      {/* ---- PRINCIPLES ---- */}
      <Section>
        <Container size="xl">
          <div className="grid gap-10 lg:grid-cols-3">
            <Principle
              index="01"
              title="Single pane of glass"
              body="One Dunamis Studios account holds every entitlement across every HubSpot portal you admin. Install once, manage forever."
            />
            <Principle
              index="02"
              title="Built for admins"
              body="No toy integrations. Proper error states, real audit trails, correct webhook semantics. The boring, important stuff."
            />
            <Principle
              index="03"
              title="Quietly powerful"
              body="Dunamis — δύναμις — is Greek for power, capability, potential. The work should feel obvious, never loud."
            />
          </div>
        </Container>
      </Section>

      {/* ---- FINAL CTA ---- */}
      <Section>
        <Container size="md">
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-8 py-16 text-center sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-60"
              style={{
                background:
                  "radial-gradient(ellipse at bottom, color-mix(in oklch, var(--color-brand-500) 30%, transparent) 0%, transparent 60%)",
              }}
            />
            <h2 className="font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
              One account. Every app. Every portal.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[var(--fg-muted)]">
              Create your Dunamis Studios account today — your entitlements
              appear here automatically as you install apps from HubSpot.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Create an account
                  <ArrowRight className="ml-0.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function Principle({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="font-mono text-xs text-[var(--fg-subtle)]">{index}</div>
      <h3 className="mt-3 font-[var(--font-display)] text-xl font-medium tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-[var(--fg-muted)] leading-relaxed">{body}</p>
    </div>
  );
}
