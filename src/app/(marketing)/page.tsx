import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroGradient } from "@/components/marketing/hero-gradient";
import { ProductTile } from "@/components/marketing/product-tile";
import { CustomerLogoStrip } from "@/components/marketing/customer-logo-strip";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { buildFaqPageSchema } from "@/components/marketing/article-extras";
import { JsonLd } from "@/components/seo/json-ld";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { siteFreshness } from "@/lib/schema-freshness";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const HUBSPOT_VISIBLE = FEATURE_FLAGS.hubspotSurfacesVisible;

// Single source of truth for the homepage FAQ. Drives both the visible
// accordion and the FAQPage JSON-LD so answer engines can cite Q/A
// pairs verbatim. Same pattern as the product pages.
const FAQ_HUBSPOT: { q: string; a: string }[] = [
  {
    q: "What is Dunamis Studios?",
    a: "Dunamis Studios is a software studio with two service lines and a small catalog of products. Build Services is custom application development for agencies (white-label) and end businesses (direct), scoped through paid discovery and shipped on your infrastructure with full handover documentation. HubSpot Custom Development is our specialty practice for HubSpot UI extensions, integrations, and recovery work. Our products today are Property Pulse (a CRM card that surfaces full property change history on every HubSpot record) and Debrief (an AI-powered handoff brief and message generator). We also publish free HubSpot calculators and assessments at dunamisstudios.net/custom-development/tools.",
  },
  {
    q: "Which products do you ship today?",
    a: "Property Pulse is live in open beta on the HubSpot marketplace. Debrief is built and waiting on its marketplace listing. Carbon Copy and Traverse and Update are working code with marketplace listings in progress. Association Visualizer is an internal tool we are deciding whether to release publicly. The full HubSpot products catalog is at /custom-development/products.",
  },
  {
    q: "Do I need a Dunamis Studios account separate from my HubSpot account?",
    a: "Yes. Your Dunamis Studios account holds every entitlement across every HubSpot portal you administer. Install an app from the HubSpot marketplace, then claim the entitlement from your Dunamis Studios account dashboard. One account covers all of our apps and all of your portals.",
  },
  {
    q: "How do you handle our HubSpot data?",
    a: "Each app reads only the HubSpot data it needs at the moment it needs it, scoped by OAuth to specific objects and actions. Configuration data lives inside your HubSpot portal where possible (Property Pulse keeps tracked-property settings in a HubDB table in your portal). Dunamis Studios servers hold OAuth tokens, app metadata, and per-portal entitlement state, and they do not maintain a separate copy of your CRM data. Per-app specifics are documented on each product page.",
  },
];

const FAQ_GENERAL: { q: string; a: string }[] = [
  {
    q: "What is Dunamis Studios?",
    a: "Dunamis Studios is a software studio that builds custom applications for agencies and businesses, scoped through paid discovery and shipped on your infrastructure with full handover documentation. We also publish a small catalog of prebuilt desktop software, beginning with Atelier for professional wedding planners.",
  },
  {
    q: "How does Build Services work?",
    a: "Engagements begin with a fixed-price discovery phase that produces a written scope, architecture sketch, and fixed-price quote for the build phase. Build tiers are published; custom scopes outside the tiers get their own quote after discovery. You own the code at handover; the app runs on infrastructure you control.",
  },
  {
    q: "Do you offer subscriptions?",
    a: "No. Prebuilt apps in the catalog are one-time purchases. You own the code, run it yourself, and keep using it indefinitely. No license check-in, no recurring fees, no kill switch.",
  },
];

const FAQ = HUBSPOT_VISIBLE ? FAQ_HUBSPOT : FAQ_GENERAL;

