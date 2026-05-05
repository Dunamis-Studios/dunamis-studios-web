import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroGradient } from "@/components/marketing/hero-gradient";
import type { LaneKey } from "@/components/marketing/lane-subnav";

interface LanePlaceholderProps {
  lane: LaneKey;
  /** Short label for the lane (e.g. "Build Services"). */
  laneLabel: string;
  /** Area name (e.g. "Products", "Free Tools"). */
  area: string;
  /** Short headline describing what the area will hold. */
  headline: string;
  /** Paragraph beneath the headline. */
  body: string;
  /** Where the primary "back" CTA links — usually the lane landing. */
  backHref: string;
  /** Where the contact CTA links — usually `${lane-root}#contact` or `/contact`. */
  contactHref: string;
}

/**
 * Lightweight "Coming soon" placeholder for lane-scoped sections that
 * exist in the IA but don't have content yet. Takes its accent color
 * from the lane wrapper class (`.lane-build` / `.lane-hubspot`) on the
 * outer layout — which means dropping a placeholder into either lane
 * picks up the right wayfinding hue without per-page color decisions.
 */
export function LanePlaceholder({
  lane,
  laneLabel,
  area,
  headline,
  body,
  backHref,
  contactHref,
}: LanePlaceholderProps) {
  const badgeVariant = lane === "build" ? "build" : "hubspot";
  return (
    <>
      <div className="relative overflow-hidden">
        <HeroGradient />
        <Container size="xl" className="py-20 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-3xl text-center stagger">
            <Badge variant={badgeVariant} className="mx-auto">
              {laneLabel} · {area}
            </Badge>
            <h1 className="mt-6 font-[var(--font-display)] text-4xl font-medium tracking-[-0.03em] leading-[1.05] text-[var(--fg)] sm:text-5xl lg:text-6xl">
              {headline}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--fg-muted)]">
              {body}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href={contactHref}>
                  <Mail className="h-4 w-4" />
                  Start a conversation
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={backHref}>
                  Back to {laneLabel}
                  <ArrowRight className="ml-0.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Section className="border-t border-[var(--border)]">
        <Container size="md">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 sm:p-10">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              Status
            </div>
            <h2 className="mt-3 font-[var(--font-display)] text-2xl font-medium tracking-tight sm:text-3xl">
              In progress
            </h2>
            <p className="mt-4 text-[var(--fg-muted)] leading-relaxed">
              The {area.toLowerCase()} surface for {laneLabel} is on the
              roadmap. In the meantime, the engagement model and pricing for{" "}
              {laneLabel} are documented elsewhere in this section — and
              there&apos;s nothing stopping you from starting a conversation
              now if you have a project in mind.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
