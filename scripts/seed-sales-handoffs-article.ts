/**
 * One-off seed script: creates the "Best HubSpot apps for sales
 * handoffs in 2026" article as a draft, using the same savePost path
 * the admin API and smoke test use. Bypasses the /api/admin/content
 * auth boundary so it can run from the CLI without a session cookie.
 *
 * Mirrors scripts/seed-best-hubspot-apps-article.ts (listicle #1 on
 * tracking property changes). Same shape, same em/en dash sweep, same
 * round-trip verification.
 *
 * Usage:
 *   npx tsx scripts/seed-sales-handoffs-article.ts
 *
 * Idempotent: re-running overwrites the existing draft at this slug
 * but preserves status and createdAt if the record already exists, so
 * we don't accidentally republish or reset the timestamp on a draft
 * Josh already started editing.
 *
 * Requires KV_REST_API_URL and KV_REST_API_TOKEN in .env.local.
 */
import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import { getPost, savePost, type Post } from "../src/lib/content";

const SLUG = "best-hubspot-apps-for-sales-handoffs-in-2026";

const contentHtml = `<p>A senior AE leaves on a Friday. Their book gets carved up over the weekend. Monday morning, the new owners open their newly inherited deals.</p>
<p>Each deal page shows a stage, an amount, a close date, three or four notes from the previous rep, maybe a meeting recording or two. None of it tells the new rep what the customer actually wants. None of it says what was promised. None of it explains where the deal is stuck or why.</p>
<p>So the new rep does what every new rep does. Schedules a "checking in" call. Opens with apologies. Asks the customer to repeat themselves. Customer is annoyed. Deal momentum dies. The deal closes a quarter late or doesn't close at all.</p>
<p>Or take the other direction. A deal closes won. Sales hands off to onboarding. The CS rep watches a twelve-minute Loom from the AE, skims the deal notes, runs the kickoff call. Two weeks in, the customer mentions a critical compliance requirement that came up in cycle three of the sales process. Nobody on CS knew. Refund discussions begin.</p>
<p>These are the two faces of the sales handoff problem. Same root cause. Different surface area.</p>
<p>The information exists. It lives in call recordings, in deal notes, in email threads, in meeting summaries scattered across the activity timeline. It just isn't assembled. And the people inheriting the deal don't have time to assemble it themselves.</p>
<p>One disclosure. Debrief is on this list and we built it. So yes, biased. We'll say it once and move on. The goal here is to give you the real options, including ones we're not selling, because picking the wrong tool for your team is worse for both of us than picking a right tool that isn't ours.</p>
<h2>What "sales handoff" actually means</h2>
<p>Three different jobs get jammed under one phrase. Most of the confusion in this category comes from teams buying a tool for the wrong job and then wondering why it didn't fix the thing they actually had.</p>
<p>In-process owner change. A deal mid-cycle gets reassigned because someone left, switched territories, or got promoted. The new owner inherits the deal warm but cold to them. They need history, stakeholders, last touchpoint, what's been promised, what's blocking. Native HubSpot shows the activity timeline and notes. The new rep still has to read everything to build a mental model.</p>
<p>Sales-to-CS handoff. A deal closes won and onboarding starts. The CS rep needs the same context the AE has, plus success criteria, the implementation timeline, the stakeholder map, and the things the customer was nervous about during the buying cycle. Native HubSpot doesn't compile this. Most teams build internal handoff doc templates and ask AEs to fill them out. Completion rates are, charitably, low.</p>
<p>Lead-to-rep routing. Marketing-qualified lead becomes a sales-qualified opportunity, a rep gets assigned. This is mostly a routing problem (rules, territories, capacity), and HubSpot's Smart Transfer plus workflows handle it natively. Outside the scope of this piece.</p>
<p>The first two are where third-party apps actually live. The rest of the article is about those.</p>
<h2>Native HubSpot (activity timeline plus workflows)</h2>
<p>Every HubSpot account has this. It's free. It works on contacts, companies, deals, and tickets.</p>
<p>What it gives you: every record has an activity timeline showing emails, calls, meetings, notes, and property changes. Workflows can fire on owner change to send a Slack message, create a task, post a notification in a Teams channel, or copy fields onto an internal handoff property. Sales Hub Pro adds AI-generated email summaries and call summaries.</p>
<p>What it's good for: small teams where institutional knowledge fits in four reps' heads, where the new owner already knows the customer through team standups, and where the average deal cycle is short enough that the inherited backlog is small.</p>
<p>What it's not good for: assembling. The information is there. Nothing reads it for you. A new rep faced with 40 inherited deals will spend something like an hour per deal building their own mental model from raw timeline scrolling. At 40 deals that's a week of read-time that doesn't exist on the calendar.</p>
<p><strong>Best for:</strong> small teams with short cycles where context is shared in person and inherited backlogs stay small.</p>
<h2>Debrief</h2>
<p>We built this. Disclosure stays in effect.</p>
<p>What it does: when a deal owner changes, Debrief generates an inheritance brief for the new owner and lands it as a CRM card on the deal record. The brief reads the activity timeline (calls, emails, meetings, notes, property changes) and produces a synthesized summary of what's happened, what's been promised, who the stakeholders are, what's blocking the deal, and what the recommended next move is. The new rep gets a 90-second read instead of an hour of scrolling.</p>
<p>The job it's actually for: in-process owner changes. AE leaves, territory shifts, promotion bumps a rep off their book, anything that puts a deal in front of a new owner mid-cycle. That's the trigger we built around.</p>
<p>What we don't do: full sales-to-CS handoff packages with success-criteria templates, onboarding workflows, or post-close customer-facing onboarding tracking. Debrief is upstream of CS. It's about getting the next sales owner up to speed.</p>
<p>What we also don't do: conversation intelligence on calls themselves. Debrief reads what your meeting and call apps have already written into HubSpot. If your reps don't record calls or take notes, Debrief has less to work with. Pair it with Fathom, Gong, or Avoma for the recording layer; we read what they write.</p>
<p>Pricing post-beta: three tiers, all per portal per month. Starter at $19/month gives 50 credits per month (100 in the first month) on standard objects, with a 30-day Handoff Log and Brief Search window. Pro at $49/month gives 250 credits per month (500 first month), adds custom-object briefs, and extends the Log and Search window to 90 days. Enterprise at $149/month gives 1,000 credits per month (2,000 first month), full custom-object associations, a 365-day Log, unlimited Brief Search, and custom prompt tuning.</p>
<p>Credits scale with brief size: a simple handoff is 1 credit; a deep-history brief can run 16 or more. Add-on credit packs run from $25 (100 credits) up to $1,500 (10,000 credits, 40% off at the top). Free during HubSpot marketplace beta.</p>
<p><strong>Best for:</strong> HubSpot teams with frequent in-process owner changes, where the new owner has minutes (not hours) to ramp on an inherited deal.</p>
<h2>AskElephant</h2>
<p>The most direct competitor in the handoff-brief category, and the one we benchmark against most often. They've shipped a real product and they execute well in their lane.</p>
<p>What it does: an AI agent that listens to your sales calls, watches your CRM, and auto-generates a sales-to-CS handoff package when a deal closes won. The package pulls pain points, success criteria, stakeholders, timeline, and next steps out of the call, email, and note corpus and lays them into a structured doc inside HubSpot. Also does AI deal coaching, churn-risk alerts, and CRM-update automation as adjacent features.</p>
<p>What it's good for: post-sale handoffs at teams that already record calls. If your reps already use Gong, Chorus, or Fathom, and your CS team needs structured context fast, AskElephant turns those raw transcripts into a handoff doc without anyone manually assembling.</p>
<p>What it doesn't do as well: in-process owner changes. AskElephant's primary motion is closed-won to CS. If a senior AE leaves Tuesday and the new owner inherits 40 active deals Wednesday, AskElephant isn't shaped around that lifecycle event specifically. The brief generation works best with a clean trigger (deal closes) and a defined receiving team (CS or onboarding).</p>
<p>Marketplace stats: 5.0 rating with 12 reviews, 300+ installs. Pricing: $99/month for the Unlimited tier with a 14-day free trial. A lower Essential tier exists with pricing not shown publicly.</p>
<p><strong>Best for:</strong> HubSpot teams that record calls, want post-sale handoffs to be automatic, and have a defined CS or onboarding function on the receiving end.</p>
<h2>Arrows</h2>
<p>Arrows isn't a brief generator. It's an onboarding execution platform that solves a related but different problem, and it shows up in handoff conversations because the boundaries blur once a deal closes.</p>
<p>What it does: customer-facing onboarding plans and AI-powered sales rooms that attach to HubSpot deals, tickets, or custom objects. After a deal closes, an onboarding plan can be created automatically and tied to the record, with milestones, content, and shared visibility for both internal teams and the customer. Sales rooms (the pre-close surface) connect to onboarding plans (the post-close surface) so the handoff isn't a separate document anyone has to write.</p>
<p>What it's good for: teams whose handoff problem is really an onboarding-execution problem. If your sales-to-CS friction is "nobody knows where the customer is in onboarding," Arrows fixes that with shared plans both sides can see. Stronger in industries with multi-month implementations and customers who participate in the workflow (SaaS, fintech, services).</p>
<p>What it doesn't do: it doesn't synthesize a brief. The handoff context comes from whatever sales already wrote into the deal record. Arrows builds the post-sale workflow on top, not the pre-sale narrative.</p>
<p>Marketplace stats: 4.9 rating with 53 reviews, 2K installs. HubSpot Certified App. One of the more deeply integrated apps in this corner of the marketplace.</p>
<p><strong>Best for:</strong> teams where post-sale execution is the bottleneck, not pre-sale context capture. Pairs naturally with a brief generator.</p>
<h2>A note on call and meeting intelligence tools</h2>
<p>Gong, Chorus (ZoomInfo), Avoma, Fathom. These come up constantly in handoff conversations. They are not handoff apps. They are call and meeting recording and summarization tools that get used for handoffs because the raw material lives inside them.</p>
<p>What they actually do: record calls, transcribe them, generate summaries, surface key moments, and sync the result back into HubSpot as a meeting, note, or call object on the related record.</p>
<p>Why they get pulled into the handoff conversation: when a new rep inherits a deal, the previous rep's call summaries are arguably the single most useful artifact on the record. So teams that use Gong heavily already have something like 80% of what an in-process owner needs. Same with Fathom or Avoma.</p>
<p>Why they're not enough on their own: they record. They don't synthesize across calls. They don't pull in email threads. They don't read CRM property changes. They don't compile a single brief that says "here's where this deal is and what to do next." A new owner faced with 40 inherited deals carrying 15 Gong calls each is in roughly the same place as before, only with searchable transcripts instead of vague memory.</p>
<p>Use them for the recording layer. Pair them with a brief tool (Debrief for in-process, AskElephant for sales-to-CS) for the synthesis layer. Or accept that your reps will manually scroll Gong libraries during their first week with a new book.</p>
<h2>Gainsight (brief mention)</h2>
<p>Gainsight is a full customer success platform with health scoring, lifecycle workflows, and structured handoff intake forms. It's enterprise-priced and enterprise-shaped. If your CS function is 30+ people, you have churn KPIs reported to the board, and you already track NRR religiously, you may already own Gainsight.</p>
<p>It does not generate handoffs from call content. It gives CS the workflow infrastructure to run handoffs once the data is there. Whoever is filling the intake forms on the sales side is doing the same manual work as before, just into a Gainsight form instead of a Notion doc.</p>
<p>For the typical HubSpot-native team this is overkill. Mentioning it because it shows up next to the other apps in buyer-comparison conversations and the shape difference is worth knowing.</p>
<p><strong>Best for:</strong> enterprise CS orgs that already have a dedicated CS platform line item.</p>
<h2>How to choose</h2>
<p>Reduce it to two questions. Which handoff problem are you actually solving, and what's already in your stack.</p>
<p>If you're solving in-process owner changes (AE departures, territory shifts, promotions) and you don't already have a brief generator, that's the gap Debrief was built for. We started this category because nothing on the marketplace was solving that motion specifically.</p>
<p>If you're solving sales-to-CS at close-won, and you already record calls, AskElephant is the more direct fit. Auto-generated handoff packages from call and CRM data is the AskElephant pitch and they execute it well.</p>
<p>If your sales-to-CS pain is really an onboarding-execution problem (customers losing track of where they are, internal teams losing track of where customers are), Arrows is a different shape of solution that solves a different shape of problem. Pairs naturally with a brief generator.</p>
<p>If you don't record calls or take consistent notes, fix that first. Add Fathom, Avoma, Gong, or Chorus depending on your budget and call volume. None of the brief tools work without raw material to synthesize.</p>
<p>If your team is under 10 reps with short cycles and the new owner usually already knows the deal, native HubSpot is enough. Don't pay for anything. Stop reading.</p>
<p>The most common mistake we see is teams buying a sales-to-CS tool when their actual problem is in-process owner changes, or vice versa. Same word, different jobs, different inputs, different receiving teams. Match the tool to the problem and most of the gap closes.</p>
<h2>What's actually missing from the category</h2>
<p>The unsolved problem is the integration layer. Every brief tool reads from somewhere (calls, notes, CRM properties, email threads). Every recording tool writes to somewhere. Right now those two layers don't compose well. Teams paying for both Gong and a brief generator end up with overlapping summaries that disagree on the facts. Teams paying for only one end up with half-context briefs.</p>
<p>The next version of this category, whoever ships it, is going to read across every meeting tool's output, every CRM activity, every email thread, and produce one coherent narrative for an inheriting owner. We're working on it. So is everyone else in this list. The team that ships it cleanly wins this category for the next five years.</p>
<p>Until then, pick the tool that solves your specific handoff motion. Layer it with a recording tool if you don't have one. Don't expect any single product to do all of it yet.</p>`;

