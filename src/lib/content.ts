import { redis, KEY } from "./redis";

export type ContentType = "guide" | "article";

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
