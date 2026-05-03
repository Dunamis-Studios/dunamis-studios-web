import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { SalesCycleStagnationCalculator } from "@/components/marketing/sales-cycle-stagnation-calculator";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { buildFaqPageSchema } from "@/components/marketing/article-extras";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What does the calculator quantify?",
    a: "Three numbers. Pipeline value at risk: total dollars in deals that have stopped moving past their expected stage duration. Critically at risk: the subset that has been stalled long enough to materially threaten close. Daily revenue bleed: implied revenue you are losing per stalled deal per day, based on deal size and expected close timing. The output also benchmarks your pipeline velocity against the published industry benchmark for your deal-size bracket.",
  },
  {
    q: "What inputs do I need?",
    a: "Nine: average deal size, win rate, average sales-cycle length, total open pipeline value, number of open deals, number of pipeline stages, average days per stage, percentage of deals that are stalled today, and average days stalled. The defaults are pre-populated based on commonly published B2B benchmarks so the calculator produces a usable estimate before you change anything.",
  },
  {
    q: "How is a deal considered stalled?",
    a: "The calculator treats a deal as stalled when its time-in-stage exceeds the expected stage duration you provide. The result page shows the cutoff applied to your inputs and the resulting at-risk and critically-at-risk thresholds, so you can see exactly which time-in-stage bands feed which output number.",
  },
  {
    q: "How does this map to HubSpot?",
    a: "Every input maps to a HubSpot deal-pipeline metric you can pull from the deal record or pipeline reports: deal amount, deal stage, time-in-stage, close date. Where your stage names differ from the inputs, just average across the matching stage. The calculator does not require a HubSpot connection or any data upload; it runs entirely in your browser.",
  },
];

const faqPageSchema = buildFaqPageSchema(FAQ);

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const TITLE = "Sales Cycle Stagnation Calculator";
const DESCRIPTION =
  "Quantify the dollar value of stalled pipeline. Nine inputs across deal economics, cycle structure, and stage stagnation. Calculates pipeline value at risk, critically at risk, daily revenue lost per stalled deal, and pipeline velocity vs the industry benchmark for your deal-size bracket.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tools/sales-cycle-stagnation-calculator" },
  openGraph: {
    title: `${TITLE} · Dunamis Studios`,
    description: DESCRIPTION,
    url: "/tools/sales-cycle-stagnation-calculator",
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

function buildSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/tools/sales-cycle-stagnation-calculator`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any (web browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
    },
  };
}

export default function SalesCycleStagnationCalculatorPage() {
  return (
    <>
      <JsonLd id="jsonld-sales-cycle-stagnation" schema={buildSchema()} />
      <JsonLd id="jsonld-sales-cycle-stagnation-faq" schema={faqPageSchema} />
      <Section>
        <Container size="lg">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All free tools
          </Link>

          <div className="mt-8 max-w-3xl">
            <Badge variant="accent">Free tool</Badge>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl font-medium tracking-[-0.02em] leading-[1.05] text-[var(--fg)] sm:text-5xl">
              How much money is sitting in your stalled pipeline?
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--fg-muted)]">
              Nine inputs across deal economics, cycle structure, and
              stage-level stagnation. The calculator returns the dollars at
              risk in deals that have stopped moving, the daily revenue you
              are bleeding per stalled deal, and a pipeline-velocity comparison
              against the published benchmark for your deal-size bracket.
            </p>
          </div>

          <div className="mt-12">
            <SalesCycleStagnationCalculator />
          </div>
        </Container>
      </Section>

      <MarketingFaq faq={FAQ} />
    </>
  );
}
