import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, Minus } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroGradient } from "@/components/marketing/hero-gradient";
import { CustomDevelopmentContactForm } from "@/components/marketing/custom-development-contact-form";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { buildFaqPageSchema } from "@/components/marketing/article-extras";
import { JsonLd } from "@/components/seo/json-ld";
import { siteFreshness } from "@/lib/schema-freshness";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  ...siteFreshness(),
  name: "Build Services",
  description:
    "White-label and direct custom application development from Dunamis Studios. Paid discovery, fixed-price tiers, hosting on your infrastructure, and full handover documentation.",
  url: `${SITE_URL}/build-services`,
  isPartOf: {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
  },
  publisher: {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is Build Services?",
    a: "Custom application development outside the HubSpot ecosystem. We take engagements directly from end businesses and on a white-label basis from agencies who need a build partner. We scope the project, build it, ship it, set up hosting on your infrastructure, and hand over full product documentation.",
  },
  {
    q: "Who buys Build Services?",
    a: "Two buyer types. Agencies who don't have in-house engineering capacity and need a white-label build partner they can resell to their own clients. And end businesses who want custom software built directly without going through a middleman. The engagement structure is the same; the relationship and branding differ.",
  },
  {
    q: "How is this different from HubSpot Custom Development?",
    a: "Build Services is for custom software outside HubSpot — internal tools, customer portals, dashboards, integrations between non-HubSpot systems, full custom applications. HubSpot Custom Development is our specialty practice for HubSpot-specific work like UI extensions, marketplace apps, and HubSpot API integrations. If your project is HubSpot-centric, start there instead.",
  },
  {
    q: "Where do I find pricing?",
    a: "Tiers, ranges, what every build includes, and the discovery process all live on the dedicated Build Services pricing page. Every engagement starts with paid discovery and a fixed-quote spec doc.",
  },
];

const faqPageSchema = buildFaqPageSchema(FAQ, {
  name: "Build Services FAQ",
  description:
    "Frequently asked questions about Dunamis Studios Build Services: scope, paid discovery, pricing tiers, what's included, and white-label engagements.",
  url: `${SITE_URL}/build-services`,
});

export const metadata: Metadata = {
  title: "Build Services",
  description:
    "Custom application development for agencies (white-label) and businesses (direct). Paid discovery, fixed-price tiers, hosting on your infrastructure, full handover documentation.",
  alternates: { canonical: "/build-services" },
  openGraph: {
    title: "Build Services · Dunamis Studios",
    description:
      "Custom application development for agencies (white-label) and businesses (direct). Paid discovery, fixed-price tiers, hosting on your infrastructure, full handover documentation.",
    url: "/build-services",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Build Services · Dunamis Studios",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Build Services · Dunamis Studios",
    description:
      "Custom application development for agencies (white-label) and businesses (direct). Paid discovery, fixed-price tiers, hosting on your infrastructure, full handover documentation.",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "Build Services · Dunamis Studios",
      },
    ],
  },
};

const PROCESS_STEPS: { title: string; body: string }[] = [
  {
    title: "Paid discovery",
    body: "Starts at $250-400 depending on complexity. We work through the problem, scope, and constraints together.",
  },
  {
    title: "Spec doc + fixed quote",
    body: "Discovery delivers a written spec doc — feature list, tech stack, hosting plan, and a fixed-price quote for the build. The discovery fee credits toward the build if you move forward.",
  },
  {
    title: "Build and ship",
    body: "We build to spec, ship the deploy on your infrastructure, and hand over with full documentation.",
  },
  {
    title: "30 days of bug-fix support",
    body: "Anything that doesn't match the spec, we fix. Anything beyond the spec is a new engagement.",
  },
];

const BUYERS: { title: string; body: string }[] = [
  {
    title: "Agencies (white-label)",
    body: "You sell custom software to your clients but don't have engineering capacity in house. We build under your banner, hand over to you, and stay invisible to the end client unless you want us in the room.",
  },
  {
    title: "Businesses (direct)",
    body: "You want custom software built directly, without a middleman markup. You're the buyer, you're the user, and you keep everything when we're done — code, deploy, documentation.",
  },
];

const NOT_FIT_FOR: string[] = [
  "Marketing site builds (we point those to specialist agencies)",
  "Pure design or branding work",
  "Maintenance contracts on apps we didn't build",
  "Mobile-only apps (iOS/Android native)",
];

