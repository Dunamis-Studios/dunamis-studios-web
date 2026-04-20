import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock, Lock, ThumbsUp } from "lucide-react";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import {
  KB_PRODUCT_LABEL,
  estimateReadMinutes,
  getArticleBySlug,
  getPublishedArticles,
  type KbArticle,
  type KbProduct,
} from "@/lib/kb";
import { renderMarkdown, takeFirstWords } from "@/lib/kb-render";
import { getHelpfulBadge } from "@/lib/kb-rating";
import { getCurrentSession } from "@/lib/session";
import { getEntitlementsForAccount } from "@/lib/accounts";
import type { Entitlement } from "@/lib/types";
import { ArticleRating } from "../../_components/ArticleRating";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const TEASER_WORDS = 100;

interface ArticlePageProps {
  params: Promise<{ category: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const article = await getArticleBySlug(category, slug);
  if (!article) {
    return {
      title: "Article not found",
      robots: { index: false, follow: false },
    };
  }
  const { frontmatter } = article;
  const isCustomerOnly = frontmatter.access === "customers";

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    alternates: { canonical: article.href },
    openGraph: {
      title: `${frontmatter.title} — Dunamis Studios help center`,
      description: frontmatter.description,
      url: article.href,
      type: "article",
      publishedTime: frontmatter.updated,
      modifiedTime: frontmatter.updated,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: frontmatter.title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${frontmatter.title} — Dunamis Studios help center`,
      description: frontmatter.description,
      images: [
        {
          url: "/twitter-image",
          width: 1200,
          height: 630,
          alt: frontmatter.title,
        },
      ],
    },
    // Customer-only articles live behind a redirect-to-login for
    // unauthenticated requests, which blocks crawler indexing of the
    // body anyway. Mark them noindex so we don't accumulate soft-404
    // signals from bots that repeatedly get redirected.
    robots: isCustomerOnly
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function ArticlePage({
  params,
  searchParams,
}: ArticlePageProps) {
  const { category, slug } = await params;
  const sp = await searchParams;
  const article = await getArticleBySlug(category, slug);
  if (!article) notFound();

  const fullPath = buildFullPath(category, slug, sp);
  const viewer = await getViewerContext();

  // Access gate: customer-gated + unauth is the only branch that
  // short-circuits with a server redirect. All other combinations
  // render a page (possibly a teaser).
  if (article.frontmatter.access === "customers" && !viewer.signedIn) {
    redirect(`/login?redirect=${encodeURIComponent(fullPath)}`);
  }

  const shouldTeaser =
    article.frontmatter.access === "customers" && viewer.level !== "full";

  // Truncate AT THE MARKDOWN LEVEL for teaser mode. Words beyond
  // TEASER_WORDS are never passed to the renderer, so view-source on
  // a teaser response contains only the excerpt, never the full body
  // hidden behind CSS or a <template> tag.
  const bodyMd = shouldTeaser
    ? takeFirstWords(article.body, TEASER_WORDS)
    : article.body;
  const bodyHtml = await renderMarkdown(bodyMd);

  const related = await getRelatedArticles(article, viewer.level);
  const readMinutes = estimateReadMinutes(article.body);
  const categoryTitle = titleCaseCategorySlug(article.category);
  const helpful = await safeGetHelpfulBadge(category, slug);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.frontmatter.title,
    description: article.frontmatter.description,
    datePublished: article.frontmatter.updated,
    dateModified: article.frontmatter.updated,
    url: `${SITE_URL}${article.href}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}${article.href}`,
    },
    author: {
      "@type": "Organization",
      name: "Dunamis Studios",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Dunamis Studios",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon` },
    },
    keywords: article.frontmatter.tags?.join(", ") ?? undefined,
    isAccessibleForFree: article.frontmatter.access === "public",
    ...(article.frontmatter.access === "customers"
      ? {
          hasPart: {
            "@type": "WebPageElement",
            isAccessibleForFree: false,
            cssSelector: ".kb-gated",
          },
        }
      : {}),
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
        name: categoryTitle,
        item: `${SITE_URL}/help/${category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.frontmatter.title,
        item: `${SITE_URL}${article.href}`,
      },
    ],
  };

  const softwareSchema = productSoftwareSchema(article.frontmatter.product);

  return (
    <>
      <JsonLd
        id={`jsonld-help-article-${category}-${slug}`}
        schema={articleSchema}
      />
      <JsonLd
        id={`jsonld-help-article-${category}-${slug}-breadcrumb`}
        schema={breadcrumbSchema}
      />
      {softwareSchema ? (
        <JsonLd
          id={`jsonld-help-article-${category}-${slug}-software`}
          schema={softwareSchema}
        />
      ) : null}

      <Section className="pb-6">
        <Container size="md">
          <Breadcrumbs
            items={[
              { label: "Help", href: "/help" },
              { label: categoryTitle, href: `/help/${category}` },
              { label: article.frontmatter.title },
            ]}
            className="mb-5"
          />
          <PageHeader
            title={article.frontmatter.title}
            description={article.frontmatter.description}
          />
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[var(--fg-subtle)]">
            <span className="font-medium uppercase tracking-[0.14em]">
              {KB_PRODUCT_LABEL[article.frontmatter.product]}
            </span>
            <span aria-hidden>·</span>
            <span>Updated {article.frontmatter.updated}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden /> {readMinutes} min read
            </span>
            {helpful.helpful ? (
              <>
                <span aria-hidden>·</span>
                <Badge
                  variant="success"
                  aria-label="Readers marked this article as helpful"
                >
                  <ThumbsUp className="h-3 w-3" aria-hidden />
                  Helpful
                </Badge>
              </>
            ) : null}
            {article.frontmatter.access === "customers" ? (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1 text-[var(--color-brief-500)]">
                  <Lock className="h-3 w-3" aria-hidden /> Customers only
                </span>
              </>
            ) : null}
            {article.frontmatter.tags?.length ? (
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                {article.frontmatter.tags.map((t) => (
                  <Badge key={t} variant="neutral" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </Container>
      </Section>

      <Section className="!pt-2 !pb-16">
        <Container size="md">
          {shouldTeaser ? (
            <TeaserBody
              html={bodyHtml}
              article={article}
              fullPath={fullPath}
            />
          ) : (
            <div
              className="kb-prose"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          )}

          <div className="mt-10">
            <ArticleRating slug={article.slug} category={article.category} />
          </div>

          {related.length > 0 ? <RelatedArticles items={related} /> : null}
        </Container>
      </Section>
    </>
  );
}

function TeaserBody({
  html,
  article,
  fullPath,
}: {
  html: string;
  article: KbArticle;
  fullPath: string;
}) {
  return (
    <div className="relative">
      {/*
        The HTML above only contains the first TEASER_WORDS words of
        the body. The remainder was never passed to the renderer, so
        it isn't in the DOM at all. The CSS mask fades the last few
        sentences into the card below. View-source on a teaser render
        confirms: only the excerpt is present, no hidden-behind-blur
        content.
      */}
      <div
        className="kb-prose kb-gated [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="relative -mt-10 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-md)]">
        <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
          Subscribe to continue reading
        </h2>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          {article.frontmatter.title} is part of the customer-only docs.
          Any active Dunamis Studios subscription (Debrief or Property
          Pulse) unlocks the full article.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href={`/pricing?return=${encodeURIComponent(fullPath)}`}>
              See plans
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/login?redirect=${encodeURIComponent(fullPath)}`}>
              Sign in with a different account
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function RelatedArticles({ items }: { items: KbArticle[] }) {
  return (
    <section className="mt-14 border-t border-[var(--border)] pt-10">
      <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
        Related articles
      </h2>
      <ul className="mt-5 grid gap-4 md:grid-cols-3">
        {items.map((a) => (
          <li key={`${a.category}/${a.slug}`}>
            <Link
              href={a.href}
              className="group flex h-full flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 transition-colors hover:border-[var(--border-strong)]"
            >
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                {KB_PRODUCT_LABEL[a.frontmatter.product]}
              </span>
              <span className="line-clamp-2 font-medium text-[var(--fg)]">
                {a.frontmatter.title}
              </span>
              <span className="line-clamp-2 text-xs text-[var(--fg-muted)]">
                {a.frontmatter.description}
              </span>
              <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-[var(--fg-muted)] group-hover:text-[var(--fg)]">
                Read <ArrowRight className="h-3 w-3" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---- viewer + access helpers ---------------------------------------------

type ViewerLevel = "public-only" | "full";

async function getViewerContext(): Promise<{
  level: ViewerLevel;
  signedIn: boolean;
}> {
  const session = await safeGetSession();
  if (!session) return { level: "public-only", signedIn: false };
  const ents = await safeGetEntitlements(session.account.accountId);
  return {
    level: hasGatedAccess(ents) ? "full" : "public-only",
    signedIn: true,
  };
}

function hasGatedAccess(entitlements: Entitlement[]): boolean {
  // "Active enough to read gated content": paying customers, people
  // in trial, and people whose payment is recovering from a
  // transient failure. Incomplete signups and canceled accounts are
  // not in.
  return entitlements.some(
    (e) =>
      e.status === "active" ||
      e.status === "trial" ||
      e.status === "past_due",
  );
}

async function safeGetSession() {
  try {
    return await getCurrentSession();
  } catch {
    return null;
  }
}

async function safeGetEntitlements(accountId: string): Promise<Entitlement[]> {
  try {
    return await getEntitlementsForAccount(accountId);
  } catch {
    return [];
  }
}

async function safeGetHelpfulBadge(category: string, slug: string) {
  try {
    return await getHelpfulBadge(category, slug);
  } catch {
    return { helpful: false, threshold: { minUpvotes: 0, minRatio: 0 } };
  }
}

async function getRelatedArticles(
  current: KbArticle,
  viewerLevel: ViewerLevel,
): Promise<KbArticle[]> {
  const all = await getPublishedArticles();
  return all
    .filter((a) => {
      if (a.slug === current.slug && a.category === current.category)
        return false;
      if (a.frontmatter.product !== current.frontmatter.product) return false;
      if (a.category !== current.category) return false;
      if (viewerLevel === "public-only" && a.frontmatter.access !== "public") {
        return false;
      }
      return true;
    })
    .slice(0, 3);
}

// ---- path + label helpers ------------------------------------------------

function buildFullPath(
  category: string,
  slug: string,
  sp: Record<string, string | string[] | undefined>,
): string {
  const base = `/help/${category}/${slug}`;
  const qs = buildQueryString(sp);
  return qs ? `${base}?${qs}` : base;
}

function buildQueryString(
  sp: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) {
      for (const v of val) params.append(key, v);
    } else {
      params.append(key, val);
    }
  }
  return params.toString();
}

function titleCaseCategorySlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Emit a SoftwareApplication JSON-LD for Debrief / Property Pulse
 * articles so search engines connect the article's subject to the
 * product entity. Platform articles return null (there's no software
 * to describe). Pricing offers intentionally omitted here so the
 * product page stays the single source of truth for offer data.
 */
function productSoftwareSchema(product: KbProduct): object | null {
  if (product === "platform") return null;
  const info: Record<Exclude<KbProduct, "platform">, {
    name: string;
    description: string;
    subCategory: string;
    path: string;
  }> = {
    debrief: {
      name: "Debrief",
      description:
        "Handoff intelligence for HubSpot CRM. Generates a structured brief and conversational handoff message when a record changes ownership.",
      subCategory: "CRM",
      path: "/products/debrief",
    },
    "property-pulse": {
      name: "Property Pulse",
      description:
        "Real-time deal health signal for HubSpot CRM.",
      subCategory: "CRM",
      path: "/products/property-pulse",
    },
  };
  const p = info[product];
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: p.name,
    description: p.description,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: p.subCategory,
    operatingSystem: "Web-based",
    url: `${SITE_URL}${p.path}`,
    publisher: {
      "@type": "Organization",
      name: "Dunamis Studios",
      url: SITE_URL,
    },
  };
}
