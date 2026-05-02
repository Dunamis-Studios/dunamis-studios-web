import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { LeadScoringBuilder } from "@/components/marketing/lead-scoring-builder";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const TITLE = "Lead Scoring Builder";
const DESCRIPTION =
  "Build a starter HubSpot lead-scoring model in three minutes. Six inputs across buyer role, company size, sales cycle, high-intent actions, disqualifiers, and HubSpot tier. Output is a Fit/Engagement split, MQL threshold, point values, decay period, and A/B/C tier ranges, formatted for copy-paste into HubSpot's lead-scoring tool.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tools/lead-scoring-builder" },
  openGraph: {
    title: `${TITLE} · Dunamis Studios`,
    description: DESCRIPTION,
    url: "/tools/lead-scoring-builder",
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
    url: `${SITE_URL}/tools/lead-scoring-builder`,
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

export default function LeadScoringBuilderPage() {
  return (
    <>
      <JsonLd id="jsonld-lead-scoring-builder" schema={buildSchema()} />
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
              Build a HubSpot lead-scoring model in three minutes.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--fg-muted)]">
              Six questions about your ICP, sales cycle, and HubSpot tier. The
              output is a complete starter model: Fit and Engagement point
              values, an MQL threshold, decay timing, and A/B/C tier ranges,
              all formatted for copy-paste into HubSpot&apos;s lead-scoring
              tool. Tier-aware, so Pro portals stay inside the 100-point cap
              and Enterprise scales to 500.
            </p>
          </div>

          <div className="mt-12">
            <LeadScoringBuilder />
          </div>
        </Container>
      </Section>
    </>
  );
}
