/**
 * One-off content patcher: rewrite post.title and post.description on
 * articles and guides so the rendered <title> tag (post.title plus the
 * " · Dunamis Studios" template suffix from layout.tsx) lands within
 * 50 to 60 characters and post.description lands within 120 to 160.
 *
 * Idempotent: each patch is a literal {newTitle, newDescription} object
 * keyed by slug; re-running with the same values writes the same
 * payload. The script verifies the resulting lengths and refuses to
 * write a patch whose rendered title or description falls outside the
 * target bands.
 *
 * Usage:
 *   npx tsx scripts/patch-content-meta-lengths.ts
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

const TITLE_SUFFIX = " · Dunamis Studios";
const TITLE_MIN = 50;
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 160;

interface Patch {
  type: ContentType;
  slug: string;
  newTitle?: string;
  newDescription?: string;
}

const PATCHES: Patch[] = [
  {
    type: "article",
    slug: "best-hubspot-apps-for-sales-handoffs-in-2026",
    newTitle: "Best HubSpot sales handoff apps in 2026",
    newDescription:
      "Sales handoffs in HubSpot are two problems in one: in-process owner changes and post-close handoffs to CS. The real apps that solve each, in 2026.",
  },
  {
    type: "article",
    slug: "best-hubspot-apps-for-tracking-property-changes-in-2026",
    newTitle: "Best HubSpot property tracking apps, 2026",
    // description already in band, no change
  },
  {
    type: "article",
    slug: "why-hubspot-can-t-show-you-property-changes-across-records",
    newTitle: "HubSpot property history: per-record only",
    // description already in band, no change
  },
  {
    type: "guide",
    slug: "how-to-audit-stale-hubspot-properties",
    // title already in band, no change
    newDescription:
      "A repeatable seven-step audit for finding stale HubSpot properties, deciding what to do with each one, and slowing drift between runs.",
  },
];

function checkTitle(title: string): string | null {
  const rendered = `${title}${TITLE_SUFFIX}`;
  if (rendered.length < TITLE_MIN || rendered.length > TITLE_MAX) {
    return `rendered title length ${rendered.length} outside ${TITLE_MIN}-${TITLE_MAX}`;
  }
  return null;
}

function checkDescription(desc: string): string | null {
  if (desc.length < DESC_MIN || desc.length > DESC_MAX) {
    return `description length ${desc.length} outside ${DESC_MIN}-${DESC_MAX}`;
  }
  return null;
}

async function main() {
  let touched = 0;
  let skipped = 0;
  for (const patch of PATCHES) {
    const post = await getPost(patch.type, patch.slug);
    if (!post) {
      console.warn(`[meta] missing ${patch.type}/${patch.slug}, skipping`);
      skipped += 1;
      continue;
    }

    const finalTitle = patch.newTitle ?? post.title;
    const finalDescription = patch.newDescription ?? post.description;

    const titleErr = checkTitle(finalTitle);
    if (titleErr) {
      console.error(`[meta] ${patch.type}/${patch.slug} ABORT: ${titleErr}`);
      console.error(`       title: ${JSON.stringify(finalTitle)}`);
      process.exitCode = 1;
      continue;
    }
    const descErr = checkDescription(finalDescription);
    if (descErr) {
      console.error(`[meta] ${patch.type}/${patch.slug} ABORT: ${descErr}`);
      console.error(`       description: ${JSON.stringify(finalDescription)}`);
      process.exitCode = 1;
      continue;
    }

    if (
      finalTitle === post.title &&
      finalDescription === post.description
    ) {
      console.log(`[meta] ${patch.type}/${patch.slug} no-op, skipping`);
      skipped += 1;
      continue;
    }

    const next: Post = {
      ...post,
      title: finalTitle,
      description: finalDescription,
      updatedAt: Date.now(),
    };
    await savePost(patch.type, next);
    const renderedLen = `${finalTitle}${TITLE_SUFFIX}`.length;
    console.log(
      `[meta] patched ${patch.type}/${patch.slug} (rendered title=${renderedLen}, desc=${finalDescription.length})`,
    );
    touched += 1;
  }
  console.log(`[meta] done. touched=${touched} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
