import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ListChecks,
  Workflow,
  Hourglass,
  Target,
  UserPlus,
} from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { CourseSignupForm } from "@/components/marketing/course-signup-form";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { buildFaqPageSchema } from "@/components/marketing/article-extras";
import { siteFreshness } from "@/lib/schema-freshness";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

// Single source of truth for the course FAQ. Drives both the visible
// accordion and the FAQPage JSON-LD.
const FAQ: { q: string; a: string }[] = [
  {
    q: "What does the 5-Day HubSpot Audit cover?",
    a: "Day 1 covers properties (custom property count, fill rate, Used-in coverage, what to archive). Day 2 covers workflows (ownership, conflicts, audit cadence, active count vs your tier cap). Day 3 covers pipeline and deal stages (stalled-pipeline value, daily revenue bleed, velocity benchmark). Day 4 covers lead scoring and lifecycle stages (a starter scoring model and tier mapping). Day 5 covers team setup and onboarding (access, role-specific properties, day-30 adoption).",
  },
  {
    q: "How is the course delivered?",
    a: "One email per day for five days. Day 1 sends within a few minutes of signup. Each email is short, points at the relevant free tool on dunamisstudios.net/tools, and ends with one specific action to take. After Day 5, the course stops. We do not add you to a newsletter, do not share your email, and do not pitch you on Dunamis Studios products.",
  },
  {
    q: "How much time per day do I need?",
    a: "Plan for 30 to 60 minutes per day depending on portal size. Each day pairs an email with a free tool that takes 2 to 5 minutes to fill out. The remaining time is spent acting on the day's recommendation: archiving properties, tightening a workflow, mapping a pipeline stage, and so on. The course is designed to leave behind real changes, not just notes.",
  },
  {
    q: "Is the course actually free?",
    a: "Yes, free. No credit card, no upsell mid-course, no pitch at the end. We publish the course because the same audit is the first thing we run when we engage with a new HubSpot portal in our custom-development practice. Most teams can do it themselves with the right prompts, and that is what the course gives them.",
  },
];

const faqPageSchema = buildFaqPageSchema(FAQ, {
  name: "5-Day HubSpot Audit course FAQ",
  description:
    "Frequently asked questions about the free 5-Day HubSpot Audit email course from Dunamis Studios.",
  url: `${SITE_URL}/courses/hubspot-audit`,
});

const COURSE_SLUG = "hubspot-audit";
const COURSE_NAME = "5-Day HubSpot Audit";
const TITLE = "5-Day HubSpot Audit (Free Email Course)";
const DESCRIPTION =
  "Audit your HubSpot portal in five days. One email per day, each one covering a different dimension: properties, workflows, pipeline, scoring and lifecycle, and team setup. Free.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/courses/hubspot-audit" },
  openGraph: {
    title: `${TITLE} · Dunamis Studios`,
    description: DESCRIPTION,
    url: "/courses/hubspot-audit",
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
    "@type": "Course",
    ...siteFreshness(),
    name: COURSE_NAME,
    description: DESCRIPTION,
    url: `${SITE_URL}/courses/hubspot-audit`,
    provider: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Dunamis Studios",
    },
    educationalLevel: "Intermediate",
    inLanguage: "en",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      category: "Free",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: "PT5D",
      instructor: {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Dunamis Studios",
      },
    },
  };
}

interface ToolLink {
  href: string;
  label: string;
}

interface DayDef {
  day: number;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  tools: ToolLink[];
}

