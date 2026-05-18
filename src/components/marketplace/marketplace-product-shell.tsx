import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MarketplaceProduct } from "@/lib/marketplace";

interface MarketplaceProductShellProps {
  product: MarketplaceProduct;
}

/**
 * Marketplace product detail shell. Wrapped in `.lane-atelier` so the
 * accent tokens (--accent, --ring, --lane-glow) resolve to the atelier
 * (oxblood) palette inside this subtree. Buttons and focus rings pick
 * up the accent automatically, and the hero radial glow reads as
 * atelier-tinted without inline color literals.
 *
 * The "Buy now" button is rendered fully styled but is intentionally
 * NON-FUNCTIONAL. Stripe checkout wiring lands in a follow-up slice;
 * this shell is the foundation, not the purchase flow. Click does
 * nothing on purpose. When checkout lands, replace the bare <Button>
 * with a client component that POSTs to a checkout-session endpoint.
 */
export function MarketplaceProductShell({
  product,
}: MarketplaceProductShellProps) {
  return (
    <div className="lane-atelier">
      {/* HERO */}
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem]"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, color-mix(in oklch, var(--lane-glow) 28%, transparent) 0%, transparent 70%)",
          }}
        />
        <Container size="xl" className="py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="atelier">{product.platform}</Badge>
            <h1 className="mt-5 font-[var(--font-display)] text-5xl font-medium tracking-[-0.03em] leading-[1.05] text-[var(--fg)] sm:text-6xl">
              {product.name}
            </h1>
            <p className="mt-5 font-[var(--font-display)] text-2xl font-normal leading-snug text-[var(--fg-muted)] sm:text-3xl">
              {product.tagline}
            </p>
            <p className="mx-auto mt-7 max-w-xl text-[var(--fg-muted)]">
              {product.heroLede}
            </p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
                <span className="font-[var(--font-display)] text-3xl font-medium tracking-tight text-[var(--fg)]">
                  {product.priceLabel}
                </span>
                <span className="text-sm text-[var(--fg-subtle)]">
                  {product.licenseTerms}
                </span>
              </div>
              {/*
                Buy button: fully styled, intentionally NON-FUNCTIONAL.
                No onClick, no href, no form action. Stripe checkout
                wiring is deferred to a follow-up slice. Click does
                nothing on purpose. When checkout lands, lift this into
                a client component that POSTs to a checkout-session
                route handler.
              */}
              <Button size="lg" type="button">
                Buy now
                <ArrowRight className="ml-0.5 h-4 w-4" aria-hidden />
              </Button>
              <p className="text-xs text-[var(--fg-subtle)]">
                Checkout opens soon. Want to talk first? Email
                {" "}
                <a
                  href="mailto:support@dunamisstudios.net"
                  className="underline decoration-[var(--fg-subtle)] underline-offset-4 hover:text-[var(--fg)]"
                >
                  support@dunamisstudios.net
                </a>
                .
              </p>
            </div>
          </div>
        </Container>
      </div>

      {/* LONG-FORM SECTIONS */}
      <Section className="border-t border-[var(--border)]">
        <Container size="md">
          <div className="flex flex-col gap-16 sm:gap-20">
            {product.sections.map((s, i) => (
              <div key={i}>
                <div className="font-mono text-xs text-[var(--fg-subtle)]">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
                  {s.heading}
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-[var(--fg-muted)]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* SYNC ADD-ON (visually distinct, reads as optional) */}
      {product.syncAddon ? (
        <Section className="border-t border-[var(--border)] bg-[var(--bg-subtle)]">
          <Container size="md">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 sm:p-10">
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                Optional add-on
              </div>
              <h2 className="mt-3 font-[var(--font-display)] text-2xl font-medium tracking-tight sm:text-3xl">
                {product.syncAddon.heading}
              </h2>
              <p className="mt-5 leading-relaxed text-[var(--fg-muted)]">
                {product.syncAddon.body}
              </p>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* WHAT YOU GET */}
      <Section className="border-t border-[var(--border)]">
        <Container size="md">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            What you get
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            In the box
          </h2>
          <ul className="mt-8 space-y-3">
            {product.downloadBundle.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4"
              >
                <span
                  aria-hidden
                  className="mt-1.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-[var(--color-atelier-500)]"
                />
                <span className="text-[var(--fg)]">{item}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* SYSTEM REQUIREMENTS */}
      <Section className="border-t border-[var(--border)]">
        <Container size="md">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            System requirements
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            What it runs on
          </h2>
          <ul className="mt-8 space-y-3 text-[var(--fg-muted)] leading-relaxed">
            {product.systemRequirements.map((req, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-2 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--fg-subtle)]"
                />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* DOCS LINK (optional) */}
      {product.docsUrl ? (
        <Section className="border-t border-[var(--border)] bg-[var(--bg-subtle)]">
          <Container size="md" className="text-center">
            <p className="text-[var(--fg-muted)]">
              Want to read the docs before you buy?
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-5">
              <Link href={product.docsUrl}>
                Read the {product.name} docs
                <ArrowRight className="ml-0.5 h-4 w-4" />
              </Link>
            </Button>
          </Container>
        </Section>
      ) : null}

      {/* FINAL CTA */}
      <Section className="border-t border-[var(--border)]">
        <Container size="md" className="text-center">
          <h2 className="font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Ready when you are.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[var(--fg-muted)]">
            {product.priceLabel}. {product.licenseTerms}.
          </p>
          <div className="mt-8 flex items-center justify-center">
            {/*
              Same dead Buy button as the hero. Stripe checkout wiring
              is deferred. Click does nothing on purpose.
            */}
            <Button size="lg" type="button">
              Buy now
              <ArrowRight className="ml-0.5 h-4 w-4" aria-hidden />
            </Button>
          </div>
        </Container>
      </Section>
    </div>
  );
}
