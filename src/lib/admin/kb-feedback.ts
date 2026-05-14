import { getPublishedArticles } from "@/lib/kb";
import { redis, KEY } from "@/lib/redis";

/**
 * Admin-only aggregation: walks every published help-center article,
 * fans out HGETALL against the `dunamis:kb:rating:{category}:{slug}`
 * HSETs, and returns one row per article with up / down / total and
 * a normalized down-rate. Sort is highest-down-rate first so the
 * articles most worth rewriting bubble to the top.
 *
 * Why a fresh service module rather than reusing `getRatingCounts`
 * from `src/lib/kb-rating.ts`: that helper is shaped for a single
 * article rendered to a reader; here we want a batch fetch on the
 * server, and the down-rate sort is admin-only signal that should
 * never leak to a reader-facing surface. Keeping the admin
 * aggregator separate from the reader-facing module preserves the
 * `getHelpfulBadge` privacy posture (counts never leave kb-rating.ts
 * for the public flow).
 */

export interface KbFeedbackRow {
  category: string;
  slug: string;
  title: string;
  /** Live KB path so an admin can click through to the article. */
  href: string;
  up: number;
  down: number;
  total: number;
  /** down / total, or 0 when total is 0. */
  downRate: number;
}

export async function listKbFeedback(): Promise<KbFeedbackRow[]> {
  const articles = await getPublishedArticles();
  const r = redis();
  const rows: KbFeedbackRow[] = await Promise.all(
    articles.map(async (a) => {
      const articleKey = `${a.category}:${a.slug}`;
      const raw =
        (await r.hgetall<Record<string, string | number>>(
          KEY.kbRating(articleKey),
        )) ?? {};
      const up = toCount(raw.up);
      const down = toCount(raw.down);
      const total = up + down;
      return {
        category: a.category,
        slug: a.slug,
        title: a.frontmatter.title,
        href: a.href,
        up,
        down,
        total,
        downRate: total > 0 ? down / total : 0,
      };
    }),
  );
  // Highest down-rate first. Tiebreak on total volume so an article
  // with 8/10 down beats one with 1/1 down (sample size matters).
  rows.sort((a, b) => {
    if (b.downRate !== a.downRate) return b.downRate - a.downRate;
    return b.total - a.total;
  });
  return rows;
}

function toCount(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
