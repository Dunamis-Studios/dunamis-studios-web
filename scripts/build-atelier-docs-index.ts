import fs from "node:fs/promises";
import path from "node:path";
import {
  loadAtelierDocs,
  ATELIER_DOC_CATEGORY_LABEL,
  type AtelierDoc,
} from "../src/lib/atelier-docs";

/**
 * Build-time indexer for the Atelier documentation hub.
 *
 * Walks content/atelier-docs/**\/*.md via the runtime loader, strips
 * markdown to plain text, and emits public/atelier-docs-index.json
 * for the client-side search page to lazy-load.
 *
 * Mirrors the shape of scripts/build-kb-index.ts but is simpler:
 *   - Atelier docs are all public, so body is always indexed.
 *   - No tags or product fields — they don't exist in the
 *     atelier-docs frontmatter.
 *   - Category is captured for filtering and display, not gating.
 *
 * Wired into the same prebuild step as the KB indexer; both run on
 * every `next build` so the deployed index reflects the source.
 */

const BODY_MAX = 4000; // Larger than KB's 2000 — atelier docs are denser reference material.
const INDEX_VERSION = 1;

interface AtelierDocsIndexEntry {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  updated: string;
  href: string;
  body: string;
}

interface AtelierDocsIndex {
  version: number;
  generatedAt: string;
  count: number;
  entries: AtelierDocsIndexEntry[];
}

/**
 * Regex-based markdown → plain text. Same shape as the kb indexer's
 * stripMarkdown — handles fenced/inline code, links, images, headings,
 * emphasis, lists, blockquotes, tables, HR, and autolinks. Output is
 * whitespace-collapsed.
 */
function stripMarkdown(md: string): string {
  return (
    md
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/(\*\*|__)(.+?)\1/g, "$2")
      .replace(/(\*|_)(.+?)\1/g, "$2")
      .replace(/~~(.+?)~~/g, "$1")
      .replace(/^\s*>\s?/gm, "")
      .replace(/^\s*[-*+]\s+\[[ xX]\]\s*/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/^\|?[\s\-|:]+\|?$/gm, "")
      .replace(/\|/g, " ")
      .replace(/^[-*_]{3,}\s*$/gm, "")
      .replace(/<https?:\/\/[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function toEntry(d: AtelierDoc): AtelierDocsIndexEntry {
  const plain = stripMarkdown(d.body);
  return {
    slug: d.slug,
    title: d.frontmatter.title,
    description: d.frontmatter.description,
    category: d.frontmatter.category,
    categoryLabel: ATELIER_DOC_CATEGORY_LABEL[d.frontmatter.category],
    updated: d.frontmatter.updated,
    href: d.href,
    body: plain.length > BODY_MAX ? plain.slice(0, BODY_MAX) : plain,
  };
}

async function main(): Promise<void> {
  const docs = await loadAtelierDocs();
  // Skip nested API-reference subroute pages — they're not in the
  // sidebar nav and shouldn't appear as standalone search hits.
  const top = docs.filter((d) => !d.slug.includes("/"));
  const entries = top.map(toEntry).sort((a, b) => a.title.localeCompare(b.title));
  const out: AtelierDocsIndex = {
    version: INDEX_VERSION,
    generatedAt: new Date().toISOString(),
    count: entries.length,
    entries,
  };
  const outPath = path.join(process.cwd(), "public", "atelier-docs-index.json");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(out));
  // eslint-disable-next-line no-console -- build-time progress log
  console.log(`[atelier-docs-index] wrote ${entries.length} entries → public/atelier-docs-index.json`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console -- build-time error
  console.error("[atelier-docs-index] failed", err);
  process.exit(1);
});