const faq = [
  {
    q: "What's the best HubSpot app for sales handoffs in 2026?",
    a: "It depends on which handoff you mean. For in-process owner changes (AE leaves, territory shifts, promotions), Debrief is the most direct fit. For sales-to-CS at close-won, AskElephant generates structured handoff packages from call and CRM data. For post-sale onboarding execution, Arrows attaches a customer-facing plan to the deal. For small teams with short cycles, native HubSpot's activity timeline plus workflows is enough. Buying the wrong tool for the wrong handoff motion is the most common mistake teams make in this category.",
  },
  {
    q: "What's the difference between an in-process owner change and a sales-to-CS handoff?",
    a: "In-process owner changes happen mid-cycle: a deal that's still open gets reassigned to a new sales owner because the previous rep left, changed territory, or got promoted. The receiving team is sales. Sales-to-CS handoffs happen at close-won: the deal is over, onboarding starts, and the receiving team is customer success or implementation. Different triggers, different audiences, different data needs. Most apps in the category specialize in one or the other.",
  },
  {
    q: "Does HubSpot have a native sales handoff tool?",
    a: "Sort of. Every record has an activity timeline showing emails, calls, meetings, notes, and property changes. Workflows can fire on owner change to send notifications or copy fields onto handoff properties. Sales Hub Pro adds AI-generated email summaries and call summaries. None of this synthesizes a single brief; it surfaces the raw material and leaves the new owner to assemble. For small teams with short cycles, that's enough. For larger teams or longer cycles, it isn't.",
  },
  {
    q: "Can Gong, Fathom, or Avoma replace a dedicated handoff tool?",
    a: "No, but they're often paired with one. Gong, Fathom, Avoma, and Chorus record and summarize calls. They sync the output back into HubSpot as meeting and note objects. That's most of the raw material a handoff brief needs, but they don't synthesize across calls, pull in email threads, or read CRM property changes. A new rep inheriting 40 deals each carrying 15 calls is no better off than before, just with searchable transcripts. Use them for the recording layer; pair with Debrief or AskElephant for the synthesis layer.",
  },
  {
    q: "How does Debrief differ from AskElephant?",
    a: "Different primary motion. Debrief is built for in-process owner changes: a deal owner reassigns mid-cycle and the new owner needs an inheritance brief on the deal record. AskElephant is built for sales-to-CS at close-won: a deal closes won and the CS team needs a structured handoff package. The synthesis approach is similar; the trigger and the receiving team are different. Teams with both motions can run both apps without overlap.",
  },
  {
    q: "What's the cheapest way to handle sales handoffs in HubSpot?",
    a: "Native HubSpot. The activity timeline is free, workflows are free on most paid tiers, and AI-generated email and call summaries come with Sales Hub Pro. If your team is under 10 reps with short deal cycles and the new owner already knows the deal through team standups, you don't need to pay for a third-party app. Cheap-but-not-free option: AskElephant has a $99/month Unlimited tier (plus a lower Essential tier with pricing not shown publicly) for sales-to-CS, or Debrief starting at $19/portal/month on the Starter tier for in-process owner changes (free during the marketplace beta).",
  },
  {
    q: "Do I need a handoff tool if my reps already record calls?",
    a: "Probably yes. Recording is the input layer; synthesis is the output layer. A handoff brief reads what the recording tool wrote and turns it into a single narrative for the inheriting owner. Without the synthesis step, the new rep is searching transcripts manually instead of reading a one-page summary. The two layers compose: pair Gong, Avoma, Fathom, or Chorus with Debrief or AskElephant.",
  },
  {
    q: "What's missing from the HubSpot handoff app category?",
    a: "The integration layer. Brief tools read from somewhere; recording tools write to somewhere; the two don't compose cleanly yet. Teams paying for both end up with overlapping summaries that disagree on the facts. Teams paying for only one end up with half-context briefs. Whoever ships a tool that reads across every meeting tool's output, every CRM activity, and every email thread, and produces one coherent narrative for the inheriting owner, wins the category.",
  },
];

