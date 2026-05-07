import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ProductPageShell } from "@/components/marketing/product-page-shell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { siteFreshness } from "@/lib/schema-freshness";
import { cn } from "@/lib/utils";
import {
  ATELIER_TIERS,
  ATELIER_HERO,
  ATELIER_ANSWER_BLOCK,
  ATELIER_PROBLEM,
  ATELIER_FEATURES,
  ATELIER_COMPARISON,
  ATELIER_FAQ,
} from "@/lib/atelier-content";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const PAGE_PATH = "/build-services/products/atelier";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: "Build Services",
      item: `${SITE_URL}/build-services`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Products",
      item: `${SITE_URL}/build-services/products`,
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "Atelier",
      item: `${SITE_URL}${PAGE_PATH}`,
    },
  ],
};

const atelierSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  ...siteFreshness(),
  name: "Atelier",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "WeddingPlannerCRM",
  operatingSystem: "Windows 10, Windows 11",
  description:
    "Atelier is a perpetual-license Windows desktop app for professional wedding planners. CRM pipeline, eleven-tab per-wedding workspace, day-of run-of-show mode, vendors, guests, seating, budget, payments, contracts, and a localhost REST API — all running locally on your machine, no subscription, no cloud, no telemetry.",
  url: `${SITE_URL}${PAGE_PATH}`,
  publisher: {
    "@type": "Organization",
    name: "Dunamis Studios",
    url: SITE_URL,
  },
  offers: ATELIER_TIERS.map((t) => ({
    "@type": "Offer",
    name: t.label,
    price: String(t.priceUSD),
    priceCurrency: "USD",
    category: "OneTime",
    availability: "https://schema.org/InStock",
  })),
};

const faqPageSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  name: "Atelier FAQ",
  description:
    "Frequently asked questions about Atelier, the perpetual-license Windows desktop app for professional wedding planners from Dunamis Studios.",
  url: `${SITE_URL}${PAGE_PATH}`,
  mainEntity: ATELIER_FAQ.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: {
      "@type": "Answer",
      text: a,
    },
  })),
};

export const metadata: Metadata = {
  title: "Atelier: desktop wedding planner workspace, owned forever",
  description:
    "Atelier is a perpetual-license Windows desktop app for professional wedding planners. CRM, day-of mode, vendors, guests, seating, budget, payments, contracts. No subscription. No cloud. Yours.",
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: "Atelier: desktop wedding planner workspace, owned forever",
    description:
      "A perpetual-license Windows desktop app for professional wedding planners. No subscription, no cloud, no telemetry. From $149.",
    url: PAGE_PATH,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Atelier: desktop wedding planner workspace, owned forever",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Atelier: desktop wedding planner workspace, owned forever",
    description:
      "A perpetual-license Windows desktop app for professional wedding planners. No subscription, no cloud, no telemetry. From $149.",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "Atelier: desktop wedding planner workspace, owned forever",
      },
    ],
  },
};

export default function AtelierPage() {
  return (
    <div className="lane-atelier">
      {/*
        Three JSON-LD blocks: SoftwareApplication for entity + offers,
        FAQPage for AEO citations on each Q/A pair, BreadcrumbList for
        the four-deep nav crumb. Atelier sits two folders deep under
        Build Services so the breadcrumb has four positions, not three.
      */}
      <JsonLd id="jsonld-atelier" schema={atelierSchema} />
      <JsonLd id="jsonld-atelier-faq" schema={faqPageSchema} />
      <JsonLd id="jsonld-atelier-breadcrumb" schema={breadcrumbSchema} />

      <Container size="xl" className="pt-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Build Services", href: "/build-services" },
            { label: "Products", href: "/build-services/products" },
            { label: "Atelier" },
          ]}
        />
      </Container>

      <ProductPageShell
        accent="atelier"
        eyebrow={ATELIER_HERO.eyebrow}
        name={ATELIER_HERO.name}
        headline={ATELIER_HERO.headline}
        lede={ATELIER_HERO.lede}
        answerBlock={ATELIER_ANSWER_BLOCK}
        problem={ATELIER_PROBLEM}
        features={ATELIER_FEATURES}
        comparison={ATELIER_COMPARISON}
        faq={ATELIER_FAQ}
        pricingTeaser={{
          eyebrow: "Pricing",
          headline: "Three tiers. One purchase each.",
          body: "Self-Serve, Done For You, or Done For You + Customization. Pick the lift you want; the install is yours forever either way.",
          ctaLabel: "See the tiers",
        }}
        buyCta={{
          anchorId: "buy-atelier",
          pricingAnchorId: "pricing-atelier",
          label: "Get Atelier",
          finalLede:
            "Atelier ships today. Pick a tier below and we'll send the installer plus your perpetual license.",
        }}
      />

      {/* PRICING TIER CARDS */}
      <Section
        id="pricing-atelier"
        className="border-t border-[var(--border)] scroll-mt-24"
      >
        <Container size="xl">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Pricing
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            One-time purchase. Pick the lift you want.
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--fg-muted)] leading-relaxed">
            Every tier ships the same Atelier — every feature, every workspace
            tab, every export, the local REST API, the day-of mode. The
            difference is how much of the setup work we do with you.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {ATELIER_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-[var(--bg-elevated)] p-7",
                  tier.recommended
                    ? "border-[var(--color-atelier-500)] shadow-[0_0_0_1px_var(--color-atelier-500)]"
                    : "border-[var(--border)]",
                )}
              >
                {tier.recommended ? (
                  <div className="absolute -top-3 left-7">
                    <Badge variant="atelier">Recommended</Badge>
                  </div>
                ) : null}
                <div>
                  <h3 className="font-[var(--font-display)] text-2xl font-medium tracking-tight">
                    {tier.label}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
                    {tier.tagline}
                  </p>
                </div>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-[var(--font-display)] text-4xl font-medium tracking-tight">
                    {tier.priceDisplay}
                  </span>
                  <span className="text-sm text-[var(--fg-subtle)]">one-time</span>
                </div>
                <ul className="mt-7 flex-1 space-y-3">
                  {tier.includes.map((line, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-atelier-500)]"
                        aria-hidden
                      />
                      <span className="text-[var(--fg)] leading-relaxed">
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
                {tier.footnote ? (
                  <p className="mt-6 border-t border-[var(--border)] pt-4 text-xs leading-relaxed text-[var(--fg-subtle)]">
                    {tier.footnote}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-[var(--fg-muted)]">
            All tiers are one-time purchases. No subscription, no renewal,
            no per-seat adders. Future major versions are separate optional
            purchases at a discount, never forced upgrades.
          </p>
        </Container>
      </Section>

      {/* BUY FORM — replaced with the real form in the next commit */}
      <Section
        id="buy-atelier"
        className="border-t border-[var(--border)] scroll-mt-24"
      >
        <Container size="sm">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center sm:p-10">
            <h2 className="font-[var(--font-display)] text-2xl font-medium tracking-tight sm:text-3xl">
              Get Atelier
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[var(--fg-muted)]">
              Pick a tier above, drop your details below, and we&apos;ll
              send the installer plus your perpetual license within one
              business day.
            </p>
            <p className="mx-auto mt-7 max-w-md text-sm italic text-[var(--fg-subtle)]">
              Buy form lands in the next commit.
            </p>
          </div>
        </Container>
      </Section>
    </div>
  );
}
