/**
 * One-off content patcher: adds inline links to free tools where they
 * are a natural reference, not a CTA. Each link opens in a new tab via
 * target="_blank" rel="noopener noreferrer" (the kb-prose stylesheet
 * already handles underline/accent color, so no class names needed).
 *
 * Idempotent: each patch is a literal string replace anchored on a
 * unique sentence. If the anchor sentence is missing or already
 * contains the tool URL, the patch is skipped and the post is not
 * rewritten.
 *
 * Usage:
 *   npx tsx scripts/patch-content-add-tool-links.ts
 *
 * Posts touched:
 *   - articles/best-hubspot-apps-for-sales-handoffs-in-2026 (1 link)
 *   - articles/best-hubspot-apps-for-tracking-property-changes-in-2026 (1 link)
 *   - guides/how-to-audit-stale-hubspot-properties (2 links)
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
  /** Replacement HTML (must include the anchor verbatim plus the link). */
  replace: string;
  /** URL we're adding; used as an idempotence guard. */
  toolUrl: string;
}

const PATCHES: Patch[] = [
  // --- Sales handoffs article: link Handoff Time Calculator
  {
    type: "article",
    slug: "best-hubspot-apps-for-sales-handoffs-in-2026",
    toolUrl: "/tools/handoff-time-calculator",
    find: "At 40 deals that's a week of read-time that doesn't exist on the calendar.",
    replace:
      "At 40 deals that's a week of read-time that doesn't exist on the calendar. The annualized cost across a sales org with regular turnover is easy to underestimate, which is why we publish a small <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"/tools/handoff-time-calculator\">handoff-time calculator</a> for sizing it.",
  },

  // --- Property change apps article: link Bloat Score
  {
    type: "article",
    slug: "best-hubspot-apps-for-tracking-property-changes-in-2026",
    toolUrl: "/tools/hubspot-bloat-score",
    find: "If your real problem is \"our portal is a mess and I want to clean it up,\" any of these are worth a look.",
    replace:
      "If your real problem is \"our portal is a mess and I want to clean it up,\" any of these are worth a look. If you want a free triage pass first, the <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"/tools/hubspot-bloat-score\">Bloat Score</a> we publish runs the same shape of assessment in your browser.",
  },

  // --- Stale properties guide: link Bloat Score (intro)
  {
    type: "guide",
    slug: "how-to-audit-stale-hubspot-properties",
    toolUrl: "/tools/hubspot-bloat-score",
    find: "Five years of this and a contact object can carry 600+ properties, of which maybe 80 are still actively maintained.",
    replace:
      "Five years of this and a contact object can carry 600+ properties, of which maybe 80 are still actively maintained. If you have not benchmarked your portal against tier-typical counts before, the <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"/tools/hubspot-bloat-score\">Bloat Score</a> is a free read across properties, workflows, lists, and asset density per contact.",
  },

  // --- Stale properties guide: link Property Audit Checklist (in "What we do not use")
  {
    type: "guide",
    slug: "how-to-audit-stale-hubspot-properties",
    toolUrl: "/tools/property-audit-checklist",
    find: "What we do not use: any third-party \"property auditor\" app that promises a one-click report.",
    replace:
      "What we do not use: any third-party \"property auditor\" app that promises a one-click report. (Our own <a target=\"_blank\" rel=\"noopener noreferrer\" href=\"/tools/property-audit-checklist\">Property Audit Checklist</a> is a self-assessment, not a scanner: it scores your hygiene 0 to 100 across the same questions this guide covers, but you have to know your portal to answer.)",
  },
];

async function main() {
  let touched = 0;
  let skipped = 0;
  for (const patch of PATCHES) {
    const post = await getPost(patch.type, patch.slug);
    if (!post) {
      console.warn(
        `[patch] missing ${patch.type}/${patch.slug}, skipping`,
      );
      skipped += 1;
      continue;
    }
    if (post.contentHtml.includes(patch.toolUrl)) {
      console.log(
        `[patch] ${patch.type}/${patch.slug} already links ${patch.toolUrl}, skipping`,
      );
      skipped += 1;
      continue;
    }
    if (!post.contentHtml.includes(patch.find)) {
      console.warn(
        `[patch] anchor sentence not found in ${patch.type}/${patch.slug} for ${patch.toolUrl}; skipping`,
      );
      skipped += 1;
      continue;
    }
    const nextHtml = post.contentHtml.replace(patch.find, patch.replace);
    if (nextHtml === post.contentHtml) {
      console.warn(
        `[patch] no-op replace for ${patch.type}/${patch.slug} ${patch.toolUrl}`,
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
      `[patch] linked ${patch.toolUrl} in ${patch.type}/${patch.slug}`,
    );
    touched += 1;
  }
  console.log(`[patch] done. touched=${touched} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
