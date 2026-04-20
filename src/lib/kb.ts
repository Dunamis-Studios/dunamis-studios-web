import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

/**
 * Knowledge-base article loader.
 *
 * Content lives at `content/kb/{category}/{slug}.md` — markdown with
 * zod-validated frontmatter. `content/` is excluded from tsconfig; this
 * module is the single entry point for reading articles anywhere else in
 * the codebase (pages, sitemap, search indexer).
 *
 * Invariants enforced on load:
 *   - Frontmatter parses the schema below, or the loader throws. A
 *     `next build` call surfaces the bad file path + the zod issue, so
 *     broken content can't ship to production.
 *   - `frontmatter.category` must exactly equal the folder name — the
 *     URL derives from the folder, so letting the two drift silently
 *     would make links break.
 *
 * Naming: we use "kb" internally because it's shorter and unambiguous.
 * Every user-facing surface renders as "Help center" / "/help/*".
 */

const CONTENT_ROOT = path.join(process.cwd(), "content", "kb");

export const KB_PRODUCTS = ["debrief", "property-pulse", "platform"] as const;
export type KbProduct = (typeof KB_PRODUCTS)[number];

export const KB_ACCESS = ["public", "customers"] as const;
export type KbAccess = (typeof KB_ACCESS)[number];

/**
 * Normalize an `updated` frontmatter value. YAML parses an unquoted
 * ISO date (`updated: 2026-04-20`) as a Date object rather than a
 * string, so gray-matter hands us a Date. Coerce to the canonical
 * YYYY-MM-DD string form here rather than forcing authors to quote
 * every date. Strings pass through unchanged so existing content and
 * quoted dates still validate against the regex below.
 */
function coerceUpdated(val: unknown): unknown {
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, "0");
    const d = String(val.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return val;
}

export const frontmatterSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(160),
  category: z.string().min(1).regex(/^[a-z0-9-]+$/, {
    message: "category must be kebab-case (a-z, 0-9, hyphens)",
  }),
  product: z.enum(KB_PRODUCTS),
  access: z.enum(KB_ACCESS),
  order: z.number().int().optional(),
  updated: z.preprocess(
    coerceUpdated,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "updated must be YYYY-MM-DD",
    }),
  ),
  tags: z.array(z.string().min(1)).optional(),
  draft: z.boolean().optional(),
});

export type KbFrontmatter = z.infer<typeof frontmatterSchema>;

export interface KbArticle {
  /** Slug derived from the markdown file's basename (no extension). */
  slug: string;
  /** Category slug derived from the parent directory name. */
  category: string;
  frontmatter: KbFrontmatter;
  /** Raw markdown body (no frontmatter). Render in Part 4. */
  body: string;
  /** Absolute path on disk — used for build-time diagnostics only. */
  filePath: string;
  /** URL path — always `/help/{category}/{slug}`. */
  href: string;
}

// ---- FS walker -----------------------------------------------------------

async function walkMarkdown(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries: Awaited<ReturnType<typeof fs.readdir>> = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    // Missing content dir is fine — pages render empty rather than crashing.
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return out;
    throw err;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMarkdown(full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

// ---- Loader --------------------------------------------------------------

let _cache: Promise<KbArticle[]> | null = null;

/**
 * Load every article on disk, validate frontmatter, and cache the result
 * for the lifetime of the process. Throws on the first invalid file so
 * `next build` fails loud.
 */
export function getAllArticles(): Promise<KbArticle[]> {
  if (!_cache) _cache = loadAll();
  return _cache;
}

async function loadAll(): Promise<KbArticle[]> {
  const files = await walkMarkdown(CONTENT_ROOT);
  const articles: KbArticle[] = [];
  const seen = new Map<string, string>();

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const parsed = matter(raw);
    const rel = path.relative(CONTENT_ROOT, file).replace(/\\/g, "/");
    const parts = rel.split("/");

    if (parts.length < 2) {
      throw new Error(
        `[kb] Article must live under a category directory, not at the root of content/kb. File: ${rel}`,
      );
    }

    const categoryDir = parts[0];
    const slug = path.basename(parts[parts.length - 1], ".md");

    const result = frontmatterSchema.safeParse(parsed.data);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("\n");
      throw new Error(
        `[kb] Invalid frontmatter in content/kb/${rel}:\n${issues}`,
      );
    }

    if (result.data.category !== categoryDir) {
      throw new Error(
        `[kb] Frontmatter mismatch in content/kb/${rel}: category="${result.data.category}" does not match folder "${categoryDir}".`,
      );
    }

    const key = `${categoryDir}/${slug}`;
    const prior = seen.get(key);
    if (prior) {
      throw new Error(
        `[kb] Duplicate article slug "${key}": ${prior} and ${rel}.`,
      );
    }
    seen.set(key, rel);

    articles.push({
      slug,
      category: categoryDir,
      frontmatter: result.data,
      body: parsed.content,
      filePath: file,
      href: `/help/${categoryDir}/${slug}`,
    });
  }

  return articles;
}

/**
 * Articles that should appear on the site. Drafts (frontmatter.draft = true)
 * are filtered out. Does NOT filter by access — that's a per-render
 * decision made after session lookup.
 */
export async function getPublishedArticles(): Promise<KbArticle[]> {
  const all = await getAllArticles();
  return all.filter((a) => !a.frontmatter.draft);
}

export async function getArticleBySlug(
  category: string,
  slug: string,
): Promise<KbArticle | null> {
  const all = await getPublishedArticles();
  return all.find((a) => a.category === category && a.slug === slug) ?? null;
}

export interface KbCategory {
  slug: string;
  product: KbProduct;
  articles: KbArticle[];
}

export async function getCategoriesForProduct(
  product: KbProduct,
): Promise<KbCategory[]> {
  const published = await getPublishedArticles();
  const byCategory = new Map<string, KbArticle[]>();
  for (const a of published) {
    if (a.frontmatter.product !== product) continue;
    const list = byCategory.get(a.category) ?? [];
    list.push(a);
    byCategory.set(a.category, list);
  }
  return [...byCategory.entries()]
    .map(([slug, articles]) => ({
      slug,
      product,
      articles: sortArticles(articles),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function getAllCategorySlugs(): Promise<string[]> {
  const published = await getPublishedArticles();
  const set = new Set(published.map((a) => a.category));
  return [...set].sort();
}

export async function getArticlesInCategory(
  category: string,
): Promise<KbArticle[]> {
  const published = await getPublishedArticles();
  return sortArticles(published.filter((a) => a.category === category));
}

export async function getRecentArticles(limit = 5): Promise<KbArticle[]> {
  const published = await getPublishedArticles();
  return [...published]
    .sort((a, b) => b.frontmatter.updated.localeCompare(a.frontmatter.updated))
    .slice(0, limit);
}

/**
 * Ordered listing: explicit `order` first (ascending), then unnumbered
 * items alphabetical by title.
 */
export function sortArticles(articles: KbArticle[]): KbArticle[] {
  return [...articles].sort((a, b) => {
    const ao = a.frontmatter.order ?? Number.POSITIVE_INFINITY;
    const bo = b.frontmatter.order ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return a.frontmatter.title.localeCompare(b.frontmatter.title);
  });
}

/**
 * Rough words-per-minute read estimate. 220 wpm is a reasonable middle
 * for mixed technical prose. Floor is 1 minute.
 */
export function estimateReadMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export const KB_PRODUCT_LABEL: Record<KbProduct, string> = {
  debrief: "Debrief",
  "property-pulse": "Property Pulse",
  platform: "Platform",
};
