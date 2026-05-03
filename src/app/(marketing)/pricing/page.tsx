import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PRODUCT_META, type Product } from "@/lib/types";
import { CREDIT_PACKS, CREDIT_COST_TABLE } from "@/lib/pricing";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { buildFaqPageSchema } from "@/components/marketing/article-extras";
import { JsonLd } from "@/components/seo/json-ld";
import { siteFreshness } from "@/lib/schema-freshness";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

// WebPage schema carries the page-level freshness signals
// (datePublished, dateModified) that schema.org and Google
// recommend for content recency. Without a typed schema block,
// crawlers fall back to HTTP Last-Modified, which Vercel does not
// always set predictably.
const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  ...siteFreshness(),
  name: "Pricing",
  description:
    "Per-portal pricing for Dunamis Studios apps: one-time install for Property Pulse, monthly tiers for Debrief, plus optional credit packs.",
  url: `${SITE_URL}/pricing`,
  isPartOf: {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
  },
  publisher: {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
  },
};

// Single source of truth for the pricing-page FAQ. Drives both the
// visible accordion and the FAQPage JSON-LD so answer engines can cite
// Q/A pairs verbatim.
const FAQ: { q: string; a: string }[] = [
  {
    q: "Why is Property Pulse one-time and Debrief monthly?",
    a: "Property Pulse runs entirely off configuration stored in your HubSpot portal and reads property history from HubSpot's API at card render time, so we have no ongoing per-portal infrastructure cost to recover. Debrief calls a large language model to generate each brief, and that has a real per-handoff cost, so it is priced as a per-portal monthly subscription with a credit allotment.",
  },
  {
    q: "How do Debrief credits work?",
    a: "Each Debrief tier (Starter, Pro, Enterprise) includes a monthly credit allotment that resets each billing cycle. Most handoffs cost 1 credit. Larger handoffs with deeper history cost more, scaling with the amount of context the brief pulls in. Credits expire at the end of the billing cycle. Optional credit packs can be purchased on top of the subscription, never expire, and stack into a separate addon bucket that is consumed only after the monthly allotment is used up.",
  },
  {
    q: "Do you offer annual pricing or discounts?",
    a: "No annual pricing today. Debrief is month-to-month and you can upgrade or downgrade tiers at any time from your account dashboard. The first month on every Debrief tier doubles the included monthly credit allotment so the initial rollout has more headroom. Property Pulse is one-time, so annual versus monthly does not apply.",
  },
  {
    q: "Is pricing per portal or per user?",
    a: "Per HubSpot portal. Property Pulse is $49 once for the whole portal and every user in the portal can use it. Debrief tiers are billed per portal per month and every user with HubSpot access in that portal can initiate handoffs from the Debrief CRM card. We do not charge per seat for either app.",
  },
];

const faqPageSchema = buildFaqPageSchema(FAQ, {
  name: "Dunamis Studios pricing FAQ",
  description:
    "Frequently asked questions about Dunamis Studios pricing: per-portal billing, Debrief credit structure, annual options, and one-time vs monthly products.",
  url: `${SITE_URL}/pricing`,
});

export const metadata: Metadata = {
  // Override the root template to a distinctive, length-tuned title
  // instead of the template-generated "Pricing · Dunamis Studios".
  title: { absolute: "Pricing · Dunamis Studios apps" },
  description:
    "Simple, transparent pricing for Dunamis Studios apps. Per-portal monthly plans with credit-based usage and no annual lock-in.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing · Dunamis Studios apps",
    description:
      "Simple, transparent pricing for Dunamis Studios apps. Per-portal monthly plans with credit-based usage and no annual lock-in.",
    url: "/pricing",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Pricing · Dunamis Studios apps",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing · Dunamis Studios apps",
    description:
      "Simple, transparent pricing for Dunamis Studios apps. Per-portal monthly plans with credit-based usage and no annual lock-in.",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "Pricing · Dunamis Studios apps",
      },
    ],
  },
};

type Tier = {
  name: string;
  price: string;
  cadence?: string;
  description: string;
  highlighted?: boolean;
  features: string[];
};

// Per-product overrides shown under the "<Name> pricing" h2.
// When absent, falls back to `${meta.tagline}.`.
const PRICING_SUBHEAD: Partial<Record<Product, string>> = {
  "property-pulse": "Simple. One price. Install once.",
};