export default function BuildServicesPage() {
  return (
    <>
      <JsonLd id="jsonld-build-services-webpage" schema={webPageSchema} />
      <JsonLd id="jsonld-build-services-faq" schema={faqPageSchema} />

      {/* ---- HERO ---- */}
      <div className="relative overflow-hidden">
        <HeroGradient />
        <Container size="xl" className="py-24 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center stagger">
            <Badge variant="build" className="mx-auto">
              Build Services
            </Badge>
            <h1 className="mt-6 font-[var(--font-display)] text-5xl font-medium tracking-[-0.03em] leading-[1.02] text-[var(--fg)] sm:text-6xl lg:text-7xl">
              Custom software,
              <span className="relative inline-block px-1">
                <span className="relative z-10 italic text-[var(--color-build-600)] dark:text-[var(--color-build-400)]">
                  built and shipped
                </span>
              </span>
              .
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-[var(--fg-muted)]">
              White-label custom application development for agencies, and
              direct engagements for businesses. Scoped, built, shipped, and
              handed over with full documentation.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="#contact">
                  <Mail className="h-4 w-4" />
                  Start a conversation
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/build-services/pricing">
                  See pricing
                  <ArrowRight className="ml-0.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* ---- INTRO ---- */}
      <Section className="border-t border-[var(--border)]">
        <Container size="md">
          <p className="text-lg leading-relaxed text-[var(--fg-muted)]">
            Build Services is our custom application development practice
            outside the HubSpot ecosystem. We take direct engagements from
            businesses and white-label work from agencies. Every build runs
            through paid discovery first, ships to a fixed quote, deploys on
            your infrastructure, and hands over with full documentation. If
            your project is HubSpot-centric,{" "}
            <Link
              href="/custom-development"
              className="text-[var(--color-hubspot-600)] underline underline-offset-4 hover:text-[var(--color-hubspot-700)] dark:text-[var(--color-hubspot-400)] dark:hover:text-[var(--color-hubspot-300)]"
            >
              start with HubSpot Custom Development
            </Link>
            .
          </p>
        </Container>
      </Section>

      {/* ---- PRICING TEASER ---- */}
      <Section className="border-t border-[var(--border)]">
        <Container size="xl">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-3 lg:items-center">
              <div className="lg:col-span-2">
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-build-700)] dark:text-[var(--color-build-400)]">
                  Pricing
                </div>
                <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
                  Four fixed-price tiers, scoped after discovery
                </h2>
                <p className="mt-4 max-w-2xl text-[var(--fg-muted)] leading-relaxed">
                  Builds run $2,500 to $20,000+ across four tiers. Every
                  engagement starts with paid discovery ($250-400, credited
                  toward the build) and a written spec doc. Hosting on your
                  infrastructure, full handover documentation, and 30 days of
                  bug-fix support ship with every tier.
                </p>
              </div>
              <div className="flex lg:justify-end">
                <Button asChild size="lg">
                  <Link href="/build-services/pricing">
                    See pricing
                    <ArrowRight className="ml-0.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---- WHO ---- */}
      <Section className="border-t border-[var(--border)]">
        <Container size="xl">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Who we work with
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Two buyer types, one engagement model
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {BUYERS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-7"
              >
                <h3 className="font-[var(--font-display)] text-xl font-medium tracking-tight">
                  {b.title}
                </h3>
                <p className="mt-3 text-[var(--fg-muted)] leading-relaxed">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---- PROCESS ---- */}
      <Section className="border-t border-[var(--border)]">
        <Container size="xl">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Process
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            How an engagement runs
          </h2>
          <div className="mt-12 grid gap-10 lg:grid-cols-4">
            {PROCESS_STEPS.map((step, i) => (
              <div key={step.title}>
                <div className="font-mono text-xs text-[var(--fg-subtle)]">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-3 font-[var(--font-display)] text-xl font-medium tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-[var(--fg-muted)] leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---- NOT A FIT ---- */}
      <Section className="border-t border-[var(--border)]">
        <Container size="md">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Not a fit for
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            What Build Services isn&apos;t
          </h2>
          <ul className="mt-8 space-y-3 border-y border-[var(--border)] py-6">
            {NOT_FIT_FOR.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm text-[var(--fg)]"
              >
                <Minus
                  className="h-4 w-4 mt-0.5 shrink-0 text-[var(--fg-subtle)]"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ---- FAQ ---- */}
      <MarketingFaq faq={FAQ} />

      {/* ---- CTA ---- */}
      <Section id="contact" className="border-t border-[var(--border)]">
        <Container size="md">
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-8 py-16 text-center sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-60"
              style={{
                background:
                  "radial-gradient(ellipse at bottom, color-mix(in oklch, var(--color-build-500) 30%, transparent) 0%, transparent 60%)",
              }}
            />
            <CustomDevelopmentContactForm
              source="build-services"
              heading="Start a Build"
              blurb="Tell us what you want built. We'll respond within two business days with whether it's a fit and a discovery quote if so."
              successHeading="Thanks, message received."
              successBody="We'll respond within two business days with whether it's a fit and a discovery quote if so."
              submitLabel="Send inquiry"
            />
          </div>
        </Container>
      </Section>
    </>
  );
}
