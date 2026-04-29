/**
 * Smoke-test the listicle Post fields (faq, comparisonTable,
 * relatedProducts) end to end against the dev Redis instance.
 *
 * Loads env vars from .env.local. Creates a draft test article with
 * all three optional fields populated, reads it back via the same
 * code path the public render route uses, asserts the round-trip
 * preserved every field byte-for-byte, then deletes the test record
 * so the dev Redis stays clean.
 *
 * Usage:
 *   npx tsx scripts/smoke-listicle-fields.ts
 *
 * Requires KV_REST_API_URL and KV_REST_API_TOKEN in .env.local.
 *
 * The script is idempotent: re-running overwrites the test record.
 * Exits non-zero on any assertion failure.
 */
import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import {
  getPost,
  savePost,
  deletePost,
  type Post,
} from "../src/lib/content";

const TEST_SLUG = "__smoke-listicle-fields";

const fixture: Post = {
  slug: TEST_SLUG,
  title: "Smoke test: listicle fields",
  description: "Exercises faq, comparisonTable, and relatedProducts.",
  contentHtml: "<p>Body content for round-trip verification.</p>",
  status: "draft",
  coverImageUrl: undefined,
  targetKeyword: undefined,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  publishedAt: undefined,
  authorAccountId: "smoke-test",
  faq: [
    { q: "What is this?", a: "A round-trip test of the FAQ field." },
    { q: "Does it persist?", a: "It should, byte for byte." },
  ],
  comparisonTable: {
    headers: ["Capability", "Subject A", "Subject B"],
    rows: [
      { dimension: "Trigger", cells: ["A trigger", "Another trigger"] },
      { dimension: "Output", cells: ["A output", "B output"] },
    ],
  },
  relatedProducts: ["property-pulse", "debrief"],
};

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function main() {
  console.log(`[smoke] writing test article ${TEST_SLUG}`);
  await savePost("article", fixture);

  console.log(`[smoke] reading test article back`);
  const read = await getPost("article", TEST_SLUG);
  if (!read) throw new Error("Read returned null after savePost");

  let failed = 0;
  function check(label: string, ok: boolean) {
    if (ok) {
      console.log(`  ok   ${label}`);
    } else {
      console.log(`  FAIL ${label}`);
      failed++;
    }
  }

  check("title preserved", read.title === fixture.title);
  check("description preserved", read.description === fixture.description);
  check("contentHtml preserved", read.contentHtml === fixture.contentHtml);
  check("status preserved", read.status === fixture.status);
  check("faq round-trips", deepEqual(read.faq, fixture.faq));
  check(
    "comparisonTable round-trips",
    deepEqual(read.comparisonTable, fixture.comparisonTable),
  );
  check(
    "relatedProducts round-trips",
    deepEqual(read.relatedProducts, fixture.relatedProducts),
  );

  console.log(`[smoke] deleting test article`);
  await deletePost("article", TEST_SLUG);

  if (failed > 0) {
    console.error(`[smoke] ${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log(`[smoke] all assertions passed`);
}

main().catch((err) => {
  console.error("[smoke] unhandled error:", err);
  process.exit(1);
});
