import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PRODUCT_META, type Product } from "@/lib/types";
import { CREDIT_PACKS, CREDIT_COST_TABLE } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for Dunamis Studios apps. Per-portal monthly plans with credit-based usage and no annual lock-in.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing · Dunamis Studios",
    description:
      "Simple, transparent pricing for Dunamis Studios apps. Per-portal monthly plans with credit-based usage and no annual lock-in.",
    url: "/pricing",
    type: "website",
  },
};

type Tier = {
  name: "Starter" | "Pro" | "Enterprise";
  price: string;
  cadence?: string;
  description: string;
  highlighted?: boolean;
  features: string[];
};

const TIERS: Record<Product, Tier[]> = {
  "property-pulse": [
    {
      name: "Starter",
      price: "$49",
      cadence: "/ portal / month",
      description: "One pipeline, three rules, daily rollup.",
      features: [
        "1 pipeline",
        "Up to 3 health rules",
        "Daily rollup email",
        "7-day audit history",
        "Email support",
      ],
    },
    {
      name: "Pro",
      price: "$149",
      cadence: "/ portal / month",
      description: "Unlimited pipelines, staleness timers, team rollouts.",
      highlighted: true,
      features: [
        "Unlimited pipelines",
        "Unlimited health rules",
        "Staleness + drift timers",
        "Inline remediation",
        "90-day audit history",
        "Priority support",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "SSO, data residency, custom SLAs.",
      features: [
        "Everything in Pro",
        "SSO + SCIM",
        "Data residency",
        "Custom SLAs",
        "Dedicated engineer",
      ],
    },
  ],
  debrief: [
    {
      name: "Starter",
      price: "$19",
      cadence: "/ portal / month",
      description: "Standard objects, 30 days of history, the core handoff flow.",
      features: [
        "50 credits / month · 100 your first month",
        "Standard objects: contacts, companies, deals, tickets",
        "Brief me + atomic Handoff modes",
        "30-day Handoff Log and Brief Search",
        "Email support",
      ],
    },
    {
      name: "Pro",
      price: "$49",
      cadence: "/ portal / month",
      description: "Custom objects, deeper context, real team rollout.",
      highlighted: true,
      features: [
        "250 credits / month · 500 your first month",
        "Custom object briefs",
        "Engagement fan-out on standard associations",
        "Custom object associations (read-only)",
        "Primary record property override",
        "90-day Handoff Log and Brief Search",
        "Priority support",
      ],
    },
    {
      name: "Enterprise",
      price: "$149",
      cadence: "/ portal / month",
      description: "Full depth, full history, custom tuning.",
      features: [
        "1,000 credits / month · 2,000 your first month",
        "Engagement fan-out on custom object associations",
        "Full custom object associations",
        "365-day Handoff Log · unlimited Brief Search",
        "Custom prompt tuning",
        "Dedicated support",
      ],
    },
  ],
};

export default function PricingPage() {
  return (
    <>
      <Section>
        <Container size="xl">
          <PageHeader
            eyebrow="Pricing"
            title="Transparent tiers. No surprise line items."
            description="Each product is priced on its own. Upgrade and downgrade anytime. Billing integration is coming soon — for now, install from the HubSpot marketplace and pricing will apply on your next renewal."
          />
        </Container>
      </Section>

      <ProductPricing product="property-pulse" />
      <ProductPricing product="debrief" />
      <DebriefCreditAddons />

      <Section>
        <Container size="md" className="text-center">
          <h2 className="font-[var(--font-display)] text-3xl font-medium tracking-tight">
            Not sure which tier fits?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[var(--fg-muted)]">
            We&apos;re a one-person studio. Send me a note and I&apos;ll tell
            you which tier is right — even if the honest answer is Starter.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" variant="secondary">
              <a href="mailto:hello@dunamisstudios.net">
                hello@dunamisstudios.net
              </a>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}

function ProductPricing({ product }: { product: Product }) {
  const meta = PRODUCT_META[product];
  const tiers = TIERS[product];
  const accent = product === "property-pulse" ? "pulse" : "brief";
  return (
    <Section className="border-t border-[var(--border)]">
      <Container size="xl">
        <div className="mb-10 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <Badge variant={accent}>{meta.name}</Badge>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
              {meta.name} pricing
            </h2>
            <p className="mt-2 text-[var(--fg-muted)]">{meta.tagline}.</p>
          </div>
          <Button asChild variant="ghost">
            <Link href={`/products/${product}`}>
              Learn more about {meta.name}
              <ArrowRight className="ml-0.5 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-7 transition-shadow",
                tier.highlighted
                  ? "border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-md"
                  : "border-[var(--border)] bg-[var(--bg-elevated)]",
              )}
            >
              {tier.highlighted ? (
                <div className="absolute -top-3 left-7">
                  <Badge variant={accent}>Most popular</Badge>
                </div>
              ) : null}
              <h3 className="font-[var(--font-display)] text-xl font-medium tracking-tight">
                {tier.name}
              </h3>
              <p className="mt-2 text-sm text-[var(--fg-muted)]">{tier.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-[var(--font-display)] text-4xl font-medium tracking-tight">
                  {tier.price}
                </span>
                {tier.cadence ? (
                  <span className="text-sm text-[var(--fg-subtle)]">{tier.cadence}</span>
                ) : null}
              </div>
              <ul className="mt-7 space-y-2.5 border-t border-[var(--border)] pt-6">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={cn(
                        "h-4 w-4 mt-0.5 shrink-0",
                        accent === "pulse"
                          ? "text-[var(--color-pulse-500)]"
                          : "text-[var(--color-brief-500)]",
                      )}
                      aria-hidden
                    />
                    <span className="text-[var(--fg)]">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 pt-6 border-t border-[var(--border)]">
                <Button
                  asChild
                  className="w-full"
                  variant={tier.highlighted ? "primary" : "secondary"}
                >
                  <a href={meta.marketplaceUrl} target="_blank" rel="noreferrer">
                    Install from HubSpot
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function DebriefCreditAddons() {
  return (
    <Section className="border-t border-[var(--border)]">
      <Container size="xl">
        <div className="mb-10 max-w-2xl">
          <Badge variant="brief">Credit add-ons</Badge>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Credit add-ons
          </h2>
          <p className="mt-3 text-[var(--fg-muted)] leading-relaxed">
            Every handoff uses credits. Simple handoffs cost 1 credit. Larger
            handoffs with deeper history cost more, scaling with the amount of
            context the brief pulls in. Most portals stay well within their
            tier&apos;s monthly allotment. Credit packs are an optional top-up
            for high-volume months or team rollouts, never required, and they
            never expire.
          </p>
        </div>

        <div className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
              <tr className="text-xs uppercase tracking-wider text-[var(--fg-subtle)]">
                <th className="px-4 py-2.5 text-left font-medium">
                  Input tokens
                </th>
                <th className="px-4 py-2.5 text-left font-medium">
                  Credit cost
                </th>
              </tr>
            </thead>
            <tbody>
              {CREDIT_COST_TABLE.map((band, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <td className="px-4 py-2.5 font-mono text-[var(--fg)]">
                    {band.to === null
                      ? `${band.from.toLocaleString()}+`
                      : `${band.from.toLocaleString()} – ${band.to.toLocaleString()}`}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--fg)]">
                    {band.credits === "block" ? (
                      <>
                        <span className="font-mono">
                          +4 credits
                        </span>{" "}
                        <span className="text-[var(--fg-muted)]">
                          per additional {band.blockSize?.toLocaleString()}-token
                          block, no cap
                        </span>
                      </>
                    ) : (
                      <span className="font-mono">
                        {band.credits} credit{band.credits === 1 ? "" : "s"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.name}
              className="relative flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5"
            >
              {pack.discountPercent ? (
                <div className="absolute -top-2.5 left-5">
                  <Badge variant="brief">
                    {pack.discountPercent}% off
                  </Badge>
                </div>
              ) : null}
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                {pack.label}
              </div>
              <div className="mt-1 font-[var(--font-display)] text-2xl font-medium tracking-tight">
                ${pack.dollars}
              </div>
              <div className="mt-2 font-mono text-sm text-[var(--fg)]">
                {pack.credits.toLocaleString()} credits
              </div>
              <div className="mt-0.5 text-xs text-[var(--fg-muted)]">
                ${pack.effectiveRate.toFixed(
                  pack.effectiveRate < 0.2 ? 3 : 2,
                )}{" "}
                / credit
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
