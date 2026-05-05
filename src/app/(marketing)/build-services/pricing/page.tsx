import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Mail } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroGradient } from "@/components/marketing/hero-gradient";
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
  name: "Build Services Pricing",
  description:
    "Fixed-price tiers for custom application development from Dunamis Studios. Paid discovery, four build tiers from $2,500 to $20,000+, hosting on your infrastructure, full handover documentation.",
  url: `${SITE_URL}/build-services/pricing`,
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
    q: "How does the paid discovery phase work?",
    a: "Discovery starts at $250-400 depending on project complexity. The deliverable is a written spec doc covering the feature list, recommended tech stack, hosting plan, and a fixed-price quote for the build. If you decide to move forward with the build, the discovery fee is credited toward the project. If you don't, you keep the spec doc and can take it to any developer.",
  },
  {
    q: "What's included in every tier?",
    a: "Every Build Services tier includes hosting setup on your own infrastructure (your accounts, your control), full product documentation covering architecture and operations, and 30 days of bug-fix support after launch. A bug means what we specced isn't working as specced. New feature requests, scope expansions, or fixes for things outside the original spec trigger a new statement of work.",
  },
  {
    q: "How are the tier ranges decided?",
    a: "Each tier is a starting band, not a hard cap. The exact number lands in the spec doc after discovery, once we know the feature list, integrations, and hosting plan. Discovery is what turns a band into a fixed quote.",
  },
  {
    q: "What if my project doesn't fit cleanly into a tier?",
    a: "It probably will land in Custom. The Starter, Standard, and Pro bands cover the common shapes; anything multi-tenant, regulated, or with unusual integration scope gets quoted from the spec doc directly.",
  },
  {
    q: "How does payment work?",
    a: "Discovery is paid upfront. Build engagements are split — typically half at kickoff, half at handover, with milestone splits available on Pro and Custom builds. Discovery fees credit toward the build invoice if you move forward.",
  },
];

const faqPageSchema = buildFaqPageSchema(FAQ, {
  name: "Build Services Pricing FAQ",
  description:
    "Frequently asked questions about Build Services pricing: paid discovery, fixed-price tiers, what's included, payment terms.",
  url: `${SITE_URL}/build-services/pricing`,
});

export const metadata: Metadata = {
  title: "Build Services Pricing",
  description:
    "Fixed-price tiers for custom application development. Paid discovery from $250, build tiers from $2,500 to $20,000+, hosting on your infrastructure, full handover documentation.",
  alternates: { canonical: "/build-services/pricing" },
  openGraph: {
    title: "Build Services Pricing · Dunamis Studios",
    description:
      "Fixed-price tiers for custom application development. Paid discovery from $250, build tiers from $2,500 to $20,000+, hosting on your infrastructure, full handover documentation.",
    url: "/build-services/pricing",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Build Services Pricing · Dunamis Studios",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Build Services Pricing · Dunamis Studios",
    description:
      "Fixed-price tiers for custom application development. Paid discovery from $250, build tiers from $2,500 to $20,000+, hosting on your infrastructure, full handover documentation.",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "Build Services Pricing · Dunamis Studios",
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

export default function BuildServicesPricingPage() {
  return (
    <>
      <JsonLd id="jsonld-build-pricing-webpage" schema={webPageSchema} />
      <JsonLd id="jsonld-build-pricing-faq" schema={faqPageSchema} />

      {/* ---- HERO ---- */}
      <div className="relative overflow-hidden">
        <HeroGradient />
        <Container size="xl" className="py-20 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-3xl text-center stagger">
            <Badge variant="build" className="mx-auto">
              Build Services Pricing
            </Badge>
            <h1 className="mt-6 font-[var(--font-display)] text-4xl font-medium tracking-[-0.03em] leading-[1.05] text-[var(--fg)] sm:text-5xl lg:text-6xl">
              Fixed-price tiers,
              <span className="relative inline-block px-1">
                <span className="relative z-10 italic text-[var(--color-build-600)] dark:text-[var(--color-build-400)]">
                  scoped after discovery
                </span>
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--fg-muted)]">
              Four build tiers from $2,500 to $20,000+. Every engagement starts
              with paid discovery and a written spec doc. The exact quote lands
              there, not before.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/build-services#contact">
                  <Mail className="h-4 w-4" />
                  Start a conversation
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="#tiers">
                  See tiers
                  <ArrowRight className="ml-0.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>

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

      {/* ---- FAQ ---- */}
      <MarketingFaq faq={FAQ} />

      {/* ---- CTA ---- */}
      <Section className="border-t border-[var(--border)]">
        <Container size="md">
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-8 py-14 text-center sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-60"
              style={{
                background:
                  "radial-gradient(ellipse at bottom, color-mix(in oklch, var(--color-build-500) 30%, transparent) 0%, transparent 60%)",
              }}
            />
            <h2 className="font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
              Ready to scope a build?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--fg-muted)] leading-relaxed">
              Tell us what you want built. We&apos;ll respond within two
              business days with whether it&apos;s a fit and a discovery quote
              if so.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/build-services#contact">
                  <Mail className="h-4 w-4" />
                  Start a conversation
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/build-services">
                  Back to overview
                </Link>
              </Button>
            </div>
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
