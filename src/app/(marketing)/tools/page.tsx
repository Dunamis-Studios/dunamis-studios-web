import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Calculator, Gauge, ListChecks } from "lucide-react";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const TITLE = "Free Tools";
const DESCRIPTION =
  "Free calculators and assessments for HubSpot teams. Estimate the cost of handoffs, audits, and other operations work without leaving your browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tools" },
  openGraph: {
    title: `${TITLE} · Dunamis Studios`,
    description: DESCRIPTION,
    url: "/tools",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${TITLE} · Dunamis Studios`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} · Dunamis Studios`,
    description: DESCRIPTION,
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: `${TITLE} · Dunamis Studios`,
      },
    ],
  },
};

interface ToolEntry {
  href: string;
  title: string;
  description: string;
  badge?: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

const TOOLS: ToolEntry[] = [
  {
    href: "/tools/handoff-time-calculator",
    title: "Handoff Time Calculator",
    description:
      "Estimate the annual hours and dollar cost of routine sales handoffs and turnover-driven owner changes. Five inputs, four outputs, optional emailed report.",
    Icon: Calculator,
  },
  {
    href: "/tools/property-audit-checklist",
    title: "HubSpot Property Audit Checklist",
    description:
      "Ten-question assessment that scores your custom property hygiene 0 to 100, assigns a tier from Clean to Crisis, and ranks three priority actions against your weakest answers.",
    Icon: ListChecks,
  },
  {
    href: "/tools/hubspot-bloat-score",
    title: "HubSpot Bloat Score",
    description:
      "Benchmark your portal against published HubSpot tier limits and Vantage Point research. Score 0 to 100 across properties, workflows, lists, and asset density per contact, with per-category breakdown and the top three concentrations of bloat.",
    Icon: Gauge,
    badge: "New",
  },
];

function buildCollectionSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/tools`,
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
    },
    hasPart: TOOLS.map((t) => ({
      "@type": "WebApplication",
      name: t.title,
      description: t.description,
      url: `${SITE_URL}${t.href}`,
      applicationCategory: "BusinessApplication",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    })),
  };
}

export default function ToolsPage() {
  return (
    <>
      <JsonLd id="jsonld-tools-index" schema={buildCollectionSchema()} />
      <Section>
        <Container>
          <PageHeader
            eyebrow="Free Tools"
            title="Calculators and assessments"
            description={DESCRIPTION}
          />

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => {
              const { Icon } = tool;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 transition-colors hover:border-[var(--border-strong)]"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--color-brand-500)_15%,transparent)] text-[var(--color-brand-400)]"
                      aria-hidden
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    {tool.badge ? (
                      <Badge variant="accent">{tool.badge}</Badge>
                    ) : null}
                  </div>
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-[var(--font-display)] text-lg font-medium tracking-tight text-[var(--fg)]">
                        {tool.title}
                      </h2>
                      <ArrowUpRight
                        className="h-5 w-5 shrink-0 text-[var(--fg-subtle)] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--fg)]"
                        aria-hidden
                      />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </Section>
    </>
  );
}
