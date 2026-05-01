import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Mail,
  Minus,
} from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroGradient } from "@/components/marketing/hero-gradient";
import { CustomDevelopmentContactForm } from "@/components/marketing/custom-development-contact-form";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Custom Development",
  description:
    "HubSpot UI extensions, API integrations, data pipelines, AI workflows, and portal recovery from Dunamis Studios. For teams beyond marketplace apps.",
  alternates: { canonical: "/custom-development" },
  openGraph: {
    title: "Custom Development · Dunamis Studios",
    description:
      "HubSpot UI extensions, API integrations, data pipelines, AI workflows, and portal recovery from Dunamis Studios. For teams beyond marketplace apps.",
    url: "/custom-development",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Custom Development · Dunamis Studios",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom Development · Dunamis Studios",
    description:
      "HubSpot UI extensions, API integrations, data pipelines, AI workflows, and portal recovery from Dunamis Studios. For teams beyond marketplace apps.",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "Custom Development · Dunamis Studios",
      },
    ],
  },
};

const CAPABILITIES: { title: string; body: string }[] = [
  {
    title: "Custom HubSpot Apps and UI Extensions",
    body: "React-based UI extensions for CRM cards, App Home, and Settings surfaces. Built on the latest HubSpot Platform version.",
  },
  {
    title: "API Integrations and Bidirectional Syncs",
    body: "Connect HubSpot to the systems your business actually runs on. Real-time syncs, custom field mappings, and rate-limit-safe pipelines.",
  },
  {
    title: "Data Pipelines and Migration Tooling",
    body: "Multi-object deduplication, large-scale imports, and custom ETL work. We've built systems that handle 500K+ records.",
  },
  {
    title: "AI-Powered HubSpot Workflows",
    body: "Anthropic Claude integrations for structured data generation, conversational outputs, and intelligent automation inside HubSpot.",
  },
  {
    title: "Audits, Architecture, and Recovery",
    body: "Portal audits, data architecture reviews, and recovery from compromised or corrupted environments.",
  },
];

const FIT_FOR: string[] = [
  "Solutions Partners needing overflow technical capacity",
  "HubSpot customers who've outgrown admin-level configuration",
  "Teams building custom CRM workflows that require code",
  "Companies with complex data, integration, or AI needs in HubSpot",
];

const NOT_FIT_FOR: string[] = [
  "Basic portal setup or onboarding",
  "Email and landing page template work",
  "Marketing strategy or campaign execution",
  "Generic admin or no-code automation work",
];

type RecentWork = {
  kind: "engagement" | "product";
  name: string;
  tag: string;
  description: string;
  href?: string;
  accent?: "pulse" | "brief";
};

const RECENT_WORK: RecentWork[] = [
  {
    kind: "engagement",
    name: "Real Estate Investment CRM",
    tag: "Client Engagement",
    description:
      "Built a fully custom HubSpot CRM managing 450K+ contacts, 400K+ properties, and 500K+ phone records across a property-centric architecture. Includes a multi-object deduplication pipeline that consolidated 55K+ records and a bidirectional sync with CallTools handling 40+ mapped fields.",
  },
  {
    kind: "engagement",
    name: "Direct Mail Automation System",
    tag: "Client Engagement",
    description:
      "React UI extension with a mailer sequencing algorithm and Postalytics integration, supporting both one-time and drip campaign paths inside HubSpot.",
  },
  {
    kind: "engagement",
    name: "Portal Compromise Recovery",
    tag: "Client Engagement",
    description:
      "Led full recovery from a portal security incident involving corrupted contact-property associations across thousands of records. Rebuilt all affected workflows, re-imported source data from verified exports, and contributed artifacts to HubSpot's internal security review.",
  },
  {
    kind: "product",
    name: "Debrief",
    tag: "Dunamis Studios Product",
    description:
      "AI-powered handoff intelligence app that generates handoff briefs and conversational messages when CRM record ownership transfers.",
    href: "/products/debrief",
    accent: "brief",
  },
  {
    kind: "product",
    name: "Property Pulse",
    tag: "Dunamis Studios Product",
    description:
      "Property change history tracking on every record, with audit trail and source attribution.",
    href: "/products/property-pulse",
    accent: "pulse",
  },
];

const PROCESS_STEPS: { title: string; body: string }[] = [
  {
    title: "Reach out with a problem",
    body: "You reach out with a problem, not a spec. We figure out the spec together.",
  },
  {
    title: "Scope and quote",
    body: "We scope the work and quote a fixed price or hourly rate depending on what fits.",
  },
  {
    title: "Build, ship, iterate",
    body: "We build, ship, and iterate on real feedback. No mock data, no theoretical solutions.",
  },
  {
    title: "You own the result",
    body: "You own the result. Source code, documentation, and ongoing access.",
  },
];

