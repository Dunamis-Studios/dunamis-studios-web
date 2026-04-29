import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/primitives";
import { JsonLd } from "@/components/seo/json-ld";
import {
  ComparisonTableSection,
  FaqSection,
  RelatedProductsSection,
  buildFaqPageSchema,
} from "@/components/marketing/article-extras";
import { getPost } from "@/lib/content";
import { buildArticleJsonLd, getOgImageUrl, computeReadingTime } from "@/lib/post-seo";

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
    post.faq && post.faq.length > 0 ? buildFaqPageSchema(post.faq) : null;
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
