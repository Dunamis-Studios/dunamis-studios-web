import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ProductPageProps {
  accent: "pulse" | "brief";
  eyebrow: string;
  name: string;
  headline: string;
  lede: string;
  problem: { title: string; body: string };
  features: { title: string; body: string }[];
  faq: { q: string; a: string }[];
  marketplaceUrl: string;
}

const ACCENT_CLASSES: Record<
  ProductPageProps["accent"],
  { text: string; bg: string; glow: string; badge: "pulse" | "brief" }
> = {
  pulse: {
    text: "text-[var(--color-pulse-500)]",
    bg: "bg-[var(--color-pulse-500)]/12",
    glow: "color-mix(in oklch, var(--color-pulse-500) 30%, transparent)",
    badge: "pulse",
  },
  brief: {
    text: "text-[var(--color-brief-500)]",
    bg: "bg-[var(--color-brief-500)]/14",
    glow: "color-mix(in oklch, var(--color-brief-500) 30%, transparent)",
    badge: "brief",
  },
};

export function ProductPageShell(p: ProductPageProps) {
  const a = ACCENT_CLASSES[p.accent];
  return (
    <>
      {/* HERO */}
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem]"
          style={{
            background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${a.glow} 0%, transparent 70%)`,
          }}
        />
        <Container size="xl" className="py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant={a.badge}>{p.eyebrow}</Badge>
            <h1 className="mt-5 font-[var(--font-display)] text-5xl font-medium tracking-[-0.03em] leading-[1.05] text-[var(--fg)] sm:text-6xl">
              {p.name}
            </h1>
            <p className="mt-5 font-[var(--font-display)] text-2xl font-normal text-[var(--fg-muted)] sm:text-3xl leading-snug">
              {p.headline}
            </p>
            <p className="mx-auto mt-6 max-w-xl text-[var(--fg-muted)]">{p.lede}</p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <a href={p.marketplaceUrl} target="_blank" rel="noreferrer">
                  Install from HubSpot
                  <ArrowRight className="ml-0.5 h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>

          {/* Abstract visualization */}
          <div className="mx-auto mt-20 max-w-5xl">
            <ProductVisualization accent={p.accent} />
          </div>
        </Container>
      </div>

      {/* PROBLEM */}
      <Section className="border-t border-[var(--border)]">
        <Container size="md">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            The problem
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            {p.problem.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[var(--fg-muted)]">
            {p.problem.body}
          </p>
        </Container>
      </Section>

      {/* FEATURES */}
      <Section className="border-t border-[var(--border)]">
        <Container size="xl">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            What it does
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Every feature earns its weight.
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {p.features.map((f, i) => (
              <div
                key={i}
                className="group relative rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 transition-colors hover:border-[var(--border-strong)]"
              >
                <div
                  className={cn(
                    "mb-5 inline-flex h-9 w-9 items-center justify-center rounded-lg",
                    a.bg,
                    a.text,
                  )}
                  aria-hidden
                >
                  <span className="font-mono text-xs">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-[var(--font-display)] text-lg font-medium tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* PRICING TEASER */}
      <Section className="border-t border-[var(--border)]">
        <Container size="md">
          <div className="flex flex-col items-start gap-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                Pricing
              </div>
              <h3 className="mt-2 font-[var(--font-display)] text-2xl font-medium tracking-tight">
                Starter, Pro, Enterprise.
              </h3>
              <p className="mt-2 text-[var(--fg-muted)]">
                Transparent tiers. No hidden per-seat fees.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/pricing">
                See pricing
                <ArrowRight className="ml-0.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section className="border-t border-[var(--border)]">
        <Container size="md">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            FAQ
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Answers to the questions we actually get.
          </h2>
          <div className="mt-10 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {p.faq.map((item, i) => (
              <details key={i} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left">
                  <span className="font-[var(--font-display)] text-lg font-medium tracking-tight">
                    {item.q}
                  </span>
                  <span
                    className="mt-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-xs text-[var(--fg-muted)] transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-10 text-[var(--fg-muted)] leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      {/* FINAL CTA */}
      <Section className="border-t border-[var(--border)]">
        <Container size="md" className="text-center">
          <h2 className="font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Ready when you are.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[var(--fg-muted)]">
            Install from the HubSpot marketplace and manage {p.name} alongside
            every other Dunamis app in one dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <a href={p.marketplaceUrl} target="_blank" rel="noreferrer">
                Install from HubSpot
                <ArrowRight className="ml-0.5 h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/signup">Create a Dunamis account</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}

function ProductVisualization({ accent }: { accent: ProductPageProps["accent"] }) {
  const a = ACCENT_CLASSES[accent];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(ellipse at center, black 60%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 60%, transparent 100%)",
        }}
      />
      <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4"
          >
            <div className="flex items-center justify-between">
              <div className={cn("h-2 w-2 rounded-full", a.bg)} aria-hidden />
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-subtle)]">
                {["healthy", "stale", "at risk"][i]}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-2 w-3/4 rounded-full bg-[var(--bg-muted)]" />
              <div className="h-2 w-1/2 rounded-full bg-[var(--bg-muted)]" />
              <div className="h-2 w-2/3 rounded-full bg-[var(--bg-muted)]" />
            </div>
            <div className="mt-4 flex items-end gap-1">
              {Array.from({ length: 8 }).map((_, j) => (
                <div
                  key={j}
                  className={cn(
                    "w-full rounded-sm",
                    j === 7 ? a.bg : "bg-[var(--bg-muted)]",
                  )}
                  style={{ height: `${10 + ((j * 37) % 30)}px` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
