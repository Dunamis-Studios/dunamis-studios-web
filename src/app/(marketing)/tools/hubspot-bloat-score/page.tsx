import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { BloatScoreChecklist } from "@/components/marketing/bloat-score-checklist";
import { CourseCtaCard } from "@/components/marketing/course-cta-card";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { buildFaqPageSchema } from "@/components/marketing/article-extras";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is bloat in a HubSpot portal?",
    a: "Bloat is the accumulation of custom properties, workflows, lists, and per-record assets beyond what the portal's actual operations need. It shows up as forgotten custom fields with low fill rates, duplicate or near-duplicate workflows, abandoned static lists, and asset-density patterns that grow faster than headcount or pipeline. Bloat slows admins, confuses users, and pushes portals toward their HubSpot tier limits.",
  },
  {
    q: "What does the score measure?",
    a: "Eight inputs feed a 0-to-100 score across four categories: custom-property volume (benchmarked against published HubSpot per-tier limits and Vantage Point research on property accumulation), active and total workflow counts (against your tier cap), active list counts, and per-contact asset density (workflow-touches per contact, list memberships per contact). The breakdown shows each category's contribution so you can see whether the bloat is concentrated in one area or spread across all four.",
  },
  {
    q: "What do I need to know about my portal to fill it out?",
    a: "Your HubSpot tier (Starter / Pro / Enterprise / Marketing+ flavors), portal age in years, total contact count, total custom-property count across all object types, total active and total workflow count, total active list count, and approximate workflow-touches per contact and list memberships per contact. All of these are surfaced inside HubSpot's Settings → Properties, Settings → Workflows, and Lists screens.",
  },
  {
    q: "Where do the per-tier limits come from?",
    a: "HubSpot's public product KB. The exact caps cited in the score (custom-property limits, active-workflow limits, list limits) are taken from the published per-tier limits documents and are updated as HubSpot changes them. Where industry benchmarks are used (for example, Vantage Point on property accumulation patterns), the source is named on the result.",
  },
];

const faqPageSchema = buildFaqPageSchema(FAQ);

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
      <JsonLd id="jsonld-hubspot-bloat-score-faq" schema={faqPageSchema} />
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

          <CourseCtaCard />
        </Container>
      </Section>

      <MarketingFaq faq={FAQ} />
    </>
  );
}
