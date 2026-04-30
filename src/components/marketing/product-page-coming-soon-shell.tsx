import { Container, Section } from "@/components/ui/primitives";
import { ProductStageBadge } from "@/components/marketing/product-stage-badge";
import { NotifyForm } from "@/components/marketing/notify-form";
import type { ProductCatalogSlug, ProductStage } from "@/lib/types";

export interface ComingSoonShellProps {
  productSlug: ProductCatalogSlug;
  productName: string;
  stage: ProductStage;
  tagline: string;
  /** Hero lede sentence beneath the tagline. Optional. */
  lede?: string;
  problem: { title: string; body: string };
  whatWereBuilding: { title: string; body: string };
  whereWeAre: { title: string; body: string };
  /** Heading shown above the email capture form at the bottom. */
  notifyHeadline?: string;
  /** Sub-copy shown above the email capture form at the bottom. */
  notifyBody?: string;
}

/**
 * Lighter product-page shell for products in the building or exploring
 * stages. No install CTA, no pricing teaser, no comparison table. Three
 * narrative sections (problem, what we're building, where we are)
 * followed by an email capture form that POSTs to /api/notify.
 *
 * Mirrors the section/container conventions of ProductPageShell so the
 * two surfaces feel like the same page family even though their
 * content differs structurally.
 */
export function ProductPageComingSoonShell({
  productSlug,
  productName,
  stage,
  tagline,
  lede,
  problem,
  whatWereBuilding,
  whereWeAre,
  notifyHeadline,
  notifyBody,
}: ComingSoonShellProps) {
  return (
    <>
      {/* HERO */}
      <Section className="pb-10 sm:pb-14">
        <Container size="md">
          <div className="mx-auto max-w-3xl text-center">
            <ProductStageBadge stage={stage} />
            <h1 className="mt-5 font-[var(--font-display)] text-4xl font-medium tracking-[-0.02em] leading-[1.05] text-[var(--fg)] sm:text-5xl lg:text-6xl">
              {productName}
            </h1>
            <p className="mt-5 font-[var(--font-display)] text-2xl font-normal leading-snug text-[var(--fg-muted)] sm:text-3xl">
              {tagline}
            </p>
            {lede ? (
              <p className="mx-auto mt-6 max-w-xl text-[var(--fg-muted)]">
                {lede}
              </p>
            ) : null}
          </div>
        </Container>
      </Section>

      {/* PROBLEM */}
      <Section className="border-t border-[var(--border)] py-12 sm:py-16">
        <Container size="md">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            The problem
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            {problem.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[var(--fg-muted)]">
            {problem.body}
          </p>
        </Container>
      </Section>

      {/* WHAT WE'RE BUILDING */}
      <Section className="border-t border-[var(--border)] py-12 sm:py-16">
        <Container size="md">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            What we&apos;re building
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            {whatWereBuilding.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[var(--fg-muted)]">
            {whatWereBuilding.body}
          </p>
        </Container>
      </Section>

      {/* WHERE WE ARE */}
      <Section className="border-t border-[var(--border)] py-12 sm:py-16">
        <Container size="md">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Where we are
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            {whereWeAre.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[var(--fg-muted)]">
            {whereWeAre.body}
          </p>
        </Container>
      </Section>

      {/* NOTIFY */}
      <Section className="border-t border-[var(--border)] py-12 sm:py-16">
        <Container size="sm">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center sm:p-10">
            <h2 className="font-[var(--font-display)] text-2xl font-medium tracking-tight sm:text-3xl">
              {notifyHeadline ?? `Get notified when ${productName} ships.`}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[var(--fg-muted)]">
              {notifyBody ??
                "Drop your email and we'll send a single note when it goes live. No newsletter, no drip."}
            </p>
            <div className="mx-auto mt-7 max-w-md text-left">
              <NotifyForm product={productSlug} productName={productName} />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
