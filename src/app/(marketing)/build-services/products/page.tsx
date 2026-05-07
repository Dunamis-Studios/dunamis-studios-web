import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroGradient } from "@/components/marketing/hero-gradient";

export const metadata: Metadata = {
  title: "Build Services Products",
  description:
    "Prebuilt software from Dunamis Studios — owned-forever desktop apps with one-time pricing. Atelier is in active development; sign up to be notified at launch.",
  alternates: { canonical: "/build-services/products" },
  openGraph: {
    title: "Build Services Products · Dunamis Studios",
    description:
      "Prebuilt software from Dunamis Studios — owned-forever desktop apps with one-time pricing. Atelier is in active development; sign up to be notified at launch.",
    url: "/build-services/products",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Build Services Products · Dunamis Studios",
    description:
      "Prebuilt software from Dunamis Studios — owned-forever desktop apps with one-time pricing. Atelier is in active development; sign up to be notified at launch.",
  },
};

interface ProductCard {
  name: string;
  tagline: string;
  href: string;
  audience: string;
  startingPrice: string;
  badgeLabel: string;
  /** "success" reads as shipped/available; "warning" or "atelier" for
   * pre-launch so the badge doesn't lie about availability. */
  badgeVariant: "success" | "warning" | "atelier" | "neutral";
}

const PRODUCTS: ProductCard[] = [
  {
    name: "Atelier",
    tagline:
      "Desktop wedding planner workspace — CRM, day-of mode, vendors, guests, seating, budget, payments, contracts. Yours forever, one-time purchase.",
    href: "/build-services/products/atelier",
    audience: "Professional wedding planners",
    startingPrice: "$149 · one-time (at launch)",
    badgeLabel: "Coming soon",
    badgeVariant: "warning",
  },
];

export default function BuildServicesProductsPage() {
  return (
    <>
      <div className="relative overflow-hidden">
        <HeroGradient />
        <Container size="xl" className="py-20 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-3xl text-center stagger">
            <Badge variant="build" className="mx-auto">
              Build Services · Products
            </Badge>
            <h1 className="mt-6 font-[var(--font-display)] text-4xl font-medium tracking-[-0.03em] leading-[1.05] text-[var(--fg)] sm:text-5xl lg:text-6xl">
              Software you own, not software you rent.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--fg-muted)]">
              Prebuilt apps from the studio, sold as one-time purchases. You
              get the installer, the source, and a perpetual license. Runs on
              your hardware, your data stays on your machine, and no
              subscription clock ticks in the background.
            </p>
          </div>
        </Container>
      </div>

      <Section className="border-t border-[var(--border)]">
        <Container size="xl">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Catalog
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            What we&apos;re shipping.
          </h2>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {PRODUCTS.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="group relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-7 transition-colors hover:border-[var(--border-strong)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-[var(--font-display)] text-2xl font-medium tracking-tight">
                    {p.name}
                  </h3>
                  <Badge variant={p.badgeVariant}>{p.badgeLabel}</Badge>
                </div>
                <p className="mt-3 text-[var(--fg-muted)] leading-relaxed">
                  {p.tagline}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <span className="text-[var(--fg-subtle)]">
                    For: <span className="text-[var(--fg)]">{p.audience}</span>
                  </span>
                  <span className="text-[var(--fg-subtle)]">
                    <span className="text-[var(--fg)]">{p.startingPrice}</span>
                  </span>
                </div>
                <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)]">
                  See details
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}

            <div className="flex flex-col rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-subtle)] p-7">
              <h3 className="font-[var(--font-display)] text-2xl font-medium tracking-tight text-[var(--fg-muted)]">
                More on the way
              </h3>
              <p className="mt-3 text-[var(--fg-muted)] leading-relaxed">
                Atelier is the first product. The studio is building toward a
                small catalog of focused, owned-forever apps for specific
                professional workflows. If you have a workflow that deserves
                better than a SaaS subscription, tell us — that&apos;s often
                where the next product comes from.
              </p>
              <div className="mt-auto pt-6">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/build-services#contact">
                    <Mail className="h-4 w-4" />
                    Pitch a product
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
