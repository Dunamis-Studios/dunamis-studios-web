import { redis, KEY } from "./redis";
import {
  PRODUCT_CATALOG_SLUGS,
  type ProductCatalogSlug,
} from "./types";

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

function keyFor(type: ContentType, slug: string): string {
  return type === "guide" ? KEY.guide(slug) : KEY.article(slug);
}

function indexKey(type: ContentType): string {
  return type === "guide" ? KEY.guidesIndex : KEY.articlesIndex;
}

export async function getPost(
  type: ContentType,
  slug: string,
): Promise<Post | null> {
  const r = redis();
  return r.get<Post>(keyFor(type, slug));
}

export async function savePost(type: ContentType, post: Post): Promise<void> {
  const r = redis();
  await r.set(keyFor(type, post.slug), post);
  const score = post.publishedAt ?? post.createdAt;
  await r.zadd(indexKey(type), { score, member: post.slug });
}

export async function deletePost(
  type: ContentType,
  slug: string,
): Promise<void> {
  const r = redis();
  await r.del(keyFor(type, slug));
  await r.zrem(indexKey(type), slug);
}

export async function listPosts(
  type: ContentType,
  opts: { includeDrafts: boolean } = { includeDrafts: false },
): Promise<Post[]> {
  const r = redis();
  // Get all slugs from the sorted set, newest first
  const slugs = await r.zrange<string[]>(indexKey(type), 0, -1, { rev: true });
  if (!slugs || slugs.length === 0) return [];

  const posts: Post[] = [];
  for (const slug of slugs) {
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

export async function generateUniqueSlug(
  type: ContentType,
  baseSlug: string,
): Promise<string> {
  const r = redis();
  let candidate = baseSlug;
  let suffix = 2;
  while (true) {
    const existing = await r.exists(keyFor(type, candidate));
    if (!existing) return candidate;
    candidate = `${baseSlug}-${suffix}`;
    suffix++;
  }
}
