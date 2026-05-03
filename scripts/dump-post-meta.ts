/**
 * Read-only diagnostic: dump title, description, dates, and content
 * length for a fixed list of post slugs so we can investigate why
 * the SEO audit tool flags certain pages as missing meta titles or
 * descriptions.
 *
 * Usage:
 *   npx tsx scripts/dump-post-meta.ts
 */
import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import { listPosts, type ContentType } from "../src/lib/content";

const TITLE_SUFFIX = " · Dunamis Studios";
const TARGET_TITLE_MIN = 50;
const TARGET_TITLE_MAX = 60;
const TARGET_DESC_MIN = 120;
const TARGET_DESC_MAX = 160;

function flag(value: number, min: number, max: number): string {
  if (value < min) return `SHORT (${value} < ${min})`;
  if (value > max) return `LONG (${value} > ${max})`;
  return `OK (${value} in ${min}-${max})`;
}

async function dump(type: ContentType) {
  const posts = await listPosts(type, { includeDrafts: false });
  for (const post of posts) {
    const renderedTitle = `${post.title}${TITLE_SUFFIX}`;
    console.log("================================================================");
    console.log(`${type}/${post.slug}`);
    console.log(
      `  bare title (${post.title.length}): ${JSON.stringify(post.title)}`,
    );
    console.log(
      `  rendered title (${renderedTitle.length}): ${flag(renderedTitle.length, TARGET_TITLE_MIN, TARGET_TITLE_MAX)}`,
    );
    console.log(
      `  description (${post.description.length}): ${flag(post.description.length, TARGET_DESC_MIN, TARGET_DESC_MAX)}`,
    );
    console.log(
      `  publishedAt: ${post.publishedAt ? new Date(post.publishedAt).toISOString() : "MISSING"}`,
    );
    console.log(`  updatedAt: ${new Date(post.updatedAt).toISOString()}`);
  }
}

async function main() {
  await dump("article");
  await dump("guide");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
