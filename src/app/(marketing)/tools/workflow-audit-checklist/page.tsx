import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { WorkflowAuditChecklist } from "@/components/marketing/workflow-audit-checklist";
import { CourseCtaCard } from "@/components/marketing/course-cta-card";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { buildFaqPageSchema } from "@/components/marketing/article-extras";
import { siteFreshness } from "@/lib/schema-freshness";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What does the workflow audit score?",
    a: "Operations health across ten dimensions: ownership and review cadence, conflict signals (duplicate property writers, archived references, naming drift), audit cadence, recent incidents, error-rate visibility, naming and folder discipline, gating discipline (re-enrollment, exit conditions), the active-workflow count versus your tier cap, and the share of workflows that have not been touched in the past year. The total maps to a 0-to-100 score and one of four tiers: Healthy, Drift, Bloat, Crisis.",
  },
  {
    q: "How does cap utilization factor in?",
    a: "HubSpot publishes a per-tier cap on active workflows. The audit takes your active workflow count and your tier and reports utilization as a percentage. High utilization (above 80%) shifts your tier verdict toward Bloat or Crisis even when other dimensions look healthy, because being near the cap restricts your ability to ship new workflows without first archiving old ones.",
  },
  {
    q: "What do the priority actions look like?",
    a: "Three actions ranked by points lost. Each names the specific dimension (for example, 'Tighten ownership review cadence' or 'Resolve duplicate property writers'), explains why the dimension matters, and gives the next concrete step inside HubSpot to start fixing it. Priority actions are weighted to surface the highest-leverage fixes first, not just the lowest-scored questions.",
  },
  {
    q: "Is this for one workflow or the whole portal?",
    a: "Whole portal. The questions ask about your overall workflow operations rather than a single workflow's logic. If you want to dig into one specific workflow, the audit will not help. If you want to know whether your team's workflow practice as a whole is healthy or bloated, that is what this is for.",
  },
];

const faqPageSchema = buildFaqPageSchema(FAQ, {
  name: "HubSpot Workflow Audit Checklist FAQ",
  description:
    "Frequently asked questions about the Dunamis Studios HubSpot Workflow Audit Checklist: scoring dimensions, cap utilization, and priority actions.",
  url: `${SITE_URL}/tools/workflow-audit-checklist`,
});

const TITLE = "HubSpot Workflow Audit Checklist";
const DESCRIPTION =
  "Score your HubSpot workflow operations 0 to 100 and surface the highest-leverage fixes. Ten questions across ownership, conflict signals, audit cadence, and recent incidents. Output includes a Healthy / Drift / Bloat / Crisis tier, cap utilization vs the published HubSpot tier limit, and the top three prioritized actions ranked by points lost.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tools/workflow-audit-checklist" },
  openGraph: {
    title: `${TITLE} · Dunamis Studios`,
    description: DESCRIPTION,
    url: "/tools/workflow-audit-checklist",
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
    url: `${SITE_URL}/tools/workflow-audit-checklist`,
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

export default function WorkflowAuditChecklistPage() {
  return (
    <>
      <JsonLd id="jsonld-workflow-audit-checklist" schema={buildSchema()} />
      <JsonLd id="jsonld-workflow-audit-checklist-faq" schema={faqPageSchema} />
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
              How healthy are your HubSpot workflows?
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--fg-muted)]">
              Ten questions across ownership, conflict signals, audit
              cadence, and recent incidents. The audit returns a 0 to 100
              workflow health score, a Healthy / Drift / Bloat / Crisis tier,
              your active workflow utilization compared to HubSpot&apos;s
              published cap for your tier, and the top three priority actions
              ranked by points lost.
            </p>
          </div>

          <div className="mt-12">
            <WorkflowAuditChecklist />
          </div>

          <CourseCtaCard />
        </Container>
      </Section>

      <MarketingFaq faq={FAQ} />
    </>
  );
}
