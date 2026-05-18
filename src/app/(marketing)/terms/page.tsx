/**
 * Master Terms of Sale at /terms. Renders termsMaster (the umbrella
 * agreement governing every product) and links to each product
 * addendum at /terms/[product]. The addendums supplement the master
 * with product-specific terms (Debrief subscription cycle, PP
 * one-time license, Atelier perpetual license).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { termsMaster } from "@/content/legal/terms-master";
import { TERMS_ADDENDUMS } from "@/content/legal/addendums";

export const metadata: Metadata = {
  title: "Terms of Sale",
  description:
    "Master Terms of Sale governing all products and services sold by Dunamis Studios. Product-specific addendums supplement these terms for individual products.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <Section>
      <Container size="md">
        <PageHeader
          eyebrow="Legal"
          title="Terms of Sale"
          description={`Last updated ${termsMaster.lastUpdated} · Version ${termsMaster.version}`}
        />

        <nav
          aria-label="Product-specific addendums"
          className="mt-8 rounded-lg border border-[var(--fg-subtle)]/30 bg-[color-mix(in_oklch,var(--fg)_3%,transparent)] px-4 py-4 text-sm"
        >
          <p className="font-medium">Product-specific addendums</p>
          <p className="mt-2 text-[var(--fg-muted)]">
            These Terms of Sale apply to every product and service Dunamis Studios sells.
            Each product also has an addendum that controls on topics unique to that
            product. Where an addendum addresses a topic, the addendum controls for the
            product it covers.
          </p>
          <ul className="mt-3 grid list-none gap-1 sm:grid-cols-2">
            {TERMS_ADDENDUMS.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={`/terms/${entry.slug}`}
                  className="text-[var(--fg-muted)] underline-offset-2 hover:underline"
                >
                  <span className="font-mono text-xs text-[var(--fg-subtle)]">
                    /terms/{entry.slug}
                  </span>{" "}
                  &mdash; {entry.doc.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav
          aria-label="On this page"
          className="mt-6 rounded-lg border border-[var(--fg-subtle)]/30 bg-[color-mix(in_oklch,var(--fg)_3%,transparent)] px-4 py-4 text-sm"
        >
          <p className="font-medium">On this page</p>
          <ol className="mt-3 grid list-none gap-1 sm:grid-cols-2">
            {termsMaster.sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-[var(--fg-muted)] underline-offset-2 hover:underline"
                >
                  <span className="font-mono text-xs text-[var(--fg-subtle)]">
                    §{s.n}
                  </span>{" "}
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12 space-y-12">
          {termsMaster.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-[var(--fg-subtle)]">§{s.n}</span>
                <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight">
                  {s.title}
                </h2>
              </div>
              <div className="mt-3 space-y-3 text-[var(--fg-muted)] leading-relaxed">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </Section>
  );
}
