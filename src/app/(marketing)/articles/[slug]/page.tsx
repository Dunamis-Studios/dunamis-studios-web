import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { JsonLd } from "@/components/seo/json-ld";
import { getPost } from "@/lib/content";
import type { PostComparisonTable, PostFaqItem } from "@/lib/content";
import { buildArticleJsonLd, getOgImageUrl, computeReadingTime } from "@/lib/post-seo";
import { PRODUCT_META } from "@/lib/types";
import type { Product } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost("article", slug);
  if (!post || post.status !== "published") return {};
  const ogImage = getOgImageUrl(post, "article");
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/articles/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `/articles/${slug}`,
      images: [{ url: ogImage }],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost("article", slug);
  if (!post || post.status !== "published") notFound();

  const articleSchema = buildArticleJsonLd(post, "article");
  const faqPageSchema =
    post.faq && post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }
      : null;
  const readingTime = computeReadingTime(post.contentHtml);

  return (
    <Section>
      <Container size="sm">
        {/*
          Two JSON-LD blocks may render here. The Article block always
          renders and carries entity and provenance signals (headline,
          publisher, dates). The FAQPage block renders only when
          post.faq is populated and exposes per-question answers for
          AEO extraction by ChatGPT, Perplexity, Claude, and Google AI
          Overviews. Both are emitted via the safe JsonLd helper so a
          stray closing-script tag inside structured data cannot escape
          the script element.
        */}
        <JsonLd id={`jsonld-article-${slug}`} schema={articleSchema} />
        {faqPageSchema ? (
          <JsonLd
            id={`jsonld-article-${slug}-faq`}
            schema={faqPageSchema}
          />
        ) : null}
        {post.coverImageUrl && (
          <Image
            src={post.coverImageUrl}
            alt=""
            width={800}
            height={450}
            className="mb-8 aspect-video w-full rounded-lg object-cover"
          />
        )}
        <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl font-medium tracking-tight text-[var(--fg)]">
          {post.title}
        </h1>
        <p className="mt-3 text-[var(--fg-muted)]">{post.description}</p>
        {post.publishedAt && (
          <div className="mt-2 flex items-center gap-3 text-sm text-[var(--fg-subtle)]">
            <time dateTime={new Date(post.publishedAt).toISOString()}>
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span aria-hidden>·</span>
            <span>{readingTime} min read</span>
          </div>
        )}
        <article
          className="kb-prose mt-10"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
        {post.comparisonTable && post.comparisonTable.rows.length > 0 ? (
          <ComparisonTableSection table={post.comparisonTable} />
        ) : null}
        {post.faq && post.faq.length > 0 ? (
          <FaqSection faq={post.faq} />
        ) : null}
        {post.relatedProducts && post.relatedProducts.length > 0 ? (
          <RelatedProductsSection slugs={post.relatedProducts} />
        ) : null}
      </Container>
    </Section>
  );
}

/**
 * Comparison table rendered below the article body for listicle
 * articles. Desktop renders an N-column table styled by the kb-prose
 * table rules so it reads as native to the article. Mobile stacks to
 * one card per dimension, matching the comparison-card idiom used on
 * the product pages.
 */
function ComparisonTableSection({ table }: { table: PostComparisonTable }) {
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
function FaqSection({ faq }: { faq: PostFaqItem[] }) {
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
function RelatedProductsSection({ slugs }: { slugs: Product[] }) {
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
