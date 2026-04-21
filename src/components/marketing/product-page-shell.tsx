import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ProductScreenshot {
  src: string;
  alt: string;
  width: number;
  height: number;
  captionEyebrow: string;
  caption: string;
}

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
  // Optional screenshot gallery rendered between Problem and Features.
  // Currently only Property Pulse passes this; Debrief's output is
  // unchanged when omitted.
  screenshots?: {
    eyebrow: string;
    headline: string;
    items: ProductScreenshot[];
  };
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

      {/* SCREENSHOTS (optional) */}
      {p.screenshots && p.screenshots.items.length > 0 && (
        <Section className="border-t border-[var(--border)]">
          <Container size="xl">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              {p.screenshots.eyebrow}
            </div>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
              {p.screenshots.headline}
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
              {p.screenshots.items.map((shot, i) => (
                <figure key={i} className="flex flex-col gap-4">
                  <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 shadow-sm">
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      width={shot.width}
                      height={shot.height}
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="h-auto w-full rounded-xl"
                    />
                  </div>
                  <figcaption>
                    <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                      {shot.captionEyebrow}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--fg-muted)]">
                      {shot.caption}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Container>
        </Section>
      )}

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
      <div className="relative">
        {accent === "pulse" ? <PulseGraphic /> : <BriefGraphic />}
      </div>
    </div>
  );
}

function PulseGraphic() {
  const accentText = "text-[var(--color-pulse-500)]";
  const accentBg = "bg-[var(--color-pulse-500)]/14";

  const tiles: {
    recency: "TODAY" | "THIS WEEK" | "OLDER";
    delta: "up" | "down" | null;
    valueW: string;
  }[] = [
    { recency: "TODAY", delta: "up", valueW: "w-1/3" },
    { recency: "TODAY", delta: null, valueW: "w-1/2" },
    { recency: "THIS WEEK", delta: "down", valueW: "w-2/5" },
    { recency: "OLDER", delta: null, valueW: "w-1/4" },
  ];

  const logRows: { t: string; u: string; v: string; highlight: boolean }[] = [
    { t: "w-12", u: "w-16", v: "w-28", highlight: true },
    { t: "w-12", u: "w-14", v: "w-20", highlight: false },
    { t: "w-12", u: "w-20", v: "w-24", highlight: false },
  ];

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-5">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", accentBg)} aria-hidden />
          <div className="h-2 w-24 rounded-full bg-[var(--bg-muted)]" />
        </div>
        <div className="h-2 w-8 rounded-full bg-[var(--bg-muted)]" />
      </div>

      {/* Property tiles */}
      <div className="mt-4 space-y-2">
        {tiles.map((tile, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-1.5 w-2/5 rounded-full bg-[var(--bg-muted)]" />
              <div
                className={cn(
                  "h-2 rounded-full bg-[var(--bg-muted)]",
                  tile.valueW,
                )}
              />
            </div>
            {tile.delta === "up" ? (
              <ArrowUp
                className={cn("h-3.5 w-3.5 shrink-0", accentText)}
                aria-hidden
              />
            ) : tile.delta === "down" ? (
              <ArrowDown
                className="h-3.5 w-3.5 shrink-0 text-[var(--fg-subtle)]"
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest",
                tile.recency === "TODAY"
                  ? cn(accentBg, accentText)
                  : "bg-[var(--bg-muted)] text-[var(--fg-subtle)]",
              )}
            >
              {tile.recency}
            </span>
          </div>
        ))}
      </div>

      {/* Change log */}
      <div className="mt-5 border-t border-[var(--border)] pt-4">
        <div className="mb-3 h-1.5 w-20 rounded-full bg-[var(--bg-muted)]" />
        <div className="space-y-2">
          {logRows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[auto_1fr_2fr] items-center gap-3"
            >
              <div
                className={cn(
                  "h-1.5 rounded-full bg-[var(--bg-muted)]",
                  row.t,
                )}
              />
              <div
                className={cn(
                  "h-1.5 rounded-full bg-[var(--bg-muted)]",
                  row.u,
                )}
              />
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-1.5 rounded-full bg-[var(--bg-muted)]",
                    row.v,
                  )}
                />
                {row.highlight ? (
                  <div
                    className={cn("h-1.5 w-3 rounded-full", accentBg)}
                    aria-hidden
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BriefGraphic() {
  const accentText = "text-[var(--color-brief-500)]";
  const accentBg = "bg-[var(--color-brief-500)]/16";

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-4 sm:gap-6">
      {/* Left: outgoing owner + brief document */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-muted)]" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="h-1.5 w-3/4 rounded-full bg-[var(--bg-muted)]" />
            <div className="h-1.5 w-1/2 rounded-full bg-[var(--bg-muted)]" />
          </div>
        </div>
        <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
          <div className="border-b border-[var(--border)] pb-3">
            <div className="h-2 w-1/2 rounded-full bg-[var(--bg-muted)]" />
          </div>
          <div className="mt-3 space-y-3">
            {[0, 1, 2].map((sec) => (
              <div key={sec}>
                <div className="h-1.5 w-1/3 rounded-full bg-[var(--bg-muted)]" />
                <div className="mt-2 space-y-1.5 pl-3">
                  {[0, 1].map((b) => (
                    <div key={b} className="flex items-center gap-2">
                      <div className="h-1 w-1 shrink-0 rounded-full bg-[var(--fg-subtle)]" />
                      <div
                        className={cn(
                          "h-1.5 rounded-full bg-[var(--bg-muted)]",
                          b === 0 ? "w-full" : "w-3/4",
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connector */}
      <div className="flex items-center justify-center">
        <ArrowRight className={cn("h-6 w-6", accentText)} aria-hidden />
      </div>

      {/* Right: incoming owner + message draft */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-6 w-6 shrink-0 rounded-full border border-[var(--border)]",
              accentBg,
            )}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="h-1.5 w-3/4 rounded-full bg-[var(--bg-muted)]" />
            <div className="h-1.5 w-1/2 rounded-full bg-[var(--bg-muted)]" />
          </div>
        </div>
        <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
          <div className="space-y-2 border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-6 shrink-0 rounded-full bg-[var(--fg-subtle)]" />
              <div className="h-1.5 flex-1 rounded-full bg-[var(--bg-muted)]" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-10 shrink-0 rounded-full bg-[var(--fg-subtle)]" />
              <div className="h-1.5 flex-1 rounded-full bg-[var(--bg-muted)]" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {["w-full", "w-5/6", "w-full", "w-11/12", "w-4/5", "w-2/3"].map(
              (w, i) => (
                <div
                  key={i}
                  className={cn("h-1.5 rounded-full bg-[var(--bg-muted)]", w)}
                />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
