import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PostComparisonTable, PostFaqItem } from "@/lib/content";
import { PRODUCT_META, type ProductCatalogSlug } from "@/lib/types";

/**
 * Shared section components for listicle-grade articles. Both the
 * public render route at /articles/[slug] and the admin preview route
 * at /admin/content/articles/[slug]/preview render these so the
 * preview is a faithful representation of what will ship to
 * production. Keep the JSX in lockstep across routes by importing
 * from this module rather than duplicating inline.
 */

/**
 * Comparison table rendered below the article body for listicle
 * articles. Desktop renders an N-column table styled by the kb-prose
 * table rules so it reads as native to the article. Mobile stacks to
 * one card per dimension, matching the comparison-card idiom used on
 * the product pages.
 */
export function ComparisonTableSection({
  table,
}: {
  table: PostComparisonTable;
}) {
  const [dimensionHeader, ...subjectHeaders] = table.headers;
  return (
    <section className="mt-12 sm:mt-16">
      <h2 className="text-2xl font-medium tracking-tight text-[var(--fg)] sm:text-[1.6rem]">
        How they compare
      </h2>
      {/* Desktop: kb-prose styled table */}
      <div className="kb-prose mt-6 hidden overflow-x-auto sm:block">
        <table>
          <thead>
            <tr>
              <th>{dimensionHeader}</th>
              {subjectHeaders.map((subject, i) => (
                <th key={i}>{subject}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                <th scope="row">{row.dimension}</th>
                {row.cells.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile: card-per-row stack */}
      <div className="mt-6 space-y-4 sm:hidden">
        {table.rows.map((row, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5"
          >
            <h3 className="text-base font-medium text-[var(--fg)]">
              {row.dimension}
            </h3>
            <dl className="mt-3 space-y-2">
              {subjectHeaders.map((header, j) => (
                <div key={j}>
                  <dt className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                    {header}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-[var(--fg-muted)]">
                    {row.cells[j] ?? ""}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * FAQ accordion rendered below the article body. Visual treatment
 * mirrors the product-page FAQ section so the in-article block reads
 * the same as the product surfaces on dunamisstudios.net. The same
 * faq array is the source for the FAQPage JSON-LD emitted in the head.
 */
export function FaqSection({ faq }: { faq: PostFaqItem[] }) {
  return (
    <section className="mt-12 sm:mt-16">
      <h2 className="text-2xl font-medium tracking-tight text-[var(--fg)] sm:text-[1.6rem]">
        Frequently asked questions
      </h2>
      <div className="mt-6 divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {faq.map((item, i) => (
          <details key={i} className="group py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left">
              <span className="text-lg font-medium text-[var(--fg)]">
                {item.q}
              </span>
              <span
                className="mt-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-xs text-[var(--fg-muted)] transition-transform group-open:rotate-45"
                aria-hidden
              >
                +
              </span>
            </summary>
            <p className="mt-3 pr-10 leading-relaxed text-[var(--fg-muted)]">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

/**
 * Related Products cards rendered below the article body. Looks up
 * each slug in PRODUCT_META so product name and tagline stay in
 * lockstep with the canonical product registry; adding a new product
 * to PRODUCT_META automatically makes it eligible to appear here.
 */
export function RelatedProductsSection({
  slugs,
}: {
  slugs: ProductCatalogSlug[];
}) {
  return (
    <section className="mt-12 sm:mt-16">
      <h2 className="text-2xl font-medium tracking-tight text-[var(--fg)] sm:text-[1.6rem]">
        Related products from Dunamis Studios
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {slugs.map((slug) => {
          const meta = PRODUCT_META[slug];
          return (
            <Link
              key={slug}
              href={`/products/${slug}`}
              className="group flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 transition-colors hover:border-[var(--border-strong)]"
            >
              <div className="min-w-0">
                <h3 className="text-base font-medium text-[var(--fg)]">
                  {meta.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--fg-muted)]">
                  {meta.tagline}
                </p>
              </div>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-[var(--fg-subtle)] transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Build the schema.org FAQPage object from a Post's faq array. The
 * caller is responsible for emitting it via the JsonLd helper. Kept
 * here so the public render route and the admin preview produce
 * byte-identical structured data.
 *
 * The options object carries the page-level identity fields that
 * schema.org recommends on every FAQPage: a name (typically the
 * page title or a descriptive FAQ-section name), a short description
 * of what the FAQ covers, and the canonical URL of the page hosting
 * it. These pin the FAQPage to a specific page so answer engines
 * cite the right source.
 */
export interface FaqPageSchemaOptions {
  name: string;
  description: string;
  url: string;
}

export function buildFaqPageSchema(
  faq: PostFaqItem[],
  options: FaqPageSchemaOptions,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: options.name,
    description: options.description,
    url: options.url,
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
