import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { BloatScoreChecklist } from "@/components/marketing/bloat-score-checklist";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const TITLE = "HubSpot Bloat Score";
const DESCRIPTION =
  "Benchmark your HubSpot portal against verified per-tier limits and industry observations. Eight inputs, a 0 to 100 bloat score, per-asset breakdown across properties, workflows, lists, and density, plus the top three concentrations of bloat ranked by their contribution to your score.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tools/hubspot-bloat-score" },
  openGraph: {
    title: `${TITLE} · Dunamis Studios`,
    description: DESCRIPTION,
    url: "/tools/hubspot-bloat-score",
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
    url: `${SITE_URL}/tools/hubspot-bloat-score`,
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

export default function HubSpotBloatScorePage() {
  return (
    <>
      <JsonLd id="jsonld-hubspot-bloat-score" schema={buildSchema()} />
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
              How bloated is your HubSpot portal?
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--fg-muted)]">
              Eight inputs across custom properties, workflows, lists,
              contacts, portal age, and tier. The score benchmarks each
              category against published HubSpot per-tier limits and Vantage
              Point&apos;s research on property accumulation. Lower scores
              are leaner; higher scores flag bloat. The whole assessment
              takes about two minutes.
            </p>
          </div>

          <div className="mt-12">
            <BloatScoreChecklist />
          </div>
        </Container>
      </Section>
    </>
  );
}
