import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

/**
 * Atelier documentation loader.
 *
 * Sister module to `src/lib/kb.ts`. Reads markdown documentation that
 * lives at `content/atelier-docs/{slug}.md` and renders under the
 * Atelier product page (not the shared help center). The two systems
 * deliberately stay separate: the help center is shared infrastructure
 * across HubSpot products and the studio, while the Atelier docs are
 * product-specific reference material that ships as part of the
 * Atelier product surface.
 *
 * Frontmatter shape mirrors the kb shape closely so editors who know
 * one know the other. Differences:
 *   - No `product` / `access` fields (always Atelier, always public).
 *   - Adds a `category` field grouping docs into sidebar sections
 *     ("getting-started", "using-atelier", "reference", "policies").
 *   - Adds an `order` field that controls intra-category sort.
 *
 * URL pattern: `/build-services/products/atelier/docs/{slug}`. The
 * special slug `index` is reserved for the docs root page.
 */

const CONTENT_ROOT = path.join(process.cwd(), "content", "atelier-docs");

export const ATELIER_DOC_CATEGORIES = [
  "getting-started",
  "using-atelier",
  "reference",
  "policies",
] as const;
export type AtelierDocCategory = (typeof ATELIER_DOC_CATEGORIES)[number];

/** Display label for each category — drives the sidebar group headers. */
export const ATELIER_DOC_CATEGORY_LABEL: Record<AtelierDocCategory, string> = {
  "getting-started": "Getting Started",
  "using-atelier": "Using Atelier",
  reference: "Reference",
  policies: "Policies",
};

/**
 * Coerce an unquoted YAML date into the canonical YYYY-MM-DD string.
 * Same coercer used in src/lib/kb.ts. Pulled inline rather than
 * imported so atelier-docs stays a clean independent module.
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

export const atelierDocFrontmatterSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(200),
  category: z.enum(ATELIER_DOC_CATEGORIES),
  order: z.number().int(),
  updated: z.preprocess(
    coerceUpdated,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "updated must be YYYY-MM-DD",
    }),
  ),
});

export type AtelierDocFrontmatter = z.infer<typeof atelierDocFrontmatterSchema>;

export interface AtelierDoc {
  slug: string;
  frontmatter: AtelierDocFrontmatter;
  body: string;
  filePath: string;
  href: string;
}

const DOCS_BASE_PATH = "/build-services/products/atelier/docs";

function hrefForSlug(slug: string): string {
  return `${DOCS_BASE_PATH}/${slug}`;
}

/** Public base path constant — used by sitemap, JSON-LD, and the
 *  custom shortcode resolver in atelier-docs-render.ts. */
export const ATELIER_DOCS_BASE_PATH = DOCS_BASE_PATH;

async function walkMarkdown(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
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

let _cache: Promise<AtelierDoc[]> | null = null;

/**
 * Load every atelier doc on disk, validate frontmatter, and cache the
 * result for the lifetime of the process. Throws on the first invalid
 * file with the file path + zod error included so a misshaped doc
 * fails the build loud rather than silently shipping.
 */
export function loadAtelierDocs(): Promise<AtelierDoc[]> {
  if (!_cache) {
    _cache = (async () => {
      const files = await walkMarkdown(CONTENT_ROOT);
      const docs: AtelierDoc[] = [];
      for (const filePath of files) {
        const raw = await fs.readFile(filePath, "utf8");
        const parsed = matter(raw);
        const fmResult = atelierDocFrontmatterSchema.safeParse(parsed.data);
        if (!fmResult.success) {
          throw new Error(
            `Invalid atelier-docs frontmatter in ${filePath}: ${fmResult.error.message}`,
          );
        }
        // Slug derives from the relative path under CONTENT_ROOT, with
        // the .md stripped. Subdirectories are joined with `/` so an
        // api-reference/leads/list.md file becomes the slug
        // "api-reference/leads/list" and the URL ends in the same.
        const rel = path
          .relative(CONTENT_ROOT, filePath)
          .replace(/\\/g, "/")
          .replace(/\.md$/, "");
        docs.push({
          slug: rel,
          frontmatter: fmResult.data,
          body: parsed.content,
          filePath,
          href: hrefForSlug(rel),
        });
      }
      return docs;
    })();
  }
  return _cache;
}

/**
 * Look up a single doc by slug. Returns null if the file doesn't exist
 * — the route handler converts that into a 404. Convention is that the
 * docs index page (slug "index") is rendered by a sibling page.tsx,
 * not via this loader, so getAtelierDoc("index") returning null is
 * expected and not a bug.
 */
export async function getAtelierDoc(slug: string): Promise<AtelierDoc | null> {
  const docs = await loadAtelierDocs();
  return docs.find((d) => d.slug === slug) ?? null;
}

/**
 * Sidebar navigation tree. Groups docs by category, ordered by the
 * `order` frontmatter field within each category. Categories appear
 * in the canonical order listed in ATELIER_DOC_CATEGORIES.
 */
export interface AtelierDocsNavGroup {
  category: AtelierDocCategory;
  label: string;
  items: { slug: string; title: string; href: string }[];
}

export async function getAtelierDocsNavigation(): Promise<AtelierDocsNavGroup[]> {
  const docs = await loadAtelierDocs();
  return ATELIER_DOC_CATEGORIES.map((category) => {
    const items = docs
      .filter((d) => d.frontmatter.category === category)
      // Treat nested API-reference subroutes as belonging to the
      // top-level api-reference index for sidebar purposes — the deep
      // tree is shown on the api-reference page itself, not in the
      // global sidebar.
      .filter((d) => !d.slug.includes("/"))
      .sort((a, b) => a.frontmatter.order - b.frontmatter.order)
      .map((d) => ({
        slug: d.slug,
        title: d.frontmatter.title,
        href: d.href,
      }));
    return {
      category,
      label: ATELIER_DOC_CATEGORY_LABEL[category],
      items,
    };
  }).filter((g) => g.items.length > 0);
}
