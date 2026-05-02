import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { TeamOnboardingChecklist } from "@/components/marketing/team-onboarding-checklist";
import { CourseCtaCard } from "@/components/marketing/course-cta-card";

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
    </>
  );
}