const DAYS: DayDef[] = [
  {
    day: 1,
    title: "Properties",
    description:
      "Look at what your portal carries. Custom property count, fill rate, and the Used-in coverage that tells you which fields actually matter. By the end of the day you have a list of properties to archive, merge, or delete.",
    Icon: ListChecks,
    tools: [
      {
        href: "/tools/property-audit-checklist",
        label: "Property Audit Checklist",
      },
      { href: "/tools/hubspot-bloat-score", label: "Bloat Score" },
    ],
  },
  {
    day: 2,
    title: "Workflows",
    description:
      "Score your workflow operations against ownership, conflicts, audit cadence, and recent incidents. Surface duplicate property writers, archived references, and the active count vs your tier cap.",
    Icon: Workflow,
    tools: [
      {
        href: "/tools/workflow-audit-checklist",
        label: "Workflow Audit Checklist",
      },
    ],
  },
  {
    day: 3,
    title: "Pipeline and deal stages",
    description:
      "Quantify the dollar value of stalled pipeline. Pipeline value at risk, daily revenue bleed per stalled deal, and pipeline velocity vs the published benchmark for your deal-size bracket.",
    Icon: Hourglass,
    tools: [
      {
        href: "/tools/sales-cycle-stagnation-calculator",
        label: "Sales Cycle Stagnation Calculator",
      },
    ],
  },
  {
    day: 4,
    title: "Lead scoring and lifecycle stages",
    description:
      "Build a starter lead-scoring model and check it against your lifecycle taxonomy. Outputs a build reference for HubSpot's lead-scoring tool plus the A1 to C3 tier mapping with band thresholds.",
    Icon: Target,
    tools: [
      { href: "/tools/lead-scoring-builder", label: "Lead Scoring Builder" },
    ],
  },
  {
    day: 5,
    title: "Team setup and onboarding",
    description:
      "Audit how new team members are set up in the portal. Access, concepts, role-specific property knowledge, tools, process discipline, integrations, reporting, and the day-30 adoption check.",
    Icon: UserPlus,
    tools: [
      {
        href: "/tools/hubspot-team-onboarding-checklist",
        label: "Team Member Onboarding Checklist",
      },
    ],
  },
];

export default function HubSpotAuditCoursePage() {
  return (
    <>
      <JsonLd id="jsonld-course-hubspot-audit" schema={buildSchema()} />
      <JsonLd id="jsonld-course-hubspot-audit-faq" schema={faqPageSchema} />
      <Section>
        <Container size="lg">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All courses
          </Link>

          <div className="mt-8 max-w-3xl">
            <Badge variant="accent">Free course</Badge>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl font-medium tracking-[-0.02em] leading-[1.05] text-[var(--fg)] sm:text-5xl">
              Audit your HubSpot portal in 5 days
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--fg-muted)]">
              One email per day. Each one covers a different dimension of
              your portal with a specific action to take. Free.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                  What you&apos;ll cover
                </div>
                <ol className="mt-5 flex flex-col gap-7">
                  {DAYS.map((d) => {
                    const { Icon } = d;
                    return (
                      <li key={d.day} className="flex gap-4">
                        <div
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--color-brand-500)_12%,transparent)] text-[var(--color-brand-400)]"
                          aria-hidden
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--fg-subtle)]">
                              Day {d.day}
                            </span>
                            <h3 className="font-[var(--font-display)] text-lg font-medium tracking-tight text-[var(--fg)]">
                              {d.title}
                            </h3>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
                            {d.description}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {d.tools.map((t) => (
                              <Link
                                key={t.href}
                                href={t.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1 text-xs text-[var(--fg-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--fg)]"
                              >
                                {t.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <Calendar
                    className="mt-0.5 h-5 w-5 shrink-0 text-[var(--fg-muted)]"
                    aria-hidden
                  />
                  <div>
                    <div className="text-sm font-medium text-[var(--fg)]">
                      How it&apos;s delivered
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--fg-muted)]">
                      One email per day for five days. Day 1 sends within a
                      few minutes of signup. Each email is short, points at
                      the relevant free tool, and ends with one specific
                      action. After Day 5, we stop. No newsletter, no
                      sharing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 lg:sticky lg:top-24 lg:h-fit">
              <CourseSignupForm
                courseSlug={COURSE_SLUG}
                courseName={COURSE_NAME}
              />
            </div>
          </div>
        </Container>
      </Section>

      <MarketingFaq faq={FAQ} />
    </>
  );
}
