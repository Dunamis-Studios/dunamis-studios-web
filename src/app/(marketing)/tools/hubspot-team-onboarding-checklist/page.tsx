import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { TeamOnboardingChecklist } from "@/components/marketing/team-onboarding-checklist";
import { CourseCtaCard } from "@/components/marketing/course-cta-card";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { buildFaqPageSchema } from "@/components/marketing/article-extras";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What does the checklist score?",
    a: "Onboarding readiness for one specific new HubSpot team member, across eight phases: access (seat type, permissions, two-factor), HubSpot concepts (objects, lifecycle, automation primitives), role-specific properties (the fields the role actually has to know), tools (sequences, snippets, templates, dashboards), process (handoffs, deal hygiene, attribution), integrations the role touches, reporting they will own or run, and day-30 adoption (whether they are using HubSpot independently). Each phase contributes to a 0-to-100 score and a tier verdict: Ready, Mostly Ready, Gaps, Critical Gaps.",
  },
  {
    q: "Why does it ask for the role first?",
    a: "Phase 3 (role-specific properties) swaps based on role. An SDR needs to know lead source, lifecycle stage, and disposition reasons cold; an AE needs deal stage, deal type, and forecast category; Marketing Ops, CS, and RevOps Admin each have their own minimum-viable property set. Picking the role loads the right phase-3 questions; the other seven phases are the same regardless.",
  },
  {
    q: "What are role-specific risk flags?",
    a: "Items that historically corrupt HubSpot data when missed. For example, an SDR who does not know the lead-source canonical values usually creates fragmented attribution. An AE who does not know the deal-stage definitions usually skips stages, breaking velocity reporting. The risk flags surface only when the corresponding question is answered no, and they explain the specific data corruption pattern that question is gating against.",
  },
  {
    q: "Is the checklist reusable across multiple new hires?",
    a: "Yes, but rerun it per hire rather than treating it as a one-time score. The questions ask about a specific person's readiness, not the team's onboarding program in the abstract. The score for an SDR who started today is independent from the score for an AE who started last month. Use the checklist on each new hire near day 14 and again at day 30 to see whether the gaps closed.",
  },
];

const faqPageSchema = buildFaqPageSchema(FAQ);

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const TITLE = "HubSpot Team Member Onboarding Checklist";
const DESCRIPTION =
  "Score onboarding readiness for a new HubSpot team member 0 to 100 across eight phases (access, concepts, role-specific properties, tools, process, integrations, reporting, day-30 adoption). Pick a role (SDR, AE, Marketing Ops, CS, RevOps Admin) to load the role-specific property questions. Output includes a Ready / Mostly Ready / Gaps / Critical Gaps tier, a phase-by-phase breakdown, the top three priority actions, and any role-specific risk flags.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tools/hubspot-team-onboarding-checklist" },
  openGraph: {
    title: `${TITLE} · Dunamis Studios`,
    description: DESCRIPTION,
    url: "/tools/hubspot-team-onboarding-checklist",
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
    url: `${SITE_URL}/tools/hubspot-team-onboarding-checklist`,
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

export default function HubSpotTeamOnboardingChecklistPage() {
  return (
    <>
      <JsonLd id="jsonld-team-onboarding-checklist" schema={buildSchema()} />
      <JsonLd id="jsonld-team-onboarding-checklist-faq" schema={faqPageSchema} />
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
              Is the new rep set up to actually use HubSpot?
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--fg-muted)]">
              A role-aware checklist that scores onboarding readiness for a
              new HubSpot team member across eight phases. Pick the role
              first; the property-knowledge questions in phase 3 swap to
              match. Output is a 0 to 100 readiness score, a tier verdict,
              the top three priority actions, and role-specific risk flags
              when items that historically corrupt data are missing.
            </p>
          </div>

          <div className="mt-12">
            <TeamOnboardingChecklist />
          </div>

          <CourseCtaCard />
        </Container>
      </Section>

      <MarketingFaq faq={FAQ} />
    </>
  );
}
