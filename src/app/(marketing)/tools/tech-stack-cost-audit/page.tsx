import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { TechStackCostAudit } from "@/components/marketing/tech-stack-cost-audit";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { buildFaqPageSchema } from "@/components/marketing/article-extras";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What does the audit return?",
    a: "Total annual SaaS spend across the tools you list, spend per employee benchmarked against your revenue bracket, a license-waste estimate calculated at the Zylo industry rate of 46% non-utilization, overlap detection that flags multiple tools serving the same of 19 categories (CRM, marketing automation, analytics, dialer, sequencer, and so on), and a ranked list of consolidation opportunities sorted by potential dollars saved. A tool-count benchmark contrasts your stack against published Zylo, BetterCloud, and Cleed industry data.",
  },
  {
    q: "How granular do the inputs need to be?",
    a: "One row per SaaS tool. Each row asks for tool name, category, annual cost, and seat count if applicable. You do not need exact contract dates or per-seat pricing tiers; the audit operates on annualized totals. Add as many or as few tools as you want; rough is fine, the goal is the shape of the spend, not a procurement-grade reconciliation.",
  },
  {
    q: "Where does the 46% non-utilization rate come from?",
    a: "Zylo's published research on SaaS license utilization. The audit applies the rate uniformly to the seat-based portion of your spend to produce a license-waste estimate. The result page links to the Zylo source so you can see the methodology and adjust the rate down for tools you know are fully utilized.",
  },
  {
    q: "Do my inputs leave the browser?",
    a: "No. The audit runs entirely in your browser. Tool names, costs, and seat counts you enter are not posted to a server and are not stored anywhere outside the browser tab. Closing the tab clears the inputs.",
  },
];

const faqPageSchema = buildFaqPageSchema(FAQ);

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const TITLE = "Tech Stack Cost Audit";
const DESCRIPTION =
  "Audit your sales and marketing SaaS spend in a few minutes. List the tools your team pays for, get total annual spend, license waste estimate at the Zylo 46% non-utilization rate, overlap detection, the top consolidation opportunities ranked by potential savings, and a tool-count benchmark against Zylo, BetterCloud, and Cleed industry research.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tools/tech-stack-cost-audit" },
  openGraph: {
    title: `${TITLE} · Dunamis Studios`,
    description: DESCRIPTION,
    url: "/tools/tech-stack-cost-audit",
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
    url: `${SITE_URL}/tools/tech-stack-cost-audit`,
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

export default function TechStackCostAuditPage() {
  return (
    <>
      <JsonLd id="jsonld-tech-stack-cost-audit" schema={buildSchema()} />
      <JsonLd id="jsonld-tech-stack-cost-audit-faq" schema={faqPageSchema} />
      <Section>
        <Container size="md">
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
              How much SaaS spend is sitting in your stack?
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--fg-muted)]">
              Add the tools your sales, marketing, and ops teams pay for. The
              audit returns total annual spend, spend per employee versus the
              benchmark for your revenue bracket, a license waste estimate at
              the Zylo 46% non-utilization rate, overlap detection across 19
              categories, and the top consolidation opportunities ranked by
              potential savings.
            </p>
          </div>

          <div className="mt-12">
            <TechStackCostAudit />
          </div>
        </Container>
      </Section>

      <MarketingFaq faq={FAQ} />
    </>
  );
}
