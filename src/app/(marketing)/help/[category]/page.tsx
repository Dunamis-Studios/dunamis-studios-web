import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { siteFreshness } from "@/lib/schema-freshness";
import {
  KB_PRODUCT_LABEL,
  estimateReadMinutes,
  getAllCategorySlugs,
  getArticlesInCategory,
  type KbArticle,
} from "@/lib/kb";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

/**
 * ISR. KB lives on disk in content/kb/{category}/{slug}.md so the
 * category list is fully known at build time. Revalidate keeps the
 * helpful-badge counts (Redis-backed) reasonably fresh on the article
 * cards.
 */
export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return slugs.map((category) => ({ category }));
}

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

function prettifyCategorySlug(slug: string): string {
  return slug.replace(/-/g, " ");
}

function titleCaseCategorySlug(slug: string): string {
  return prettifyCategorySlug(slug)
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const articles = await getArticlesInCategory(category);
  if (articles.length === 0) {
    return {
      title: "Category not found",
      robots: { index: false, follow: false },
    };
  }

  const title = titleCaseCategorySlug(category);
  const description =
    articles.length === 1
      ? `One article in ${title}. Help docs, guides, and how-tos from Dunamis Studios.`
      : `${articles.length} articles in ${title}. Help docs, guides, and how-tos from Dunamis Studios.`;

  return {
    title: `${title} · Help`,
    description,
    alternates: { canonical: `/help/${category}` },
    openGraph: {
      title: `${title} · Dunamis Studios help center`,
      description,
      url: `/help/${category}`,
      type: "website",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${title} · Dunamis Studios help center`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Dunamis Studios help center`,
      description,
      images: [
        {
          url: "/twitter-image",
          width: 1200,
          height: 630,
          alt: `${title} · Dunamis Studios help center`,
        },
      ],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const articles = await getArticlesInCategory(category);
  if (articles.length === 0) notFound();

  const title = titleCaseCategorySlug(category);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    ...siteFreshness(),
    name: `${title} · Dunamis Studios help center`,
    url: `${SITE_URL}/help/${category}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Dunamis Studios help center",
      url: `${SITE_URL}/help`,
    },
    hasPart: articles.map((a) => ({
      "@type": "Article",
      headline: a.frontmatter.title,
      description: a.frontmatter.description,
      url: `${SITE_URL}${a.href}`,
      datePublished: a.frontmatter.updated,
      dateModified: a.frontmatter.updated,
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Help",
        item: `${SITE_URL}/help`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title,
        item: `${SITE_URL}/help/${category}`,
      },
    ],
  };

  return (
    <>
      <JsonLd
        id={`jsonld-help-category-${category}`}
        schema={collectionSchema}
      />
      <JsonLd
        id={`jsonld-help-category-${category}-breadcrumb`}
        schema={breadcrumbSchema}
      />

      <Section className="pb-8 sm:pb-10">
        <Container size="lg">
          <Breadcrumbs
            items={[{ label: "Help", href: "/help" }, { label: title }]}
            className="mb-5"
          />
          <PageHeader
            title={title}
            description={
              articles.length === 1
                ? "One article in this category."
                : `${articles.length} articles in this category.`
            }
          />
        </Container>
      </Section>

      <Section className="!pt-0 !pb-16 sm:!pb-24">
        <Container size="lg">
          <ul className="grid gap-4 md:grid-cols-2">
            {articles.map((a) => (
              <li key={`${a.category}/${a.slug}`}>
                <ArticleCard article={a} />
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}

function ArticleCard({ article }: { article: KbArticle }) {
  const readMinutes = estimateReadMinutes(article.body);
  const tags = article.frontmatter.tags ?? [];
  return (
    <Link
      href={article.href}
      className="group flex h-full flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 transition-colors hover:border-[var(--border-strong)]"
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        <span>{KB_PRODUCT_LABEL[article.frontmatter.product]}</span>
        {article.frontmatter.access === "customers" ? (
          <>
            <span aria-hidden>·</span>
            <span className="text-[var(--color-brief-500)]">
              Customers only
            </span>
          </>
        ) : null}
      </div>
      <h3 className="font-[var(--font-display)] text-lg font-medium tracking-tight text-[var(--fg)]">
        {article.frontmatter.title}
      </h3>
      <p className="line-clamp-3 text-sm text-[var(--fg-muted)]">
        {article.frontmatter.description}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
        <span className="inline-flex items-center gap-1 text-xs text-[var(--fg-subtle)]">
          <Clock className="h-3 w-3" aria-hidden />
          {readMinutes} min read
        </span>
        {tags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="neutral" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        ) : null}
        <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-[var(--fg-muted)] group-hover:text-[var(--fg)]">
          Read
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
