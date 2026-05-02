import type { MetadataRoute } from "next";
import {
  getAllCategorySlugs,
  getPublishedArticles,
  getRecentArticles,
} from "@/lib/kb";
import { listPosts } from "@/lib/content";

/**
 * Last-modified timestamp bumped per deploy for static marketing
 * surfaces. Help-center entries read their own `updated` date from
 * frontmatter, since those change independently of site deploys.
 *
 * Derivation order:
 *   1. GIT_COMMIT_AUTHOR_DATE, injected at build time by
 *      next.config.ts (which runs `git log -1 --format=%aI`). Vercel
 *      does not expose a commit-timestamp env var of its own, so we
 *      derive it ourselves. This ties the lastmod to the commit that
 *      triggered the deploy, not just the build time.
 *   2. new Date() at module load. Next.js evaluates this once per
 *      cold start, and Vercel cold-starts the function on every
 *      deploy, so this approximates the deploy time within minutes.
 *
 * Either way, the value is computed at deploy time, never hardcoded.
 */
const LAST_MODIFIED = (() => {
  const fromGit = process.env.GIT_COMMIT_AUTHOR_DATE;
  if (fromGit) {
    const parsed = new Date(fromGit);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
})();

function baseUrl(): string {
  return (
    process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net"
  );
}

function parseUpdated(iso: string): Date {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? LAST_MODIFIED : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/products`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/products/debrief`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/products/property-pulse`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/products/carbon-copy`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${base}/products/traverse-and-update`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${base}/products/association-visualizer`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/products/debrief/roadmap`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/custom-development`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/tools`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/tools/handoff-time-calculator`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/tools/property-audit-checklist`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/tools/hubspot-bloat-score`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/tools/lead-scoring-builder`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/tools/sales-cycle-stagnation-calculator`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/tools/tech-stack-cost-audit`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/tools/workflow-audit-checklist`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/pricing`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/terms`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/privacy`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/legal/dpa`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/legal/subprocessors`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Help-center surfaces. /help/search is deliberately excluded:
  // query-dependent URLs accumulate as soft-404 in the index.
  const articles = await getPublishedArticles();
  const categorySlugs = await getAllCategorySlugs();
  const recent = await getRecentArticles(1);
  const helpIndexLastModified =
    recent[0] ? parseUpdated(recent[0].frontmatter.updated) : LAST_MODIFIED;

  const helpEntries: MetadataRoute.Sitemap = [
    {
      url: `${base}/help`,
      lastModified: helpIndexLastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...categorySlugs.map((slug) => ({
      url: `${base}/help/${slug}`,
      lastModified: categoryLastModified(articles, slug),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    // Customer-gated articles are noindex via the article page's
    // robots metadata, but we still list them here so Google knows
    // the URL exists and doesn't treat it as orphaned. crawlers that
    // follow the link will hit the login redirect and bounce.
    ...articles.map((a) => ({
      url: `${base}${a.href}`,
      lastModified: parseUpdated(a.frontmatter.updated),
      changeFrequency: "monthly" as const,
      priority: a.frontmatter.access === "public" ? 0.5 : 0.3,
    })),
  ];

  // Guides & Articles from Redis
  const [publishedGuides, publishedArticles] = await Promise.all([
    listPosts("guide", { includeDrafts: false }),
    listPosts("article", { includeDrafts: false }),
  ]);

  const contentEntries: MetadataRoute.Sitemap = [
    ...(publishedGuides.length > 0
      ? [
          {
            url: `${base}/guides`,
            lastModified: new Date(publishedGuides[0].updatedAt),
            changeFrequency: "weekly" as const,
            priority: 0.7,
          },
        ]
      : []),
    ...publishedGuides.map((p) => ({
      url: `${base}/guides/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...(publishedArticles.length > 0
      ? [
          {
            url: `${base}/articles`,
            lastModified: new Date(publishedArticles[0].updatedAt),
            changeFrequency: "weekly" as const,
            priority: 0.7,
          },
        ]
      : []),
    ...publishedArticles.map((p) => ({
      url: `${base}/articles/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return [...staticEntries, ...helpEntries, ...contentEntries];
}

function categoryLastModified(
  articles: { category: string; frontmatter: { updated: string } }[],
  slug: string,
): Date {
  const inCategory = articles.filter((a) => a.category === slug);
  if (inCategory.length === 0) return LAST_MODIFIED;
  const newest = inCategory.reduce((acc, a) =>
    a.frontmatter.updated > acc ? a.frontmatter.updated : acc,
    inCategory[0].frontmatter.updated,
  );
  return parseUpdated(newest);
}