const faqPageSchema = buildFaqPageSchema(FAQ, {
  name: "Dunamis Studios FAQ",
  description: HUBSPOT_VISIBLE
    ? "Frequently asked questions about Dunamis Studios, our HubSpot marketplace apps, and how account claims and entitlements work."
    : "Frequently asked questions about Dunamis Studios, our Build Services engagements, and our prebuilt apps.",
  url: `${SITE_URL}/`,
});

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
  ...siteFreshness(),
  name: "Dunamis Studios",
  url: SITE_URL,
  description: HUBSPOT_VISIBLE
    ? "A software studio for custom application development with a HubSpot specialty. Home of Build Services, HubSpot Custom Development, Debrief, and Property Pulse."
    : "A software studio for custom application development. Home of Build Services and a small catalog of prebuilt apps.",
  publisher: {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
  },
  // Mirror the Organization sameAs so crawlers that look for social
  // links on the WebSite entity (rather than reconciling to the
  // Organization @id reference above) still find them. Add new
  // profiles here whenever they are added to layout.tsx.
  sameAs: ["https://www.linkedin.com/company/dunamis-studios/"],
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/help/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const META_TITLE = HUBSPOT_VISIBLE
  ? "Dunamis Studios: Custom software, with a HubSpot specialty"
  : "Dunamis Studios: Custom software, built deliberately";

const META_DESCRIPTION = HUBSPOT_VISIBLE
  ? "A software studio that builds custom applications for agencies and businesses, with a HubSpot specialty practice and products for HubSpot CRM. Home of Debrief and Property Pulse."
  : "A software studio that builds custom applications for agencies and businesses, plus a small catalog of prebuilt desktop apps.";

export const metadata: Metadata = {
  // Use absolute title here, landing page shouldn't receive the
  // "%s · Dunamis Studios" template since it IS the studio.
  title: {
    absolute: META_TITLE,
  },
  description: META_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: META_TITLE,
    description: META_DESCRIPTION,
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
        alt: META_TITLE,
        type: "image/png",
      },
    ],
  },
};

