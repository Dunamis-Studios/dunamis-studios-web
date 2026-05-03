/**
 * Read-only audit: list every published article and guide and report
 * which ones have an empty or missing faq array. Used to identify
 * candidates for FAQ population so we can drive FAQPage JSON-LD on
 * the article and guide slug pages.
 *
 * Usage:
 *   npx tsx scripts/audit-post-faq.ts
 */
import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import { listPosts, type ContentType } from "../src/lib/content";

async function audit(type: ContentType) {
  const posts = await listPosts(type, { includeDrafts: false });
  const empty: typeof posts = [];
  const populated: typeof posts = [];
  for (const post of posts) {
    if (!post.faq || post.faq.length === 0) {
      empty.push(post);
    } else {
      populated.push(post);
    }
  }
  console.log(`\n--- ${type}s ---`);
  console.log(`total published: ${posts.length}`);
  console.log(
    `with faq populated: ${populated.length} (${populated.map((p) => p.slug).join(", ") || "none"})`,
  );
  console.log(`empty/missing faq: ${empty.length}`);
  for (const post of empty) {
    const snippet = post.contentHtml.replace(/<[^>]+>/g, " ").slice(0, 240).trim();
    console.log(`  - ${post.slug}`);
    console.log(`    title: ${post.title}`);
    console.log(`    description: ${post.description}`);
    console.log(`    snippet: ${snippet}...`);
  }
}

async function main() {
  await audit("article");
  await audit("guide");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