const comparisonTable = {
  headers: [
    "Capability",
    "Native HubSpot",
    "Debrief",
    "AskElephant",
    "Arrows",
    "Call/meeting tools",
  ],
  rows: [
    {
      dimension: "Primary handoff motion",
      cells: [
        "All, no synthesis",
        "In-process owner change",
        "Sales-to-CS at close-won",
        "Post-close onboarding execution",
        "Recording context, no synthesis",
      ],
    },
    {
      dimension: "Generates a synthesized brief",
      cells: [
        "No",
        "Yes",
        "Yes",
        "No",
        "Per-call summaries only",
      ],
    },
    {
      dimension: "Reads call recordings",
      cells: [
        "Activity timeline only",
        "Indirectly, via what tools wrote to HubSpot",
        "Yes, native ingestion",
        "No",
        "Yes, primary input",
      ],
    },
    {
      dimension: "Receiving team",
      cells: [
        "Whoever inherits the deal",
        "Inheriting deal owner",
        "CS or onboarding",
        "CS, onboarding, and the customer",
        "Anyone with access",
      ],
    },
    {
      dimension: "Where you see it",
      cells: [
        "Activity timeline on the record",
        "CRM card on the deal",
        "Structured doc inside HubSpot",
        "Onboarding plan attached to the deal",
        "Meeting or note object on the record",
      ],
    },
    {
      dimension: "Total cost",
      cells: [
        "Free, AI summaries on Sales Hub Pro",
        "Tiered $19 to $149/portal/mo post-beta, free during beta",
        "$99/mo Unlimited tier, lower Essential tier with pricing not public",
        "Contact sales",
        "Varies by tool",
      ],
    },
  ],
};

