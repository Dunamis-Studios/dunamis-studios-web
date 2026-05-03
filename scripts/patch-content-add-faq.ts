/**
 * One-off content patcher: populates the faq array on the three
 * published articles that currently have empty faq fields. Drives
 * both the visible FAQ accordion below the article body (FaqSection)
 * and the FAQPage JSON-LD emitted in the article slug page head
 * (buildFaqPageSchema). Idempotent: skipped if faq is already
 * populated for a given slug.
 *
 * Usage:
 *   npx tsx scripts/patch-content-add-faq.ts
 */
import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import {
  getPost,
  savePost,
  type ContentType,
  type Post,
  type PostFaqItem,
} from "../src/lib/content";

interface Patch {
  type: ContentType;
  slug: string;
  faq: PostFaqItem[];
}

const PATCHES: Patch[] = [
  {
    type: "article",
    slug: "why-hubspot-s-gaps-are-the-strategy",
    faq: [
      {
        q: "Why does HubSpot leave obvious feature gaps in its product?",
        a: "Every feature HubSpot builds in-house costs them senior engineers, product managers, and ongoing support, plus the opportunity cost of not building something more foundational. Every feature a marketplace partner builds costs HubSpot nothing and earns them roughly twenty percent of that partner's revenue. The math favors letting partners cover the long tail of customer needs, and the platform team uses its bandwidth to ship developer primitives instead.",
      },
      {
        q: "How does this differ from Salesforce's approach to its app marketplace?",
        a: "Salesforce's AppExchange started strong, but Salesforce got into the habit of acquiring or cloning the apps that did well. Partners stopped trusting the platform as a real business surface, developer enthusiasm cooled, and the marketplace became something Salesforce maintained instead of something developers fought to be in. HubSpot has visibly chosen the other path: continued public investment in the developer platform, the marketplace revenue share, and a steady stream of new partner-facing primitives in 2026.",
      },
      {
        q: "What kinds of HubSpot problems does the marketplace fill best?",
        a: "Vertical, deep-workflow problems that a focused partner can solve better than a horizontal CRM ever will. Property change history surfaced across records (the gap Property Pulse fills) is one example. Handoff intelligence at the moment a deal changes owners (Debrief) is another. HubSpot serves marketing, sales, and service from startup to enterprise, so it has to build for the average of every customer. A studio building one app for one workflow can ship faster, charge less, and live closer to the actual record where the actual rep does the actual work.",
      },
      {
        q: "Where does Dunamis Studios fit in this strategy?",
        a: "We exist because of it. Property Pulse, Debrief, Traverse and Update, and the rest of the catalog solve specific problems for specific operators that HubSpot itself is choosing not to solve in-house. We build the apps. HubSpot keeps building the platform. Customers get tools that match the shape of their work instead of tools designed for the average of every customer.",
      },
    ],
  },
  {
    type: "article",
    slug: "why-hubspot-can-t-show-you-property-changes-across-records",
    faq: [
      {
        q: "Why doesn't HubSpot have a native across-records property change view?",
        a: "HubSpot's property history is locked to single-record view, one property at a time, accessed manually by clicking the history icon on a record. There is no native report in the standard library, custom report builder, or workflows that surfaces 'which records changed property X in the last seven days, and what were the prior and new values.' The data is captured per record but is not exposed at a portfolio level.",
      },
      {
        q: "What's wrong with custom date-stamp property workflows?",
        a: "They work, but only forward from the moment you set them up. They capture one signal (when something changed), not the full trail (when, from what, to what, by whom). Each property you care about needs its own workflow, its own timestamp property, and its own ongoing maintenance. Multiply by ten properties across three objects and you have a small fragile system that breaks the moment someone renames anything.",
      },
      {
        q: "Why does this question come up so often?",
        a: "Because the same shape of question appears in different forms across operations: why did our pipeline forecast jump on Tuesday, did the new lead routing workflow misfire, which records did the Salesforce sync touch this week, who has been overriding deal stage manually, what did this account look like before the sales rep took it over. All of them are property change history questions across records, and none are answerable in HubSpot today without exports and spreadsheets.",
      },
      {
        q: "Will Property Pulse eventually show property changes across records?",
        a: "Yes, that is what we are building toward. Property Pulse currently shows the same per-record view HubSpot does, centralized into one CRM card and easier to scan. The next surface filters tracked property changes across records by property, date range, source, and user. The same change log HubSpot already has, presented at the level admins actually need to operate.",
      },
    ],
  },
  {
    type: "article",
    slug: "why-we-re-publishing-here-not-on-linkedin",
    faq: [
      {
        q: "Why publish on your own site instead of LinkedIn?",
        a: "LinkedIn posts die in 48 hours. The algorithm decides who sees them, and the answer is usually fewer people than last time. A post that helps someone in February is not there for the person who needs the same answer in October. Writing on our own site flips that: a post gets indexed by Google, sits at a permanent URL, and shows up the day someone searches for the problem it solves. The audience is whoever needs the answer, not whoever happened to be scrolling.",
      },
      {
        q: "What's the difference between Guides and Articles?",
        a: "Guides are the long, structured pieces: how to do a specific thing in HubSpot, with the steps, screenshots, and edge cases. They are aimed at the moment someone hits a problem and reaches for Google. Articles are shorter. Observations, opinions, the things that would have been LinkedIn posts. Less polished, more frequent, written in a real voice instead of a brand voice.",
      },
      {
        q: "Will Dunamis Studios still post on LinkedIn?",
        a: "Occasionally, yes. But the work lives here. LinkedIn posts will point at the canonical version on dunamisstudios.net rather than carrying the full content themselves, so the audience finds the indexed source and the content keeps compounding instead of evaporating in the feed.",
      },
      {
        q: "Why does this matter for readers?",
        a: "Because content that compounds reaches more people over time, not fewer. A post here that saves an admin an afternoon today can do that for a thousand admins over five years if it keeps ranking for the right query. The principle is the same one behind the products: owned ground, built carefully, that gets better with time. The writing should match.",
      },
    ],
  },
];

async function main() {
  let touched = 0;
  let skipped = 0;
  for (const patch of PATCHES) {
    const post = await getPost(patch.type, patch.slug);
    if (!post) {
      console.warn(`[faq] missing ${patch.type}/${patch.slug}, skipping`);
      skipped += 1;
      continue;
    }
    if (post.faq && post.faq.length > 0) {
      console.log(
        `[faq] ${patch.type}/${patch.slug} already has ${post.faq.length} faq items, skipping`,
      );
      skipped += 1;
      continue;
    }
    const next: Post = {
      ...post,
      faq: patch.faq,
      updatedAt: Date.now(),
    };
    await savePost(patch.type, next);
    console.log(
      `[faq] populated ${patch.faq.length} items for ${patch.type}/${patch.slug}`,
    );
    touched += 1;
  }
  console.log(`[faq] done. touched=${touched} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
