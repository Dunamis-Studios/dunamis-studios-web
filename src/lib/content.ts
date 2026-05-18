/**
 * Persistence layer for long-form marketing content (guides + articles).
 *
 * Posts live in Redis as JSON blobs keyed by slug, with a parallel
 * sorted-set index per content type ordered by publishedAt (or
 * createdAt for drafts). The admin /admin/content surfaces, the public
 * /build-services/articles and /build-services/guides pages, and the
 * KB cross-link helpers all funnel through the small CRUD surface
 * exported here.
 *
 * Related: src/lib/redis-keys.ts (KEY.guide / KEY.article namespacing),
 * src/lib/types.ts (PRODUCT_META + ProductCatalogSlug for related
 * products), src/components/admin/post-editor.tsx (admin UI).
 */
import { redis, KEY } from "./redis";
import {
  PRODUCT_CATALOG_SLUGS,
  type ProductCatalogSlug,
} from "./types";

/** Discriminator for the two long-form content types stored here. */
export type ContentType = "guide" | "article";

/**
 * Optional structured content blocks for AEO-grade listicle articles.
 * Each block is rendered as a dedicated section below the article body
 * when the corresponding field is populated, and articles without these
 * fields render identically to before they were introduced.
 */
export interface PostFaqItem {
  q: string;
  a: string;
}

export interface PostComparisonTable {
  /**
   * Column headers for the comparison table. headers[0] labels the row
   * dimension column (e.g., "Capability"); headers[1..n] are the
   * comparison subjects (e.g., "Property Pulse", "Audit Fox").
   * Each row's cells.length must equal headers.length minus one.
   */
  headers: string[];
  rows: PostComparisonRow[];
}

export interface PostComparisonRow {
  dimension: string;
  cells: string[];
}

export interface Post {
  slug: string;
  title: string;
  description: string;
  contentHtml: string;
  status: "draft" | "published";
  coverImageUrl?: string;
  targetKeyword?: string;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  authorAccountId: string;
  /**
   * Optional FAQ block rendered as <details> accordions below the body
   * and emitted as schema.org FAQPage JSON-LD for AEO extraction.
   */
  faq?: PostFaqItem[];
  /**
   * Optional N-column comparison table rendered below the body. Useful
   * for listicle articles that compare multiple products on a shared
   * set of capabilities.
   */
  comparisonTable?: PostComparisonTable;
  /**
   * Optional set of Dunamis Studios product slugs the article links to.
   * Drives the "Related products" cards rendered below the body. Keyed
   * off the broader catalog union (ProductCatalogSlug) so unshipped
   * products in the catalog are also eligible for cross linking. Adding
   * a new product to PRODUCT_META in src/lib/types.ts is the only place
   * new slugs are introduced.
   */
  relatedProducts?: ProductCatalogSlug[];
}

/** Single-key resolver. Picks the right KEY.* helper for the type. */
function keyFor(type: ContentType, slug: string): string {
  return type === "guide" ? KEY.guide(slug) : KEY.article(slug);
}

/** Sorted-set index key resolver. One index per content type. */
function indexKey(type: ContentType): string {
  return type === "guide" ? KEY.guidesIndex : KEY.articlesIndex;
}

/**
 * Read a single post from Redis. Returns null when the slug isn't
 * registered (admin deletes, never-published drafts viewed from a
 * stale URL, etc.) so callers can fall through to notFound().
 *
 * @param type - "guide" or "article" content type.
 * @param slug - URL-safe identifier (kebab-case).
 * @returns The full Post record or null if missing.
 */
export async function getPost(
  type: ContentType,
  slug: string,
): Promise<Post | null> {
  const r = redis();
  return r.get<Post>(keyFor(type, slug));
}

/**
 * Upsert a post and refresh its index entry. The index score is the
 * publishedAt timestamp when set, otherwise createdAt; that lets the
 * default listPosts() ordering surface published-newest-first while
 * still tracking drafts for the admin includeDrafts flag.
 *
 * @param type - "guide" or "article" content type.
 * @param post - Full Post record. Slug is the index member.
 */
export async function savePost(type: ContentType, post: Post): Promise<void> {
  const r = redis();
  await r.set(keyFor(type, post.slug), post);
  const score = post.publishedAt ?? post.createdAt;
  await r.zadd(indexKey(type), { score, member: post.slug });
}

/**
 * Remove a post and its index entry in lockstep. Both deletes are
 * issued; a partial failure leaves a stale index pointing at a
 * missing key, which listPosts handles by skipping. No transaction
 * wrapper because admin-side editorial deletes are infrequent and a
 * stale index entry self-heals on the next listPosts call.
 *
 * @param type - "guide" or "article" content type.
 * @param slug - The slug of the post to delete.
 */
export async function deletePost(
  type: ContentType,
  slug: string,
): Promise<void> {
  const r = redis();
  await r.del(keyFor(type, slug));
  await r.zrem(indexKey(type), slug);
}

