/**
 * One-off content patcher: inserts the 5-Day HubSpot Audit course CTA
 * inside the stale-property guide, immediately before "The take"
 * section heading. Idempotent: skipped if the post already references
 * /courses/hubspot-audit.
 *
 * Usage:
 *   npx tsx scripts/patch-content-add-course-cta.ts
 */
import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import {
  getPost,
  savePost,
  type ContentType,
  type Post,
} from "../src/lib/content";

interface Patch {
  type: ContentType;
  slug: string;
  /** Unique anchor that already exists in the post's contentHtml. */
  find: string;
  /** Replacement HTML (must include the anchor verbatim plus the new CTA). */
  replace: string;
  /** URL we're adding; used as an idempotence guard. */
  courseUrl: string;
}

const COURSE_CTA_HTML = [
  '<div style="margin:1.8em 0;padding:1.2em 1.4em;border:1px solid var(--border);border-radius:10px;background:var(--bg-elevated);">',
  "<strong>Want the full audit?</strong> ",
  'Get a <a target="_blank" rel="noopener noreferrer" href="/courses/hubspot-audit">free 5-day email course</a> ',
  "that walks through every dimension of your portal.",
  "</div>",
].join("");

const PATCHES: Patch[] = [
  {
    type: "guide",
    slug: "how-to-audit-stale-hubspot-properties",
    courseUrl: "/courses/hubspot-audit",
    // The h2 heading immediately before the closing "take" section.
    // We anchor on it and prepend the CTA so the order becomes:
    // ...prevention copy... CTA card... <h2>The take</h2>... closing copy.
    find: "<h2>The take</h2>",
    replace: `${COURSE_CTA_HTML}\n<h2>The take</h2>`,
  },
];

async function main() {
  let touched = 0;
  let skipped = 0;
  for (const patch of PATCHES) {
    const post = await getPost(patch.type, patch.slug);
    if (!post) {
      console.warn(`[cta] missing ${patch.type}/${patch.slug}, skipping`);
      skipped += 1;
      continue;
    }
    if (post.contentHtml.includes(patch.courseUrl)) {
      console.log(
        `[cta] ${patch.type}/${patch.slug} already links ${patch.courseUrl}, skipping`,
      );
      skipped += 1;
      continue;
    }
    if (!post.contentHtml.includes(patch.find)) {
      console.warn(
        `[cta] anchor not found in ${patch.type}/${patch.slug}; skipping`,
      );
      skipped += 1;
      continue;
    }
    const nextHtml = post.contentHtml.replace(patch.find, patch.replace);
    if (nextHtml === post.contentHtml) {
      console.warn(
        `[cta] no-op replace for ${patch.type}/${patch.slug}; skipping`,
      );
      skipped += 1;
      continue;
    }
    const next: Post = {
      ...post,
      contentHtml: nextHtml,
      updatedAt: Date.now(),
    };
    await savePost(patch.type, next);
    console.log(
      `[cta] inserted course CTA in ${patch.type}/${patch.slug}`,
    );
    touched += 1;
  }
  console.log(`[cta] done. touched=${touched} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
