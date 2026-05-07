import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { ProductPageShell } from "@/components/marketing/product-page-shell";
import { AtelierBuyForm } from "@/components/marketing/atelier-buy-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container, Section } from "@/components/ui/primitives";
import { JsonLd } from "@/components/seo/json-ld";
import { siteFreshness } from "@/lib/schema-freshness";
import {
  ATELIER_PRICING,
  ATELIER_POST_PURCHASE_CALLOUT,
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
  offers: {
    "@type": "Offer",
    price: String(ATELIER_PRICING.priceUSD),
    priceCurrency: "USD",
    category: "OneTime",
    availability: "https://schema.org/InStock",
  },
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
      "A perpetual-license Windows desktop app for professional wedding planners. No subscription, no cloud, no telemetry. $149, paid once.",
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
      "A perpetual-license Windows desktop app for professional wedding planners. No subscription, no cloud, no telemetry. $149, paid once.",
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
          headline: "$149. One-time. Yours forever.",
          body: "One price, every feature unlocked, no subscription. Bug fixes free indefinitely while we operate the major version you bought.",
          ctaLabel: "See what's in the box",
        }}
        buyCta={{
          anchorId: "buy-atelier",
          pricingAnchorId: "pricing-atelier",
          label: "Get Atelier",
          finalLede:
            "Atelier ships today. $149, paid once, perpetual license. Drop your details below and we'll send the installer.",
        }}
      />

      {/* PRICING — single card */}
      <Section
        id="pricing-atelier"
        className="border-t border-[var(--border)] scroll-mt-24"
      >
        <Container size="md">
          <div className="text-center">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              Pricing
            </div>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
              One price. Every feature.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[var(--fg-muted)] leading-relaxed">
              Atelier is $149, paid once. The same install runs on as many of
              your own machines as you need. Bug fixes are free for as long as
              we operate the major version you bought — no time limit.
            </p>
          </div>

          <div className="mt-12">
            <div className="relative mx-auto max-w-xl rounded-2xl border border-[var(--color-atelier-500)] bg-[var(--bg-elevated)] p-8 shadow-[0_0_0_1px_var(--color-atelier-500)] sm:p-10">
              <div className="text-center">
                <h3 className="font-[var(--font-display)] text-2xl font-medium tracking-tight">
                  Atelier
                </h3>
                <div className="mt-4 flex items-baseline justify-center gap-2">
                  <span className="font-[var(--font-display)] text-5xl font-medium tracking-tight">
                    {ATELIER_PRICING.priceDisplay}
                  </span>
                  <span className="text-sm text-[var(--fg-subtle)]">
                    one-time
                  </span>
                </div>
              </div>
              <ul className="mt-8 space-y-3">
                {ATELIER_PRICING.includes.map((line, i) => (
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
              <p className="mt-8 border-t border-[var(--border)] pt-5 text-center text-xs leading-relaxed text-[var(--fg-subtle)]">
                {ATELIER_PRICING.footnote}
              </p>
            </div>
          </div>

          {/* Post-purchase customization callout */}
          <div className="mx-auto mt-8 max-w-xl rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-subtle)] p-5 sm:p-6">
            <p className="text-sm leading-relaxed text-[var(--fg-muted)]">
              {ATELIER_POST_PURCHASE_CALLOUT.body}
            </p>
            <Link
              href={ATELIER_POST_PURCHASE_CALLOUT.ctaHref}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-atelier-600)] hover:text-[var(--color-atelier-700)] dark:text-[var(--color-atelier-400)] dark:hover:text-[var(--color-atelier-300)]"
            >
              {ATELIER_POST_PURCHASE_CALLOUT.ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Container>
      </Section>

      {/* BUY FORM */}
      <Section
        id="buy-atelier"
        className="border-t border-[var(--border)] scroll-mt-24"
      >
        <Container size="md">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-7 sm:p-10">
            <div className="mx-auto max-w-2xl text-center">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                Get Atelier
              </div>
              <h2 className="mt-3 font-[var(--font-display)] text-2xl font-medium tracking-tight sm:text-3xl">
                Tell us where to send the installer.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[var(--fg-muted)]">
                We reach back out from josh@dunamisstudios.net within one
                business day with payment instructions and your perpetual
                license. Nothing is charged at submission.
              </p>
            </div>
            <div className="mx-auto mt-8 max-w-2xl">
              <AtelierBuyForm />
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
