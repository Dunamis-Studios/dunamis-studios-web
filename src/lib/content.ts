import { redis, KEY } from "./redis";
import type { Product } from "./types";

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
   * Drives the "Related products" cards rendered below the body. The
   * union mirrors src/lib/types.ts so adding a marketplace product is
   * the only place new slugs are introduced.
   */
  relatedProducts?: Product[];
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
