import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Mail, Minus } from "lucide-react";
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
    q: "How does the paid discovery phase work?",
    a: "Discovery starts at $250-400 depending on project complexity. The deliverable is a written spec doc covering the feature list, recommended tech stack, hosting plan, and a fixed-price quote for the build. If you decide to move forward with the build, the discovery fee is credited toward the project. If you don't, you keep the spec doc and can take it to any developer.",
  },
  {
    q: "What's included in every tier?",
    a: "Every Build Services tier includes hosting setup on your own infrastructure (your accounts, your control), full product documentation covering architecture and operations, and 30 days of bug-fix support after launch. A bug means what we specced isn't working as specced. New feature requests, scope expansions, or fixes for things outside the original spec trigger a new statement of work.",
  },
  {
    q: "Who buys Build Services?",
    a: "Two buyer types. Agencies who don't have in-house engineering capacity and need a white-label build partner they can resell to their own clients. And end businesses who want custom software built directly without going through a middleman. The engagement structure is the same; the relationship and branding differ.",
  },
  {
    q: "How is this different from HubSpot Custom Development?",
    a: "Build Services is for custom software outside HubSpot — internal tools, customer portals, dashboards, integrations between non-HubSpot systems, full custom applications. HubSpot Custom Development is our specialty practice for HubSpot-specific work like UI extensions, marketplace apps, and HubSpot API integrations. If your project is HubSpot-centric, start there instead.",
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

type Tier = {
  name: string;
  price: string;
  pace: string;
  summary: string;
  bullets: string[];
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Starter",
    price: "$2,500-4,000",
    pace: "1-2 week build",
    summary: "A single-purpose tool. One job, done well.",
    bullets: [
      "One core feature, scoped tight",
      "Minimal UI, focused on the workflow",
      "Suitable for internal tools or single-page utilities",
    ],
  },
  {
    name: "Standard",
    price: "$5,000-8,500",
    pace: "3-4 week build",
    summary: "A multi-feature tool with light integrations.",
    bullets: [
      "Several connected features inside one product",
      "Light third-party integrations (auth, payments, email, one external API)",
      "Sensible UI patterns across views, basic admin surface",
    ],
    highlight: true,
  },
  {
    name: "Pro",
    price: "$10,000-18,000",
    pace: "5-8 week build",
    summary: "A full custom application with multiple roles and integrations.",
    bullets: [
      "Multi-role access (admin, end user, optional public surfaces)",
      "Multiple integrations and webhook-driven flows",
      "Production-grade error handling, observability, and admin tooling",
    ],
  },
  {
    name: "Custom",
    price: "$20,000+",
    pace: "Quoted after discovery",
    summary: "Larger or more complex builds. Quoted from the spec doc.",
    bullets: [
      "Multi-application or multi-tenant systems",
      "Heavier compliance, security, or migration scope",
      "Complex integration surfaces with multiple external systems",
    ],
  },
];

const ALWAYS_INCLUDED: { title: string; body: string }[] = [
  {
    title: "Hosting on your infrastructure",
    body: "We provision the deploy on accounts you own — Vercel, AWS, Cloudflare, your VPS, your call. You keep root access, billing, and DNS. Nothing is hostage on our side.",
  },
  {
    title: "Full product documentation",
    body: "Architecture overview, environment variables, deploy steps, third-party accounts, runbook for the things that break first. Written for whoever owns the system after we hand over.",
  },
  {
    title: "30 days of bug-fix support post-launch",
    body: "If what we specced isn't working as specced, we fix it on us within 30 days of launch. Anything outside the spec — new features, scope changes, additions you decide you want — triggers a new SOW.",
  },
];

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
                <Link href="#tiers">
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

      {/* ---- DISCOVERY ---- */}
      <Section className="border-t border-[var(--border)]">
        <Container size="xl">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Step one
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Paid Discovery
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-7">
              <p className="text-base leading-relaxed text-[var(--fg)]">
                Every build starts with a paid discovery phase, $250-400
                depending on complexity. The deliverable is a written spec doc
                covering:
              </p>
              <ul className="mt-5 space-y-2.5">
                {[
                  "Feature list, scoped to what the build will and won't include",
                  "Tech stack recommendation with reasoning",
                  "Hosting plan on your infrastructure",
                  "Fixed-price quote for the full build",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-[var(--fg)]"
                  >
                    <Check
                      className="h-4 w-4 mt-0.5 shrink-0 text-[var(--color-build-600)] dark:text-[var(--color-build-400)]"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm leading-relaxed text-[var(--fg-muted)]">
                The discovery fee is credited toward the build if you move
                forward. If you don&apos;t, you keep the spec doc and can take
                it to any developer.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_oklch,var(--color-build-500)_8%,var(--bg-elevated))] p-7">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-build-700)] dark:text-[var(--color-build-400)]">
                Discovery
              </div>
              <div className="mt-3 font-[var(--font-display)] text-4xl font-medium tracking-tight">
                $250-400
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">
                Credited toward the build if you move forward.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---- TIERS ---- */}
      <Section id="tiers" className="border-t border-[var(--border)]">
        <Container size="xl">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Build pricing
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Tiers
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--fg-muted)] leading-relaxed">
            Ranges below are starting bands. The exact number lands in the spec
            doc after discovery.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {TIERS.map((tier) => (
              <TierCard key={tier.name} tier={tier} />
            ))}
          </div>
        </Container>
      </Section>

      {/* ---- ALWAYS INCLUDED ---- */}
      <Section className="border-t border-[var(--border)]">
        <Container size="xl">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Every tier includes
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            What ships with every build
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {ALWAYS_INCLUDED.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6"
              >
                <div
                  aria-hidden
                  className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--color-build-500)_15%,transparent)] text-[var(--color-build-600)] dark:text-[var(--color-build-400)]"
                >
                  <Check className="h-4 w-4" />
                </div>
                <h3 className="font-[var(--font-display)] text-lg font-medium tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
                  {item.body}
                </p>
              </div>
            ))}
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

function TierCard({ tier }: { tier: Tier }) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border bg-[var(--bg-elevated)] p-6 ${
        tier.highlight
          ? "border-[var(--color-build-500)]/60 shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-build-500)_30%,transparent)]"
          : "border-[var(--border)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-[var(--font-display)] text-xl font-medium tracking-tight">
          {tier.name}
        </h3>
        {tier.highlight ? (
          <Badge variant="build">Most common</Badge>
        ) : null}
      </div>
      <div className="mt-4 font-[var(--font-display)] text-3xl font-medium tracking-tight text-[var(--fg)]">
        {tier.price}
      </div>
      <div className="mt-1 text-xs text-[var(--fg-subtle)]">{tier.pace}</div>
      <p className="mt-4 text-sm leading-relaxed text-[var(--fg-muted)]">
        {tier.summary}
      </p>
      <ul className="mt-5 space-y-2 border-t border-[var(--border)] pt-4">
        {tier.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm">
            <Check
              className="h-4 w-4 mt-0.5 shrink-0 text-[var(--color-build-600)] dark:text-[var(--color-build-400)]"
              aria-hidden
            />
            <span className="text-[var(--fg)]">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
