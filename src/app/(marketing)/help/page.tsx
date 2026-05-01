import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  Container,
  Section,
  PageHeader,
  Grid,
} from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import {
  KB_PRODUCTS,
  KB_PRODUCT_LABEL,
  getCategoriesForProduct,
  getPublishedArticles,
  getRecentArticles,
  type KbArticle,
  type KbCategory,
  type KbProduct,
} from "@/lib/kb";
import { SearchBox } from "./_components/SearchBox";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

export const metadata: Metadata = {
  title: "Help center",
  description:
    "Docs, guides, and how-tos for Debrief, Property Pulse, and the Dunamis Studios platform.",
  alternates: { canonical: "/help" },
  openGraph: {
    title: "Help center · Dunamis Studios",
    description:
      "Docs, guides, and how-tos for Debrief, Property Pulse, and the Dunamis Studios platform.",
    url: "/help",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Dunamis Studios help center",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Help center · Dunamis Studios",
    description:
      "Docs, guides, and how-tos for Debrief, Property Pulse, and the Dunamis Studios platform.",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "Dunamis Studios help center",
      },
    ],
  },
};

/**
 * WebSite schema with SearchAction potentialAction. The urlTemplate
 * is a schema.org URL-template format — `{search_term_string}` is the
 * placeholder Google replaces with the user's query. `query-input`
 * names the placeholder so Google knows which one to substitute.
 */
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Dunamis Studios help center",
  url: `${SITE_URL}/help`,
  description:
    "Docs, guides, and how-tos for Debrief, Property Pulse, and the Dunamis Studios platform.",
  publisher: {
    "@type": "Organization",
    name: "Dunamis Studios",
    url: SITE_URL,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/help/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

// Display order mirrors the marketing nav (Property Pulse, Debrief) and
// closes with Platform — the Dunamis-Studios-as-a-whole bucket for
// cross-app topics like billing, auth, and per-portal pricing.
const PRODUCT_ORDER: KbProduct[] = ["property-pulse", "debrief", "platform"];

export default async function HelpIndexPage() {
  const [allArticles, recent, productGroups] = await Promise.all([
    getPublishedArticles(),
    getRecentArticles(5),
    buildProductGroups(),
  ]);

  const isEmpty = allArticles.length === 0;

  return (
    <>
      <JsonLd id="jsonld-help-website" schema={websiteSchema} />

      <Section className="pb-8 sm:pb-10">
        <Container size="lg">
          <PageHeader
            eyebrow="Help"
            title="Dunamis Studios help center"
            description="Straight answers for Debrief, Property Pulse, and the platform underneath them. Written by the people who build the apps."
          />
          <div className="mt-8 max-w-2xl">
            <SearchBox />
          </div>
        </Container>
      </Section>

      {isEmpty ? (
        <Section className="!pt-0">
          <Container size="md">
            <EmptyState
              title="Nothing here yet."
              description="We're writing the first round of help articles now. Check back soon, or email support@dunamisstudios.net if you can't wait."
            />
          </Container>
        </Section>
      ) : (
        <>
          {PRODUCT_ORDER.map((product) => (
            <ProductSection
              key={product}
              product={product}
              categories={productGroups[product]}
            />
          ))}

          <RecentStrip articles={recent} />
        </>
      )}

      <Section className="!py-10 border-t border-[var(--border)]">
        <Container size="md" className="text-center">
          <p className="text-sm text-[var(--fg-muted)]">
            Can&apos;t find what you need? Email{" "}
            <a
              href="mailto:support@dunamisstudios.net"
              className="text-[var(--fg)] underline-offset-4 hover:underline"
            >
              support@dunamisstudios.net
            </a>
            . A human on our team answers.
          </p>
        </Container>
      </Section>
    </>
  );
}

async function buildProductGroups(): Promise<Record<KbProduct, KbCategory[]>> {
  const entries = await Promise.all(
    KB_PRODUCTS.map(
      async (p) => [p, await getCategoriesForProduct(p)] as const,
    ),
  );
  return Object.fromEntries(entries) as Record<KbProduct, KbCategory[]>;
}

function ProductSection({
  product,
  categories,
}: {
  product: KbProduct;
  categories: KbCategory[];
}) {
  return (
    <Section className="!py-12 border-t border-[var(--border)]">
      <Container size="lg">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="font-[var(--font-display)] text-2xl font-medium tracking-tight text-[var(--fg)]">
            {KB_PRODUCT_LABEL[product]}
          </h2>
          {categories.length > 0 ? (
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              {categories.length}{" "}
              {categories.length === 1 ? "category" : "categories"}
            </span>
          ) : null}
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-[var(--fg-muted)]">
            No articles yet. We&apos;re working on it.
          </p>
        ) : (
          <Grid cols={3} gap={4}>
            {categories.map((c) => (
              <CategoryCard key={`${product}/${c.slug}`} category={c} />
            ))}
          </Grid>
        )}
      </Container>
    </Section>
  );
}

function CategoryCard({ category }: { category: KbCategory }) {
  const top = category.articles.slice(0, 3);
  const total = category.articles.length;
  return (
    <Link
      href={`/help/${category.slug}`}
      className="group flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 transition-colors hover:border-[var(--border-strong)]"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-[var(--font-display)] text-lg font-medium tracking-tight capitalize text-[var(--fg)]">
          {prettifyCategorySlug(category.slug)}
        </h3>
        <Badge variant="neutral">{total}</Badge>
      </div>
      <ul className="space-y-1.5 text-sm text-[var(--fg-muted)]">
        {top.map((a) => (
          <li key={a.slug} className="truncate">
            <span className="group-hover:text-[var(--fg)]">
              {a.frontmatter.title}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-medium text-[var(--fg-muted)] group-hover:text-[var(--fg)]">
        {total > top.length ? `View all (${total})` : "Open category"}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </div>
    </Link>
  );
}

function RecentStrip({ articles }: { articles: KbArticle[] }) {
  if (articles.length === 0) return null;
  return (
    <Section className="!py-12 border-t border-[var(--border)] bg-[var(--bg-subtle)]">
      <Container size="lg">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles
            className="h-4 w-4 text-[var(--fg-muted)]"
            aria-hidden
          />
          <h2 className="font-[var(--font-display)] text-2xl font-medium tracking-tight text-[var(--fg)]">
            Recently updated
          </h2>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {articles.map((a) => (
            <li key={`${a.category}/${a.slug}`}>
              <Link
                href={a.href}
                className="flex h-full flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4 transition-colors hover:border-[var(--border-strong)]"
              >
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                  {KB_PRODUCT_LABEL[a.frontmatter.product]}
                </span>
                <span className="line-clamp-2 font-medium text-[var(--fg)]">
                  {a.frontmatter.title}
                </span>
                <span className="mt-auto text-xs text-[var(--fg-subtle)]">
                  Updated {a.frontmatter.updated}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

function prettifyCategorySlug(slug: string): string {
  return slug.replace(/-/g, " ");
}