/**
 * List every post of the given type, ordered newest first by index
 * score. Skips drafts unless includeDrafts is set (admin views).
 * Self-heals stale index entries: a slug in the index without a
 * matching key value (deleted out of band, half-completed delete) is
 * skipped rather than throwing.
 *
 * @param type - "guide" or "article" content type.
 * @param opts.includeDrafts - When true, drafts are included in the
 *                              result. Admin surfaces only.
 * @returns Array of Post records sorted by score descending.
 */
export async function listPosts(
  type: ContentType,
  opts: { includeDrafts: boolean } = { includeDrafts: false },
): Promise<Post[]> {
  const r = redis();
  // Step 1: pull every slug from the index in newest-first order.
  const slugs = await r.zrange<string[]>(indexKey(type), 0, -1, { rev: true });
  if (!slugs || slugs.length === 0) return [];

  // Step 2: hydrate each slug into its Post record. Sequential rather
  // than parallel because admin lists are small enough that the
  // sequential cost is negligible and the resulting code stays simple.
  const posts: Post[] = [];
  for (const slug of slugs) { // claude-code:allow-await-in-loop
    const post = await r.get<Post>(keyFor(type, slug));
    if (!post) continue;
    if (!opts.includeDrafts && post.status !== "published") continue;
    posts.push(post);
  }
  return posts;
}

// -----------------------------------------------------------------
// Normalization helpers for the optional listicle fields. The admin
// API handlers run these on every write to keep Redis records well-
// shaped: empty strings are trimmed away, malformed entries are
// dropped, and a row whose cell count drifts from headers.length - 1
// is padded or truncated rather than rejecting the whole save.
// Each helper returns undefined when the input would land empty, so
// callers can pass the result straight into the Post object and
// existing articles continue to round-trip with no new fields set.
// -----------------------------------------------------------------

export function normalizeFaq(input: unknown): PostFaqItem[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const cleaned: PostFaqItem[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (typeof record.q !== "string" || typeof record.a !== "string") continue;
    const q = record.q.trim();
    const a = record.a.trim();
    if (!q || !a) continue;
    cleaned.push({ q, a });
  }
  return cleaned.length > 0 ? cleaned : undefined;
}

export function normalizeComparisonTable(
  input: unknown,
): PostComparisonTable | undefined {
  if (!input || typeof input !== "object") return undefined;
  const record = input as Record<string, unknown>;
  if (!Array.isArray(record.headers) || !Array.isArray(record.rows)) {
    return undefined;
  }
  const headers = (record.headers as unknown[])
    .filter((h): h is string => typeof h === "string")
    .map((h) => h.trim());
  if (headers.length < 2) return undefined; // need dimension + at least one subject
  const expectedCells = headers.length - 1;
  const rows: PostComparisonRow[] = [];
  for (const row of record.rows as unknown[]) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (typeof r.dimension !== "string" || !Array.isArray(r.cells)) continue;
    const dimension = r.dimension.trim();
    if (!dimension) continue;
    const cells = (r.cells as unknown[])
      .filter((c): c is string => typeof c === "string")
      .map((c) => c.trim());
    // Pad short rows and truncate long rows so the row width always
    // matches the header count. This keeps the table grid consistent
    // even if the editor and API drift on column-count edits.
    while (cells.length < expectedCells) cells.push("");
    if (cells.length > expectedCells) cells.length = expectedCells;
    rows.push({ dimension, cells });
  }
  if (rows.length === 0) return undefined;
  return { headers, rows };
}

export function normalizeRelatedProducts(
  input: unknown,
): ProductCatalogSlug[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const valid = new Set<string>(PRODUCT_CATALOG_SLUGS);
  const cleaned: ProductCatalogSlug[] = [];
  for (const slug of input) {
    if (typeof slug !== "string") continue;
    if (!valid.has(slug)) continue;
    if (cleaned.includes(slug as ProductCatalogSlug)) continue; // dedupe while preserving order
    cleaned.push(slug as ProductCatalogSlug);
  }
  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Generate a slug that doesn't collide with an existing post.
 *
 * Returns the base slug unchanged when the namespace is clear,
 * otherwise appends -2, -3, -4 etc. until an unused candidate is
 * found. Called by the admin create flow so a second "How to X"
 * article auto-becomes "how-to-x-2" instead of overwriting the first.
 *
 * @param type - "guide" or "article" content type.
 * @param baseSlug - The slugified title the editor first proposed.
 * @returns A unique slug (possibly the input unchanged).
 */
export async function generateUniqueSlug(
  type: ContentType,
  baseSlug: string,
): Promise<string> {
  const r = redis();
  let candidate = baseSlug;
  let suffix = 2;
  // Sequential probing: each iteration depends on the prior candidate
  // being unavailable, so Promise.all parallelization does not apply.
  while (true) { // claude-code:allow-await-in-loop
    const existing = await r.exists(keyFor(type, candidate));
    if (!existing) return candidate;
    candidate = `${baseSlug}-${suffix}`;
    suffix++;
  }
}