async function main() {
  // Em/en dash sweep on every string field before write. The hard rule
  // is zero U+2014 and U+2013 anywhere in the payload.
  const allText: string[] = [
    contentHtml,
    ...faq.flatMap((f) => [f.q, f.a]),
    ...comparisonTable.headers,
    ...comparisonTable.rows.flatMap((r) => [r.dimension, ...r.cells]),
  ];
  const offenders: string[] = [];
  for (const s of allText) {
    if (s.includes("—")) offenders.push(`em dash in: ${s.slice(0, 60)}`);
    if (s.includes("–")) offenders.push(`en dash in: ${s.slice(0, 60)}`);
  }
  if (offenders.length > 0) {
    console.error("[seed] em/en dash sweep failed:");
    for (const o of offenders) console.error("  " + o);
    process.exit(1);
  }
  console.log("[seed] em/en dash sweep passed (0 occurrences)");

  const existing = await getPost("article", SLUG);
  const now = Date.now();

  const post: Post = {
    slug: SLUG,
    title: "Best HubSpot apps for sales handoffs in 2026",
    description:
      "Sales handoffs in HubSpot are two different problems jammed under one phrase: in-process owner changes and post-close handoffs to CS. Here are the real options for both, in 2026.",
    contentHtml,
    status: "draft",
    coverImageUrl: undefined,
    targetKeyword: "hubspot sales handoff app",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    publishedAt: undefined,
    authorAccountId: existing?.authorAccountId ?? "system-seed",
    faq,
    comparisonTable,
    relatedProducts: ["debrief"],
  };

  if (existing) {
    console.log(`[seed] article already exists at slug "${SLUG}", overwriting`);
  } else {
    console.log(`[seed] creating new draft article at slug "${SLUG}"`);
  }

  await savePost("article", post);

  // Read it back and verify the optional fields round-tripped.
  const read = await getPost("article", SLUG);
  if (!read) {
    console.error("[seed] read-back returned null after save");
    process.exit(1);
  }

  let failed = 0;
  function check(label: string, ok: boolean) {
    if (ok) console.log(`  ok   ${label}`);
    else {
      console.log(`  FAIL ${label}`);
      failed++;
    }
  }

  check("title", read.title === post.title);
  check("description", read.description === post.description);
  check("contentHtml", read.contentHtml === post.contentHtml);
  check("status is draft", read.status === "draft");
  check("publishedAt is undefined", read.publishedAt === undefined);
  check("targetKeyword", read.targetKeyword === post.targetKeyword);
  check("faq length 8", Array.isArray(read.faq) && read.faq.length === 8);
  check(
    "comparisonTable headers length 6",
    !!read.comparisonTable && read.comparisonTable.headers.length === 6,
  );
  check(
    "comparisonTable rows length 6",
    !!read.comparisonTable && read.comparisonTable.rows.length === 6,
  );
  check(
    "comparisonTable each row has 5 cells",
    !!read.comparisonTable &&
      read.comparisonTable.rows.every((r) => r.cells.length === 5),
  );
  check(
    "relatedProducts is [debrief]",
    Array.isArray(read.relatedProducts) &&
      read.relatedProducts.length === 1 &&
      read.relatedProducts[0] === "debrief",
  );

  if (failed > 0) {
    console.error(`[seed] ${failed} verification check(s) failed`);
    process.exit(1);
  }
  console.log(`[seed] all verification checks passed`);
  console.log(
    `[seed] preview at /admin/content/articles/${SLUG}/preview (status: draft)`,
  );
}

main().catch((err) => {
  console.error("[seed] unhandled error:", err);
  process.exit(1);
});
