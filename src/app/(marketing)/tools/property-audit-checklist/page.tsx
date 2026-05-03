import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { PropertyAuditChecklist } from "@/components/marketing/property-audit-checklist";
import { CourseCtaCard } from "@/components/marketing/course-cta-card";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { buildFaqPageSchema } from "@/components/marketing/article-extras";
import { siteFreshness } from "@/lib/schema-freshness";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What does the score actually measure?",
    a: "Custom property hygiene across ten dimensions: documentation, ownership, naming conventions, approval process, audit cadence, fill rate awareness, archival discipline, integration writes, recent incidents, and used-in coverage. Each question is scored 0 to 10 and your total maps to a 0-to-100 hygiene score, then to one of four tiers: Clean, Drift, Bloat, Crisis.",
  },
  {
    q: "What do I get back when I finish?",
    a: "Three things. A tier verdict (Clean / Drift / Bloat / Crisis) anchored to your total score. A per-question score so you can see exactly which dimensions are weak. The top three priority actions, ranked against your weakest answers, with what to do and why each matters.",
  },
  {
    q: "How long does the assessment take?",
    a: "About three minutes if you know the portal well. The questions are written so you can answer most from memory. Two of the ten ask for an exact custom-property count and a rough fill-rate band, which take 30 seconds in HubSpot Settings to look up if you do not have the numbers handy.",
  },
  {
    q: "Is the assessment specific to a HubSpot tier?",
    a: "The assessment itself is tier-agnostic, but the priority actions reference the published HubSpot per-tier custom-property limits where relevant (for example, a Crisis-tier verdict on a Pro portal flags that you are within reach of the cap, while the same verdict on Enterprise points at archival discipline rather than the limit itself).",
  },
];

const faqPageSchema = buildFaqPageSchema(FAQ, {
  name: "HubSpot Property Audit Checklist FAQ",
  description:
    "Frequently asked questions about the Dunamis Studios HubSpot Property Audit Checklist scoring, methodology, and tier outputs.",
  url: `${SITE_URL}/tools/property-audit-checklist`,
});

const TITLE = "HubSpot Property Audit Checklist";
const DESCRIPTION =
  "Score your HubSpot portal's custom property hygiene against ten questions covering documentation, ownership, audit cadence, and past incidents. Get a tier label and three prioritized actions ranked by your weakest answers.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tools/property-audit-checklist" },
  openGraph: {
    title: `${TITLE} · Dunamis Studios`,
    description: DESCRIPTION,
    url: "/tools/property-audit-checklist",
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
    ...siteFreshness(),
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/tools/property-audit-checklist`,
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

export default function PropertyAuditChecklistPage() {
  return (
    <>
      <JsonLd id="jsonld-property-audit-checklist" schema={buildSchema()} />
      <JsonLd id="jsonld-property-audit-checklist-faq" schema={faqPageSchema} />
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
              How clean is your HubSpot custom property schema?
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--fg-muted)]">
              Ten questions across documentation, ownership, audit cadence,
              and past incidents. Each is scored 0 to 10. Your total score
              maps to a tier and three priority actions ranked against your
              weakest answers. The whole assessment takes about three minutes.
            </p>
          </div>

          <div className="mt-12">
            <PropertyAuditChecklist />
          </div>

          <CourseCtaCard />
        </Container>
      </Section>

      <MarketingFaq faq={FAQ} />
    </>
  );
}
