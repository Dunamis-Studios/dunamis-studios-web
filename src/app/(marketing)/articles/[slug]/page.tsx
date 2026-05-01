import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container, Section } from "@/components/ui/primitives";
import { JsonLd } from "@/components/seo/json-ld";
import {
  ComparisonTableSection,
  FaqSection,
  RelatedProductsSection,
  buildFaqPageSchema,
} from "@/components/marketing/article-extras";
import { getPost, listPosts } from "@/lib/content";
import { buildArticleJsonLd, getOgImageUrl, computeReadingTime } from "@/lib/post-seo";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

/**
 * ISR. Pre-render every published article slug at build, refresh the
 * cache every 60 s. New slugs published between deploys render
 * dynamically on first hit (default dynamicParams = true) and are
 * cached from then on.
 */
export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await listPosts("article", { includeDrafts: false });
  return posts.map((p) => ({ slug: p.slug }));
}

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
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [{ url: ogImage, alt: post.title }],
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
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Articles",
        item: `${SITE_URL}/articles`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${SITE_URL}/articles/${slug}`,
      },
    ],
  };
  const readingTime = computeReadingTime(post.contentHtml);

  return (
    <Section>
      <Container size="sm">
        {/*
          Three JSON-LD blocks may render here. The Article block
          always renders and carries entity and provenance signals
          (headline, publisher, dates). BreadcrumbList renders the
          Home > Articles > {title} hierarchy for sitelinks and AEO
          breadcrumb extraction. FAQPage renders only when post.faq
          is populated and exposes per-question answers for citation
          by ChatGPT, Perplexity, Claude, and Google AI Overviews.
          All emitted via the safe JsonLd helper so a stray closing-
          script tag inside structured data cannot escape.
        */}
        <JsonLd id={`jsonld-article-${slug}`} schema={articleSchema} />
        <JsonLd
          id={`jsonld-article-${slug}-breadcrumb`}
          schema={breadcrumbSchema}
        />
        {faqPageSchema ? (
          <JsonLd
            id={`jsonld-article-${slug}-faq`}
            schema={faqPageSchema}
          />
        ) : null}
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Articles", href: "/articles" },
            { label: post.title },
          ]}
          className="mb-5"
        />
        {post.coverImageUrl && (
          <Image
            src={post.coverImageUrl}
            alt={`Cover image for ${post.title}`}
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
