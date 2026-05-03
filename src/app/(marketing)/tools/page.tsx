import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Calculator,
  Gauge,
  GitBranch,
  Hourglass,
  ListChecks,
  PiggyBank,
  Target,
  UserPlus,
  Workflow,
} from "lucide-react";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { buildFaqPageSchema } from "@/components/marketing/article-extras";

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
  },
  {
    href: "/tools/lead-scoring-builder",
    title: "Lead Scoring Builder",
    description:
      "Generate a starter HubSpot lead-scoring model from six ICP and funnel inputs. Outputs Fit/Engagement split, MQL threshold, point values, decay period, and A/B/C tier ranges as a build reference for HubSpot's lead-scoring tool.",
    Icon: Target,
  },
  {
    href: "/tools/sales-cycle-stagnation-calculator",
    title: "Sales Cycle Stagnation Calculator",
    description:
      "Quantify the dollar value of stalled pipeline. Nine inputs feed pipeline value at risk, daily revenue bleed per stalled deal, and pipeline velocity vs the published benchmark for your deal-size bracket.",
    Icon: Hourglass,
  },
  {
    href: "/tools/tech-stack-cost-audit",
    title: "Tech Stack Cost Audit",
    description:
      "List the SaaS tools your team pays for and get total annual spend, license waste at the Zylo 46% non-utilization rate, overlap detection across 19 categories, and the top consolidation opportunities ranked by potential savings.",
    Icon: PiggyBank,
  },
  {
    href: "/tools/workflow-audit-checklist",
    title: "HubSpot Workflow Audit Checklist",
    description:
      "Ten-question assessment that scores your HubSpot workflow operations 0 to 100, assigns a Healthy / Drift / Bloat / Crisis tier, compares your active workflow count to the published cap for your HubSpot tier, and ranks the top three priority actions.",
    Icon: Workflow,
  },
  {
    href: "/tools/custom-object-decision-tree",
    title: "HubSpot Custom Object Decision Tree",
    description:
      "Branching seven-question decision tree that recommends Custom Object, Custom Property, Repurposed Standard Object, HubDB, or Custom Event. Each recommendation comes with tradeoffs, examples, and tier eligibility from HubSpot's product KB.",
    Icon: GitBranch,
  },
  {
    href: "/tools/hubspot-team-onboarding-checklist",
    title: "HubSpot Team Member Onboarding Checklist",
    description:
      "Role-aware checklist scoring readiness for a new HubSpot team member across eight phases (access, concepts, role-specific properties, tools, process, integrations, reporting, day-30 adoption). Outputs a 0 to 100 readiness score, tier, top three actions, and role-specific risk flags.",
    Icon: UserPlus,
    badge: "New",
  },
];

// Single source of truth for the tools-index FAQ. Drives both the
// visible accordion and the FAQPage JSON-LD.
const FAQ: { q: string; a: string }[] = [
  {
    q: "Are the free tools actually free?",
    a: "Yes. Every tool on this page runs in your browser, returns a result on the page, and does not require a sign-up to use. We publish them because the same calculations show up over and over in our custom-development engagements and we would rather hand operators a working tool than rebuild it for each engagement.",
  },
  {
    q: "Does my data leave the browser?",
    a: "No. The calculators and assessments run entirely client-side. Inputs you type into a tool are not posted to a server, are not logged, and are not stored anywhere outside the browser tab. Closing the tab clears the inputs. The one exception is the optional emailed report on the Handoff Time Calculator, which only sends if you explicitly choose to email yourself a copy.",
  },
  {
    q: "Where do the benchmarks and scoring weights come from?",
    a: "Each tool cites its sources on the page itself. HubSpot per-tier limits come from the public HubSpot product KB. Industry benchmarks come from named sources (Vantage Point on property accumulation, Zylo and BetterCloud and Cleed on SaaS spend, plus published HubSpot research). Where a weight is our own judgment from custom-development engagements, we say so on the tool.",
  },
  {
    q: "Can I use these tools for client work?",
    a: "Yes. Solutions Partners and consultants run these against client portals all the time, and that is fine. The outputs are intended to be screenshot-friendly and copy-pasteable into a deliverable. If you want a co-branded variant or want the methodology explained in writing for a client deck, email hello@dunamisstudios.net.",
  },
];

const faqPageSchema = buildFaqPageSchema(FAQ);

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
      <JsonLd id="jsonld-tools-index-faq" schema={faqPageSchema} />
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
                  target="_blank"
                  rel="noopener noreferrer"
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

      <MarketingFaq faq={FAQ} />
    </>
  );
}