export default function CustomDevelopmentPage() {
  return (
    <>
      {/* ---- HERO ---- */}
      <div className="relative overflow-hidden">
        <HeroGradient />
        <Container size="xl" className="py-24 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center stagger">
            <Badge variant="accent" className="mx-auto">
              Custom HubSpot Development
            </Badge>
            <h1 className="mt-6 font-[var(--font-display)] text-5xl font-medium tracking-[-0.03em] leading-[1.02] text-[var(--fg)] sm:text-6xl lg:text-7xl">
              Custom HubSpot
              <span className="relative inline-block px-1">
                <span className="relative z-10 italic text-[var(--accent)]">
                  Development
                </span>
              </span>
              .
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-[var(--fg-muted)]">
              Beyond the marketplace. We build custom HubSpot solutions for
              teams whose needs don&apos;t fit a one-size-fits-all app.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="#contact">
                  <Mail className="h-4 w-4" />
                  Start a conversation
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="#what-we-build">
                  See what we build
                  <ArrowRight className="ml-0.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* ---- INTRO ---- */}
      <Section className="border-t border-[var(--border)]">
        <Container size="md">
          <p className="text-lg leading-relaxed text-[var(--fg-muted)]">
            Dunamis Studios is a HubSpot product studio. We build and ship
            marketplace apps that solve common problems at scale, and we take on
            select custom development projects for clients who need something
            specific. If you&apos;ve outgrown what an admin can configure and
            need actual code, we can help.
          </p>
        </Container>
      </Section>

      {/* ---- WHAT WE BUILD ---- */}
      <Section id="what-we-build" className="border-t border-[var(--border)]">
        <Container size="xl">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Capabilities
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            What We Build
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((c, i) => (
              <div
                key={c.title}
                className="group relative rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 transition-colors hover:border-[var(--border-strong)]"
              >
                <div
                  className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--color-brand-500)_15%,transparent)] text-[var(--color-brand-400)]"
                  aria-hidden
                >
                  <span className="font-mono text-xs">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-[var(--font-display)] text-lg font-medium tracking-tight">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---- WHO WE WORK WITH ---- */}
      <Section className="border-t border-[var(--border)]">
        <Container size="xl">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Engagements
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Who We Work With
          </h2>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <FitColumn
              variant="fit"
              title="We're a Fit For"
              items={FIT_FOR}
            />
            <FitColumn
              variant="not-fit"
              title="We're Not a Fit For"
              items={NOT_FIT_FOR}
            />
          </div>
        </Container>
      </Section>

      {/* ---- RECENT WORK ---- */}
      <Section className="border-t border-[var(--border)]">
        <Container size="xl">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Selected projects
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Recent Work
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {RECENT_WORK.map((w) => (
              <RecentWorkCard key={w.name} work={w} />
            ))}
          </div>
        </Container>
      </Section>

      {/* ---- HOW IT WORKS ---- */}
      <Section className="border-t border-[var(--border)]">
        <Container size="xl">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Process
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            How It Works
          </h2>
          <div className="mt-12 grid gap-10 lg:grid-cols-4">
            {PROCESS_STEPS.map((step, i) => (
              <div key={step.title}>
                <div className="font-mono text-xs text-[var(--fg-subtle)]">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-3 font-[var(--font-display)] text-xl font-medium tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-[var(--fg-muted)] leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---- CTA ---- */}
      <Section id="contact" className="border-t border-[var(--border)]">
        <Container size="md">
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-8 py-16 text-center sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-60"
              style={{
                background:
                  "radial-gradient(ellipse at bottom, color-mix(in oklch, var(--color-brand-500) 30%, transparent) 0%, transparent 60%)",
              }}
            />
            <CustomDevelopmentContactForm />
          </div>
        </Container>
      </Section>
    </>
  );
}

function FitColumn({
  variant,
  title,
  items,
}: {
  variant: "fit" | "not-fit";
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-7">
      <h3 className="font-[var(--font-display)] text-xl font-medium tracking-tight">
        {title}
      </h3>
      <ul className="mt-6 space-y-3 border-t border-[var(--border)] pt-5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm">
            {variant === "fit" ? (
              <Check
                className="h-4 w-4 mt-0.5 shrink-0 text-[var(--color-pulse-500)]"
                aria-hidden
              />
            ) : (
              <Minus
                className="h-4 w-4 mt-0.5 shrink-0 text-[var(--fg-subtle)]"
                aria-hidden
              />
            )}
            <span className="text-[var(--fg)]">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ACCENT_TAG: Record<NonNullable<RecentWork["accent"]>, "pulse" | "brief"> = {
  pulse: "pulse",
  brief: "brief",
};

function RecentWorkCard({ work }: { work: RecentWork }) {
  const isLink = work.kind === "product" && !!work.href;
  const shellClass = cn(
    "group relative isolate flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-7 transition-all duration-300",
    isLink && "hover:shadow-md hover:border-[var(--border-strong)]",
  );

  const inner = (
    <>
      <div className="flex items-center justify-between gap-4">
        {work.kind === "product" && work.accent ? (
          <Badge variant={ACCENT_TAG[work.accent]}>{work.tag}</Badge>
        ) : (
          <Badge variant="neutral">{work.tag}</Badge>
        )}
        {isLink ? (
          <ArrowUpRight
            className="h-5 w-5 text-[var(--fg-subtle)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--fg)]"
            aria-hidden
          />
        ) : null}
      </div>
      <h3 className="mt-6 font-[var(--font-display)] text-2xl font-medium tracking-tight text-[var(--fg)]">
        {work.name}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">
        {work.description}
      </p>
    </>
  );

  if (isLink && work.href) {
    return (
      <Link href={work.href} className={shellClass}>
        {inner}
      </Link>
    );
  }
  return <div className={shellClass}>{inner}</div>;
}
