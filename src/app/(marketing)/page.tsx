import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroGradient } from "@/components/marketing/hero-gradient";
import { ProductTile } from "@/components/marketing/product-tile";
import { CustomerLogoStrip } from "@/components/marketing/customer-logo-strip";
import { JsonLd } from "@/components/seo/json-ld";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

/**
 * WebSite schema with SearchAction. Mirrors the help-center pattern
 * but at the site root: declares Dunamis Studios as the site entity
 * and tells Google the URL template for the on-site search box,
 * which is currently scoped to the help center. The publisher field
 * cross-references the Organization schema in layout.tsx by @id so
 * the two blocks resolve to the same entity instead of duplicating
 * Organization metadata.
 */
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Dunamis Studios",
  url: SITE_URL,
  description:
    "Focused, reliable apps for the HubSpot marketplace. Built by a team that uses HubSpot every day. Home of Debrief and Property Pulse.",
  publisher: {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/help/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const metadata: Metadata = {
  // Use absolute title here — landing page shouldn't receive the
  // "%s · Dunamis Studios" template since it IS the studio.
  title: {
    absolute:
      "Dunamis Studios — Precision tools for the HubSpot marketplace",
  },
  description:
    "Focused, reliable apps for the HubSpot marketplace. Built by a team that uses HubSpot every day. Home of Debrief and Property Pulse.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Dunamis Studios — Precision tools for the HubSpot marketplace",
    description:
      "Focused, reliable apps for the HubSpot marketplace. Built by a team that uses HubSpot every day. Home of Debrief and Property Pulse.",
    url: "/",
    type: "website",
    // Page-level openGraph blocks replace (not merge) the layout's
    // openGraph, which suppresses the opengraph-image.tsx file-convention
    // auto-inject. Explicit images array restores og:image* emission.
    // Relative URL resolves against metadataBase in layout.tsx.
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Dunamis Studios — Precision tools for the HubSpot marketplace",
        type: "image/png",
      },
    ],
  },
};

export default function LandingPage() {
  return (
    <>
      <JsonLd id="jsonld-home-website" schema={websiteSchema} />
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
              tagline="Handoff intelligence for HubSpot CRM"
              href="/products/debrief"
              description="When a record changes hands in HubSpot, Debrief gives the new owner a structured brief — and gives the old owner a message to send with it."
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
