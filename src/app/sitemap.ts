import type { MetadataRoute } from "next";
import {
  getAllCategorySlugs,
  getPublishedArticles,
  getRecentArticles,
} from "@/lib/kb";

/**
 * Last-modified timestamp bumped per deploy for static marketing
 * surfaces. Help-center entries read their own `updated` date from
 * frontmatter, since those change independently of site deploys.
 */
const LAST_MODIFIED = new Date("2026-04-20T00:00:00.000Z");

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
      url: `${base}/products/debrief/roadmap`,
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
      url: `${base}/login`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${base}/signup`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/forgot-password`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.2,
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

  return [...staticEntries, ...helpEntries];
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
