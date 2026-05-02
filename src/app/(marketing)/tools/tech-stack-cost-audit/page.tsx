import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { TechStackCostAudit } from "@/components/marketing/tech-stack-cost-audit";

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
    </>
  );
}
