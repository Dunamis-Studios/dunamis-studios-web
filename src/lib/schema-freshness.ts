/**
 * Content-freshness fields used by schema.org JSON-LD blocks across
 * the site's static marketing surfaces.
 *
 * SITE_PUBLISHED is a stable ISO-8601 date for when each static
 * marketing surface first went live. Bumping it would falsely imply
 * the page is brand new every release, so it stays pinned.
 *
 * SITE_LAST_MODIFIED is bumped manually each time a marketing surface
 * receives a substantial content update (FAQ added, copy rewritten,
 * pricing changed, schema fields expanded). Keep this near the top
 * of every marketing-page review so search and answer engines see a
 * recent dateModified rather than a year-old timestamp.
 *
 * Pages whose JSON-LD already computes datePublished and dateModified
 * from a dynamic source (articles, guides, KB articles) compute their
 * own values via post.publishedAt and post.updatedAt and do not use
 * these constants.
 */
export const SITE_PUBLISHED = "2026-04-15";
export const SITE_LAST_MODIFIED = "2026-05-03";

/**
 * Spreadable freshness fragment for schema.org blocks. Returns the
 * two date fields keyed exactly as schema.org expects, so callers
 * can `...siteFreshness()` into any node that accepts them
 * (CollectionPage, WebSite, Course, SoftwareApplication, WebPage).
 */
export function siteFreshness(): {
  datePublished: string;
  dateModified: string;
} {
  return {
    datePublished: SITE_PUBLISHED,
    dateModified: SITE_LAST_MODIFIED,
  };
}