// Per-product footnote shown below the pricing card(s).
const PRICING_FOOTNOTE: Partial<Record<Product, string>> = {
  "property-pulse":
    "Property Pulse is in open beta. Early installers get locked-in pricing and direct access to the team for feedback.",
};

const TIERS: Record<Product, Tier[]> = {
  "property-pulse": [
    {
      name: "Property Pulse",
      price: "$49",
      cadence: "one-time install fee",
      description: "Everything included. No tiers, no seats, no monthly bill.",
      highlighted: true,
      features: [
        "All CRM objects (contacts, companies, deals, tickets, custom)",
        "Admin-configured tracked properties per object",
        "Per-user property additions",
        "Filterable change log with CSV export",
        "Inline property editing",
        "Source attribution (users, workflows, imports, API, integrations)",
        "Merge-aware history",
        "Configuration stored in your own portal",
      ],
    },
  ],
  debrief: [
    {
      name: "Starter",
      price: "$19",
      cadence: "/ portal / month",
      description: "Standard objects, 30 days of history, the core handoff flow.",
      features: [
        "50 credits / month · 100 your first month",
        "Standard objects: contacts, companies, deals, tickets",
        "Draft Brief + atomic Handoff modes",
        "30-day Handoff Log and Brief Search",
        "Email support",
      ],
    },
    {
      name: "Pro",
      price: "$49",
      cadence: "/ portal / month",
      description: "Custom objects, deeper context, real team rollout.",
      highlighted: true,
      features: [
        "250 credits / month · 500 your first month",
        "Custom object briefs",
        "Engagement fan-out on standard associations",
        "Custom object associations (read-only)",
        "Primary record property override",
        "90-day Handoff Log and Brief Search",
        "Priority support",
      ],
    },
    {
      name: "Enterprise",
      price: "$149",
      cadence: "/ portal / month",
      description: "Full depth, full history, custom tuning.",
      features: [
        "1,000 credits / month · 2,000 your first month",
        "Engagement fan-out on custom object associations",
        "Full custom object associations",
        "365-day Handoff Log · unlimited Brief Search",
        "Custom prompt tuning",
        "Dedicated support",
      ],
    },
  ],
};

export default function PricingPage() {
  return (
    <>
      <JsonLd id="jsonld-pricing-webpage" schema={webPageSchema} />
      <JsonLd id="jsonld-pricing-faq" schema={faqPageSchema} />
      <Section>
        <Container size="xl">
          <PageHeader
            eyebrow="Pricing"
            title="Transparent tiers. No surprise line items."
            description="Each product is priced on its own. Install from the HubSpot marketplace, then pay from your account dashboard. One-time for Property Pulse, monthly for Debrief. Upgrade or downgrade Debrief tiers anytime."
          />
        </Container>
      </Section>

      <ProductPricing product="property-pulse" />
      <ProductPricing product="debrief" />
      <DebriefCreditAddons />

      <MarketingFaq faq={FAQ} />

      <Section>
        <Container size="md" className="text-center">
          <h2 className="font-[var(--font-display)] text-3xl font-medium tracking-tight">
            Not sure which tier fits?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[var(--fg-muted)]">
            We&apos;re a one-person studio. Send me a note and I&apos;ll tell
            you which tier is right, even if the honest answer is Starter.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" variant="secondary">
              <a href="mailto:hello@dunamisstudios.net">
                hello@dunamisstudios.net
              </a>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}

function ProductPricing({ product }: { product: Product }) {
  const meta = PRODUCT_META[product];
  const tiers = TIERS[product];
  const accent = product === "property-pulse" ? "pulse" : "brief";
  const subhead = PRICING_SUBHEAD[product] ?? `${meta.tagline}.`;
  const footnote = PRICING_FOOTNOTE[product];
  const isSingleTier = tiers.length === 1;
  return (
    <Section className="border-t border-[var(--border)]">
      <Container size="xl">
        <div className="mb-10 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <Badge variant={accent}>{meta.name}</Badge>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
              {meta.name} pricing
            </h2>
            <p className="mt-2 text-[var(--fg-muted)]">{subhead}</p>
          </div>
          <Button asChild variant="ghost">
            <Link href={`/products/${product}`}>
              Learn more about {meta.name}
              <ArrowRight className="ml-0.5 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div
          className={cn(
            "gap-6",
            isSingleTier
              ? "mx-auto max-w-md"
              : "grid md:grid-cols-3",
          )}
        >
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-7 transition-shadow",
                tier.highlighted
                  ? "border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-md"
                  : "border-[var(--border)] bg-[var(--bg-elevated)]",
              )}
            >
              {tier.highlighted ? (
                <div className="absolute -top-3 left-7">
                  <Badge variant={accent}>Most popular</Badge>
                </div>
              ) : null}
              <h3 className="font-[var(--font-display)] text-xl font-medium tracking-tight">
                {tier.name}
              </h3>
              <p className="mt-2 text-sm text-[var(--fg-muted)]">{tier.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-[var(--font-display)] text-4xl font-medium tracking-tight">
                  {tier.price}
                </span>
                {tier.cadence ? (
                  <span className="text-sm text-[var(--fg-subtle)]">{tier.cadence}</span>
                ) : null}
              </div>
              <ul className="mt-7 space-y-2.5 border-t border-[var(--border)] pt-6">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={cn(
                        "h-4 w-4 mt-0.5 shrink-0",
                        accent === "pulse"
                          ? "text-[var(--color-pulse-500)]"
                          : "text-[var(--color-brief-500)]",
                      )}
                      aria-hidden
                    />
                    <span className="text-[var(--fg)]">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 pt-6 border-t border-[var(--border)]">
                <Button
                  asChild
                  className="w-full"
                  variant={tier.highlighted ? "primary" : "secondary"}
                >
                  <a href={meta.marketplaceUrl} target="_blank" rel="noreferrer">
                    Install from HubSpot
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {footnote ? (
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-[var(--fg-muted)]">
            {footnote}
          </p>
        ) : null}
      </Container>
    </Section>
  );
}

