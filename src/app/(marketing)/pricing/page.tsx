import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PRODUCT_META, type Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Transparent pricing for Property Pulse and Debrief. Starter, Pro, and Enterprise tiers — no hidden per-seat fees.",
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
      price: "$15",
      cadence: "/ portal / month",
      description: "Solo reps, auto-linked summaries.",
      features: [
        "25 meetings / portal / month",
        "Auto-linked summaries",
        "HubSpot task write-back",
        "Email support",
      ],
    },
    {
      name: "Pro",
      price: "$30",
      cadence: "/ portal / month",
      description: "Unlimited meetings, team-wide search.",
      highlighted: true,
      features: [
        "Unlimited meetings",
        "Team-wide transcript search",
        "Sentiment + signal detection",
        "Retroactive import (60d)",
        "Priority support",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Compliance, residency, dedicated support.",
      features: [
        "Everything in Pro",
        "Regional data residency",
        "Custom retention policies",
        "SSO + SCIM",
        "Dedicated engineer",
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
