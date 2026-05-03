import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { HandoffTimeCalculator } from "@/components/marketing/handoff-time-calculator";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { buildFaqPageSchema } from "@/components/marketing/article-extras";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What does the calculator actually estimate?",
    a: "Two costs. First, the routine sales-to-CS or owner-change handoff that every closed deal triggers (time spent recapping context, drafting transition emails, syncing on next steps). Second, the cold reassignments that happen when a rep leaves and their book of accounts gets passed to whoever is next, which carries a different and usually higher per-account cost. The output is annual hours and annual dollars for each, plus a combined total.",
  },
  {
    q: "What inputs do I need?",
    a: "Five numbers: closed deals per year, average sales rep salary, percentage of deals that involve a handoff to CS or another owner, hours your team spends per handoff today, and your annual rep turnover percentage. Default values are pre-populated based on commonly published industry benchmarks so the calculator returns a usable estimate before you change anything.",
  },
  {
    q: "Can I email myself a copy of the result?",
    a: "Yes. There is an optional emailed report at the bottom of the calculator. If you choose to send it, the inputs and outputs are emailed to the address you provide. If you do not opt in, nothing leaves your browser. The calculation itself runs entirely client-side.",
  },
  {
    q: "How does this relate to Debrief?",
    a: "Debrief is our HubSpot marketplace app for handoff briefs and messages. It is built specifically to compress the per-handoff time the calculator measures. If your handoff hours are dominating the dollar number, Debrief is the product we would point at the problem. The calculator is useful on its own and does not require Debrief.",
  },
];

const faqPageSchema = buildFaqPageSchema(FAQ);

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const TITLE = "Handoff Time Calculator";
const DESCRIPTION =
  "How much is your sales handoff process actually costing you? Estimate the annual hours and dollars your team spends on routine handoffs and turnover-driven owner changes.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tools/handoff-time-calculator" },
  openGraph: {
    title: `${TITLE} · Dunamis Studios`,
    description: DESCRIPTION,
    url: "/tools/handoff-time-calculator",
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
    url: `${SITE_URL}/tools/handoff-time-calculator`,
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

export default function HandoffTimeCalculatorPage() {
  return (
    <>
      <JsonLd id="jsonld-handoff-calculator" schema={buildSchema()} />
      <JsonLd id="jsonld-handoff-calculator-faq" schema={faqPageSchema} />
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
              How much is your sales handoff process actually costing you?
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--fg-muted)]">
              The calculator estimates the annual hours and dollar cost of two
              kinds of handoffs: the routine sales-to-CS or owner-change pass
              that every closed deal triggers, and the cold reassignments that
              happen when a rep leaves and their book goes to someone new.
              Adjust the inputs to match your team and the numbers update live.
            </p>
          </div>

          <div className="mt-12">
            <HandoffTimeCalculator />
          </div>
        </Container>
      </Section>

      <MarketingFaq faq={FAQ} />
    </>
  );
}