function DebriefCreditAddons() {
  return (
    <Section className="border-t border-[var(--border)]">
      <Container size="xl">
        <div className="mb-10 max-w-2xl">
          <Badge variant="brief">Credit add-ons</Badge>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Credit add-ons
          </h2>
          <p className="mt-3 text-[var(--fg-muted)] leading-relaxed">
            Every handoff uses credits. Simple handoffs cost 1 credit. Larger
            handoffs with deeper history cost more, scaling with the amount of
            context the brief pulls in. Most portals stay well within their
            tier&apos;s monthly allotment. Credit packs are an optional top-up
            for high-volume months or team rollouts, never required, and they
            never expire.
          </p>
        </div>

        <div className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
              <tr className="text-xs uppercase tracking-wider text-[var(--fg-subtle)]">
                <th className="px-4 py-2.5 text-left font-medium">
                  Input tokens
                </th>
                <th className="px-4 py-2.5 text-left font-medium">
                  Credit cost
                </th>
              </tr>
            </thead>
            <tbody>
              {CREDIT_COST_TABLE.map((band, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <td className="px-4 py-2.5 font-mono text-[var(--fg)]">
                    {band.to === null
                      ? `${band.from.toLocaleString()}+`
                      : `${band.from.toLocaleString()} – ${band.to.toLocaleString()}`}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--fg)]">
                    {band.credits === "block" ? (
                      <>
                        <span className="font-mono">
                          +4 credits
                        </span>{" "}
                        <span className="text-[var(--fg-muted)]">
                          per additional {band.blockSize?.toLocaleString()}-token
                          block, no cap
                        </span>
                      </>
                    ) : (
                      <span className="font-mono">
                        {band.credits} credit{band.credits === 1 ? "" : "s"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.name}
              className="relative flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5"
            >
              {pack.discountPercent ? (
                <div className="absolute -top-2.5 left-5">
                  <Badge variant="brief">
                    {pack.discountPercent}% off
                  </Badge>
                </div>
              ) : null}
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                {pack.label}
              </div>
              <div className="mt-1 font-[var(--font-display)] text-2xl font-medium tracking-tight">
                ${pack.dollars}
              </div>
              <div className="mt-2 font-mono text-sm text-[var(--fg)]">
                {pack.credits.toLocaleString()} credits
              </div>
              <div className="mt-0.5 text-xs text-[var(--fg-muted)]">
                ${pack.effectiveRate.toFixed(
                  pack.effectiveRate < 0.2 ? 3 : 2,
                )}{" "}
                / credit
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
