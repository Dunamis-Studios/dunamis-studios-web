import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Clock, Compass, Sparkles } from "lucide-react";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LAST_UPDATED,
  shipped,
  inProgress,
  comingSoon,
  exploring,
} from "@/data/debrief-roadmap";

export const metadata: Metadata = {
  title: "Debrief roadmap",
  description:
    "What's shipped, what's in progress, and what's next for Debrief, Dunamis Studios' handoff intelligence app for HubSpot CRM.",
  alternates: { canonical: "/products/debrief/roadmap" },
  openGraph: {
    title: "Debrief roadmap · Dunamis Studios",
    description:
      "What's shipped, what's in progress, and what's next for Debrief.",
    url: "/products/debrief/roadmap",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Debrief roadmap · Dunamis Studios",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Debrief roadmap · Dunamis Studios",
    description:
      "What's shipped, what's in progress, and what's next for Debrief.",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "Debrief roadmap · Dunamis Studios",
      },
    ],
  },
};

function formatLastUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function DebriefRoadmapPage() {
  return (
    <>
      <Section className="pb-10 sm:pb-12">
        <Container size="lg">
          <Link
            href="/products/debrief"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to Debrief
          </Link>
          <PageHeader
            className="mt-6"
            eyebrow="Debrief roadmap"
            title="What we've shipped, and what's next."
            description="The honest state of Debrief. Updated by hand when things change, not a generated feed. If something's missing or wrong, email josh@dunamisstudios.net."
          />
          <p className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Last updated{" "}
            <span className="text-[var(--fg-muted)]">
              {formatLastUpdated(LAST_UPDATED)}
            </span>
          </p>
        </Container>
      </Section>

      <RoadmapSection
        title="Shipped"
        subtitle="Live in production today."
        icon={<Check className="h-4 w-4" aria-hidden />}
        accent="success"
      >
        {shipped.map((item) => (
          <RoadmapCard
            key={item.title}
            title={item.title}
            description={item.description}
            footer={item.shippedAt}
            accent="success"
          />
        ))}
      </RoadmapSection>

      <RoadmapSection
        title="In progress"
        subtitle="Being built or tested right now."
        icon={<Sparkles className="h-4 w-4" aria-hidden />}
        accent="warning"
      >
        {inProgress.map((item) => (
          <RoadmapCard
            key={item.title}
            title={item.title}
            description={item.description}
            footer={item.status}
            accent="warning"
          />
        ))}
      </RoadmapSection>

      <RoadmapSection
        title="Coming soon"
        subtitle="Committed, queued, not started yet."
        icon={<Clock className="h-4 w-4" aria-hidden />}
        accent="brief"
      >
        {comingSoon.map((item) => (
          <RoadmapCard
            key={item.title}
            title={item.title}
            description={item.description}
            footer={item.eta ?? null}
            accent="brief"
          />
        ))}
      </RoadmapSection>

      <RoadmapSection
        title="Exploring"
        subtitle="Under consideration. No commitments, no dates."
        icon={<Compass className="h-4 w-4" aria-hidden />}
        accent="muted"
      >
        {exploring.map((item) => (
          <RoadmapCard
            key={item.title}
            title={item.title}
            description={item.description}
            footer={null}
            accent="muted"
          />
        ))}
      </RoadmapSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

type Accent = "success" | "warning" | "brief" | "muted";

const ACCENT_DOT: Record<Accent, string> = {
  success: "bg-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]",
  brief: "bg-[var(--color-brief-500)]",
  muted: "bg-[var(--fg-subtle)]",
};

const ACCENT_BADGE: Record<
  Accent,
  "success" | "warning" | "brief" | "neutral"
> = {
  success: "success",
  warning: "warning",
  brief: "brief",
  muted: "neutral",
};

const ACCENT_LEFT_BORDER: Record<Accent, string> = {
  success: "before:bg-[var(--color-success)]",
  warning: "before:bg-[var(--color-warning)]",
  brief: "before:bg-[var(--color-brief-500)]",
  muted: "before:bg-[var(--border-strong)]",
};

function RoadmapSection({
  title,
  subtitle,
  icon,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: Accent;
  children: React.ReactNode;
}) {
  return (
    <Section className="!py-10 sm:!py-12 border-t border-[var(--border)]">
      <Container size="lg">
        <div className="mb-8 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full text-white",
                ACCENT_DOT[accent],
              )}
            >
              {icon}
            </span>
            <h2 className="font-[var(--font-display)] text-2xl font-medium tracking-tight">
              {title}
            </h2>
          </div>
          <p className="text-sm text-[var(--fg-muted)] ml-8">{subtitle}</p>
        </div>

        <ul className="grid gap-4 md:grid-cols-2">{children}</ul>
      </Container>
    </Section>
  );
}

function RoadmapCard({
  title,
  description,
  footer,
  accent,
}: {
  title: string;
  description: string;
  footer: string | null;
  accent: Accent;
}) {
  return (
    <li
      className={cn(
        "relative isolate overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 pl-6",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-1",
        ACCENT_LEFT_BORDER[accent],
      )}
    >
      <h3 className="font-[var(--font-display)] text-lg font-medium tracking-tight text-[var(--fg)]">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--fg-muted)]">
        {description}
      </p>
      {footer ? (
        <div className="mt-4">
          <Badge variant={ACCENT_BADGE[accent]}>{footer}</Badge>
        </div>
      ) : null}
    </li>
  );
}