export default function LandingPage() {
  return (
    <>
      <JsonLd id="jsonld-home-website" schema={websiteSchema} />
      <JsonLd id="jsonld-home-faq" schema={faqPageSchema} />
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
              A software studio,
              <span className="relative inline-block px-1">
                <span className="relative z-10 italic text-[var(--accent)]">
                  built deliberately
                </span>
              </span>
              .
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-[var(--fg-muted)]">
              {HUBSPOT_VISIBLE
                ? "Dunamis Studios builds custom applications for agencies and businesses, runs a HubSpot specialty practice, and ships a small catalog of products for HubSpot CRM."
                : "Dunamis Studios builds custom applications for agencies and businesses, plus a small catalog of prebuilt desktop software."}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/build-services">
                  Explore Build Services
                  <ArrowRight className="ml-0.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={HUBSPOT_VISIBLE ? "/custom-development/products" : "/marketplace"}>
                  {HUBSPOT_VISIBLE ? "See products" : "Visit marketplace"}
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* ---- SERVICES ---- */}
      <Section className="relative">
        <Container size="xl">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                What we do
              </div>
              <h2 className="mt-2 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
                {HUBSPOT_VISIBLE
                  ? "Two service lines, one studio."
                  : "Custom applications, built to fixed scope."}
              </h2>
            </div>
            <p className="max-w-sm text-[var(--fg-muted)]">
              {HUBSPOT_VISIBLE
                ? "Build Services for custom application development. HubSpot Custom Development for HubSpot-specific work. Both shipped to fixed scope."
                : "Custom application development for agencies and end businesses. Paid discovery, fixed-price tiers, full handover."}
            </p>
          </div>

          <div
            className={
              HUBSPOT_VISIBLE
                ? "grid gap-5 md:grid-cols-2"
                : "grid gap-5"
            }
          >
            <ServiceTile
              accent="build"
              name="Build Services"
              tagline="Custom application development"
              href="/build-services"
              description="White-label for agencies, direct for businesses. Paid discovery, fixed-price tiers, hosting on your infrastructure, full handover documentation, 30 days of post-launch bug-fix support."
            />
            {HUBSPOT_VISIBLE ? (
              <ServiceTile
                accent="hubspot"
                name="HubSpot Custom Development"
                tagline="Our HubSpot specialty practice"
                href="/custom-development"
                description="HubSpot UI extensions, marketplace apps, API integrations, data pipelines, AI workflows, and portal recovery. For teams beyond what an admin can configure."
              />
            ) : null}
          </div>
        </Container>
      </Section>

      {/* ---- PRODUCTS ---- */}
      {HUBSPOT_VISIBLE ? (
        <Section className="relative border-t border-[var(--border)]">
          <Container size="xl">
            <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                  HubSpot Products
                </div>
                <h2 className="mt-2 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
                  Apps for operators who live in HubSpot.
                </h2>
              </div>
              <p className="max-w-sm text-[var(--fg-muted)]">
                Each app solves one specific HubSpot problem, end-to-end. No
                toolbelts, no half-finished features.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <ProductTile
                accent="pulse"
                name="Property Pulse"
                tagline="Real-time deal health for HubSpot CRM"
                href="/custom-development/products/property-pulse"
                description="Watches every deal property you care about and surfaces drift, staleness, and risk before it shows up on a forecast call."
              />
              <ProductTile
                accent="brief"
                name="Debrief"
                tagline="Handoff intelligence for HubSpot CRM"
                href="/custom-development/products/debrief"
                description="When a record changes hands in HubSpot, Debrief gives the new owner a structured brief, and gives the old owner a message to send with it."
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
      ) : null}

      {/* ---- SOCIAL PROOF STRIP ---- */}
      <CustomerLogoStrip />

      {/* ---- PRINCIPLES ---- */}
      <Section>
        <Container size="xl">
          <div className="grid gap-10 lg:grid-cols-3">
            <Principle
              index="01"
              title={
                HUBSPOT_VISIBLE
                  ? "Single pane of glass for HubSpot apps"
                  : "Customer-owned software"
              }
              body={
                HUBSPOT_VISIBLE
                  ? "One Dunamis Studios account holds every HubSpot product entitlement across every portal you admin. Install once, manage forever."
                  : "Build Services projects ship to your infrastructure with full handover. Prebuilt apps are one-time purchase, customer-hosted, owned forever."
              }
            />
            <Principle
              index="02"
              title={HUBSPOT_VISIBLE ? "Built for admins" : "Built for operators"}
              body={
                HUBSPOT_VISIBLE
                  ? "No toy integrations. Proper error states, real audit trails, correct webhook semantics. The boring, important stuff."
                  : "No toy integrations. Proper error states, real audit trails, correct semantics. The boring, important stuff."
              }
            />
            <Principle
              index="03"
              title="Quietly powerful"
              body="Dunamis (δύναμις) is Greek for power, capability, potential. The work should feel obvious, never loud."
            />
          </div>
        </Container>
      </Section>

      {/* ---- FAQ ---- */}
      <MarketingFaq faq={FAQ} />

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
              {HUBSPOT_VISIBLE
                ? "One account. Every app. Every portal."
                : "Built deliberately. Shipped to you."}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[var(--fg-muted)]">
              {HUBSPOT_VISIBLE
                ? "Create your Dunamis Studios account today. Your entitlements appear here automatically as you install apps from HubSpot."
                : "Create your Dunamis Studios account to manage purchases and entitlements for every app you buy from us."}
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

function ServiceTile({
  accent,
  name,
  tagline,
  href,
  description,
}: {
  accent: "build" | "hubspot";
  name: string;
  tagline: string;
  href: string;
  description: string;
}) {
  const accentText =
    accent === "build"
      ? "text-[var(--color-build-600)] dark:text-[var(--color-build-400)]"
      : "text-[var(--color-hubspot-600)] dark:text-[var(--color-hubspot-400)]";
  const accentBorder =
    accent === "build"
      ? "hover:border-[var(--color-build-500)]/50"
      : "hover:border-[var(--color-hubspot-500)]/50";
  return (
    <Link
      href={href}
      className={`group relative isolate flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-7 transition-colors ${accentBorder}`}
    >
      <div className="flex items-center justify-between gap-3">
        <Badge variant={accent === "build" ? "build" : "hubspot"}>
          {accent === "build" ? "Build Services" : "HubSpot Specialty"}
        </Badge>
        <ArrowRight
          className={`h-5 w-5 text-[var(--fg-subtle)] transition-all duration-300 group-hover:translate-x-0.5 ${accentText}`}
          aria-hidden
        />
      </div>
      <h3 className={`mt-5 font-[var(--font-display)] text-2xl font-medium tracking-tight ${accentText}`}>
        {name}
      </h3>
      <p className="mt-1 text-sm text-[var(--fg-muted)]">{tagline}</p>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-[var(--fg-muted)]">
        {description}
      </p>
    </Link>
  );
}
