import fs from "node:fs/promises";
import path from "node:path";
import { getPublishedArticles, type KbArticle } from "../src/lib/kb";

/**
 * Build-time indexer. Walks content/kb/**\/*.md via the same loader
 * Next uses at runtime, strips markdown to plain text, and emits
 * public/kb-index.json for the client-side SearchBox to lazy-load.
 *
 * Run as `prebuild` so every `next build` writes a fresh index
 * reflecting the latest markdown. On Vercel, `npm run build` triggers
 * the npm prebuild hook automatically — no separate pipeline step.
 *
 * Customer-gated articles: title + description + tags are indexed
 * (these already appear on browse surfaces). Body content is omitted
 * so preview snippets never leak from behind the access gate. Public
 * articles: body is stripped to plain text and truncated to BODY_MAX
 * chars to bound the index download size.
 */

const BODY_MAX = 2000;
const INDEX_VERSION = 1;

interface KbIndexEntry {
  slug: string;
  category: string;
  product: string;
  title: string;
  description: string;
  tags?: string[];
  access: "public" | "customers";
  updated: string;
  href: string;
  /** Truncated plain-text body. Only present for access: public. */
  body?: string;
}

interface KbIndex {
  version: number;
  generatedAt: string;
  count: number;
  entries: KbIndexEntry[];
}

/**
 * Regex-based markdown → plain-text. Not a full AST pass — that would
 * drag in remark + the unified pipeline at build time for no material
 * quality gain. Handles the features the seed and future articles
 * actually use: headings, emphasis, lists, code (fenced + inline),
 * links, images, blockquotes, tables, task-list checkboxes, HR,
 * autolinks. Output is collapsed to single spaces.
 */
function stripMarkdown(md: string): string {
  return (
    md
      // Fenced code blocks (``` … ```)
      .replace(/```[\s\S]*?```/g, " ")
      // Inline code
      .replace(/`([^`]+)`/g, "$1")
      // Images — keep alt text
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Links — keep label
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      // Headings
      .replace(/^#{1,6}\s+/gm, "")
      // Bold / italic / strikethrough
      .replace(/(\*\*|__)(.+?)\1/g, "$2")
      .replace(/(\*|_)(.+?)\1/g, "$2")
      .replace(/~~(.+?)~~/g, "$1")
      // Blockquotes
      .replace(/^\s*>\s?/gm, "")
      // Task-list checkboxes (before bare list markers so [x] is caught)
      .replace(/^\s*[-*+]\s+\[[ xX]\]\s*/gm, "")
      // Unordered + ordered list markers
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      // Table separator rows and pipes
      .replace(/^\|?[\s\-|:]+\|?$/gm, "")
      .replace(/\|/g, " ")
      // HR
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // Autolinks
      .replace(/<https?:\/\/[^>]+>/g, "")
      // Normalize whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

function toEntry(a: KbArticle): KbIndexEntry {
  const entry: KbIndexEntry = {
    slug: a.slug,
    category: a.category,
    product: a.frontmatter.product,
    title: a.frontmatter.title,
    description: a.frontmatter.description,
    tags: a.frontmatter.tags,
    access: a.frontmatter.access,
    updated: a.frontmatter.updated,
    href: a.href,
  };
  if (a.frontmatter.access === "public") {
    const plain = stripMarkdown(a.body);
    entry.body = plain.length > BODY_MAX ? plain.slice(0, BODY_MAX) : plain;
  }
  return entry;
}

async function main() {
  const articles = await getPublishedArticles();
  const entries = articles.map(toEntry);
  const out: KbIndex = {
    version: INDEX_VERSION,
    generatedAt: new Date().toISOString(),
    count: entries.length,
    entries,
  };
  const outPath = path.join(process.cwd(), "public", "kb-index.json");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(out));
  const rel = path.relative(process.cwd(), outPath);
  // eslint-disable-next-line no-console
  console.log(
    `[kb-index] wrote ${entries.length} ${entries.length === 1 ? "entry" : "entries"} → ${rel}`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[kb-index] build failed");
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
