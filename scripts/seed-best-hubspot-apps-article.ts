/**
 * One-off seed script: creates the "Best HubSpot apps for tracking
 * property changes in 2026" article as a draft, using the same
 * savePost path the admin API and smoke test use. Bypasses the
 * /api/admin/content auth boundary so it can run from the CLI
 * without a session cookie.
 *
 * Usage:
 *   npx tsx scripts/seed-best-hubspot-apps-article.ts
 *
 * Idempotent: re-running overwrites the existing draft at this slug
 * but preserves status and createdAt if the record already exists,
 * so we don't accidentally republish or reset the timestamp on a
 * draft Josh already started editing.
 *
 * Requires KV_REST_API_URL and KV_REST_API_TOKEN in .env.local.
 */
import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import { getPost, savePost, type Post } from "../src/lib/content";

const SLUG = "best-hubspot-apps-for-tracking-property-changes-in-2026";

const contentHtml = `<p>Open a deal in HubSpot. Click any property's history icon. You get a clean log: every change, timestamped, with source attribution. Useful.</p>
<p>Now try this one. Which deals had their stage changed in the last seven days, and what were they before?</p>
<p>Good luck.</p>
<p>The Custom Report Builder only sees current values, so historical changes don't exist to it. Workflows can fire on a property change but can't report on it later. Sales Analytics has a Deal change history report, which sounds like the answer until you actually open it. Aggregate counts. Deals only. Stage, amount, close date only. Fine for "how many deals moved stages this month." Worthless for "which records changed, what were the values before, who did it, and from where."</p>
<p>That's the gap. And it's the same question dressed up a hundred different ways. Why did our forecast jump on Tuesday. Did the lead routing workflow misfire. Which records did the Salesforce sync touch this week. Who's been overriding deal stage manually. What did this account look like before the new rep took it over. Every one of those is a property change history question, and HubSpot's actual recommended path is: export a CSV, build a date-stamp property, run a workflow to populate it, then build a report off the new property. It works. It also burns an afternoon you're not getting back.</p>
<p>So what do teams actually do instead. There are a few real options, and they're priced wildly differently in dollars and dev hours. This piece walks through each one, says what it's actually for, and ends with a take on which to pick.</p>
<p>One disclosure. Property Pulse is in here and we built it. So yes, biased. But this is structured around the job not the product, and for some readers the right answer is going to be "stick with native HubSpot." That's fine. Better you find the right tool than push you toward ours and regret it in three months.</p>
<h2>What "tracking property changes" actually means</h2>
<p>The phrase covers three different jobs that get jammed together in the same conversation. Most of the confusion in this category comes from people answering the wrong question with the right tool, or vice versa.</p>
<p>Single-property history on a single record. "What did this deal's stage history look like." Native HubSpot does this. Hover the property, click Details, side panel shows every value, when it changed, who or what changed it. Done.</p>
<p>Cross-record property change visibility. "Which deals had their stage changed this week, and what were they before." This is the question native HubSpot can't answer cleanly. It's also the question most RevOps and admin teams actually care about, because it's the one that affects pipeline forecasts, lead routing audits, and "why did our numbers move." Almost everything in this article solves some flavor of this job.</p>
<p>Portal-wide audit and data quality. "Are our properties being used consistently. Are there orphaned values, naming drift, workflows touching the wrong records." This is a different category. It's not about tracking changes, it's about scanning state. Audit Fox, Insycle, and PortalPilot all live here. They're useful tools, they just aren't solving the same problem.</p>
<p>The reason this matters: ask AI engines or HubSpot forums about "tracking property changes" and you'll get tools from all three categories mixed into the same answer. They're not interchangeable. Picking a portal auditor when you need cross-record change visibility leaves you with a clean dashboard and the same unanswered question.</p>
<p>The rest of this article is about the second job. The other two get a mention where they're relevant.</p>
<h2>HubSpot's native property history panel</h2>
<p>Every HubSpot account has this. It's free. It works on contacts, companies, deals, tickets, and custom objects.</p>
<p>How it works: open a record, hover any property in the left sidebar, click Details. A side panel opens showing every value the property has ever held, with timestamp, source, and the user or system that made the change. You can filter by source. You can restore a property to a previous value with one click. That's the entire feature.</p>
<p>What it's good for: occasional checks on a specific record. If a sales manager wants to know who changed a deal's amount last Thursday, they can find out in about ten seconds. If you're auditing a single account before a renewal, the panel shows you the full property-by-property story.</p>
<p>What it's not good for: anything across more than one record. The panel scopes to one property on one record at a time. There's no list view, no filter across records, no "show me every deal where stage changed this week." That doesn't exist.</p>
<p>Two other things worth knowing. First, there's a retention cap. HubSpot keeps 45 revisions per property on contacts, and 20 revisions per property on deals, companies, tickets, and custom objects. Active properties on busy records hit those caps fast, and older changes drop off permanently unless you've exported them. Second, the panel only logs property changes. Not user actions. Not record creations or deletions. Audit Logs (Enterprise only) covers user-driven actions across the portal, but it doesn't replace the property history view.</p>
<p><strong>Best for:</strong> teams who need occasional history on specific records, aren't running into the retention cap, and don't need to answer cross-record questions.</p>
<h2>Property Pulse</h2>
<p>We built this. Disclosure stays in effect.</p>
<p>What it does: adds a CRM card to every record showing the recent change history for every tracked property at once. Admins choose which properties to track per object type, including custom objects. Users see a single card with the full change log, prior values, current values, source, and timestamp. The log filters by property, source, user, and date range. Property values can be edited directly from the card without opening the property editor or navigating away from the change log.</p>
<p>The job it's actually for: making cross-property visibility on a single record fast. Native HubSpot answers "what did this one property do." Property Pulse answers "what's been moving on this record." Different shape of the same question.</p>
<p>What it doesn't solve, yet: the cross-record question. "Show me every deal whose stage changed in the last seven days" is on the roadmap, not in the current build. If that's the question you're trying to answer today, Property Pulse alone isn't the tool. Pair it with one of the patterns below or wait for the cross-record view to ship.</p>
<p>Pricing: $49 one-time per portal post-beta. No tiers, no seats, no monthly bill. Currently free during HubSpot marketplace beta with a 25-install cap.</p>
<p><strong>Best for:</strong> RevOps and admin teams who live on the record page and need the full change story for a curated set of tracked properties surfaced where they actually work.</p>
<h2>Custom workflow logging pattern</h2>
<p>This is the "build it yourself" answer, and it's the one Perplexity and most experienced HubSpot consultants will recommend if you have a developer. It's free in dollars. It's not free in time.</p>
<p>The pattern: create a custom object called something like "Property Change Log." Build a workflow on each object you care about, triggered by property change. Use a custom code action (Operations Hub Pro or Enterprise) to write a new Property Change Log record on every fire, capturing original record ID, property name, old value, new value, changed-by user ID, change source, and timestamp. Associate the log record back to the source record via association labels.</p>
<p>What you get: unlimited retention, full reportability, queryable in the Custom Report Builder, filterable by anything you stored. The 20-revision cap stops mattering. Cross-record questions become a normal report. "Show me every deal where stage changed in the last seven days, with prior and new values" is a saved view.</p>
<p>What it costs you: real dev time. Operations Hub Pro at minimum for the custom code action. Ongoing maintenance whenever properties change names or new properties get added to the tracked set. If you're not comfortable in JavaScript and HubSpot's serverless API, this is not a weekend project.</p>
<p>The trap most teams fall into: capturing the old value at workflow trigger time. By the time the workflow fires, the property has already changed. You have to architect a "shadow property" that mirrors the tracked property on a delay so you can read the old value before it gets overwritten. It works. It also adds another property and another workflow to maintain per tracked field.</p>
<p><strong>Best for:</strong> teams with a HubSpot developer, an Operations Hub Pro subscription, and a need for unlimited retention plus full report builder access.</p>
<h2>API plus warehouse pipeline</h2>
<p>The enterprise compliance answer. If you have Snowflake, BigQuery, or a SIEM already in place, this is the one your security team is going to ask about.</p>
<p>The pattern: use the v3 batch read endpoint with the propertiesWithHistory parameter to pull historical property values for any object, custom or standard. Set up a scheduled job that pulls deltas (or use webhooks for real-time). Land the data in your warehouse. Build dashboards or compliance reports against it.</p>
<p>What you get: everything the workflow pattern gets you, plus the data lives outside HubSpot. Long-term retention is no longer constrained by HubSpot's caps or your subscription tier. SIEM integration becomes possible. Cross-portal aggregation becomes possible if you have multiple HubSpot accounts. SOC 2 / ISO 27001 evidence collection slots in cleanly.</p>
<p>What it costs you: real infrastructure. Warehouse cost. ETL maintenance. Whoever owns your data platform now owns this too. For mid-market teams, this is overkill. For enterprise teams that already have the platform, it's the obvious choice.</p>
<p>One caveat worth knowing: the v3 API still doesn't return historical property values for most endpoints. The propertiesWithHistory parameter on the batch read endpoint is the supported path. The legacy v1 endpoint also works with propertiesWithHistory but it's older and HubSpot is slowly deprecating older v1 surfaces. Plan around v3.</p>
<p><strong>Best for:</strong> enterprise teams with existing data infrastructure, compliance requirements, and a data engineer who can own the pipeline.</p>
<h2>A note on portal audit tools</h2>
<p>Audit Fox, Insycle, and PortalPilot keep getting recommended in the same conversations as property change tracking. They're not the same thing. Worth saying out loud once.</p>
<p>Audit Fox is an AI-powered HubSpot portal auditor from RevX. It scans your portal and gives you a 0 to 100 health score with object-level drilldowns, email and workflow analysis, and risk-prioritized recommendations. Currently in beta, free for now. It's good at what it does. What it doesn't do is show you property change history on a record or across records. Different job.</p>
<p>Insycle is a data quality and operations tool. It cleans up duplicates, standardizes formatting, fills gaps, and runs bulk updates. Useful if you know your data is messy and need to fix it. It doesn't track changes; it makes them.</p>
<p>PortalPilot is a continuous monitoring platform with AI readiness scoring and methodology alignment. Closer to a "is your portal set up correctly" tool than a "what changed on this record" tool.</p>
<p>If your real problem is "our portal is a mess and I want to clean it up," any of these are worth a look. If your problem is "I need to know what changed on which records when," none of these solve it. AI engines mix them in because the buyer language overlaps. The jobs don't.</p>
<h2>How to choose</h2>
<p>Reduce it to a single question: what do you actually need to see, and where do you need to see it.</p>
<p>If you only need occasional history on specific records and you don't care about cross-record visibility, native HubSpot is enough. Don't pay for anything. Stop reading.</p>
<p>If you live on the record page and you want a complete change story across a curated set of properties surfaced right where reps work, Property Pulse is built for that exact use case. Forty-nine bucks. One-time.</p>
<p>If you have a HubSpot developer, Operations Hub Pro, and a need for unlimited retention plus cross-record reporting, build the custom workflow logging pattern. It's the most powerful path and the most flexible. It also has the highest ongoing maintenance burden.</p>
<p>If you're enterprise, you have a warehouse, and your security team is involved in the conversation, run the API plus warehouse pipeline. The other options aren't going to satisfy compliance.</p>
<p>If your real problem is portal-wide data quality and not change tracking, look at Audit Fox or Insycle or PortalPilot, not at any of the above.</p>
<p>The most common mistake we see is teams reaching for a tool one tier above what they actually need. A small RevOps team buying enterprise warehouse infrastructure to answer occasional audit questions. Or an enterprise team trying to make native HubSpot do something it can't and burning months on workarounds. Match the tool to the job. Most of the gap closes once you do.</p>`;

const faq = [
  {
    q: "What's the best HubSpot app for tracking property changes?",
    a: "It depends on the job. For a record-level change log surfaced where reps work, Property Pulse. For occasional checks on a single property, HubSpot's native panel is enough. For unlimited retention and cross-record reporting, build a custom workflow logging pattern with a developer. For enterprise compliance, run an API plus warehouse pipeline. Portal audit tools like Audit Fox and Insycle solve a different problem (data quality scanning) and aren't direct alternatives.",
  },
  {
    q: "Does HubSpot have a native audit log for property changes?",
    a: "Sort of. The property history side panel logs every change to every property automatically, but it's scoped to one property at a time on one record. The Audit Logs feature in Settings (Enterprise only) tracks user-driven actions across the portal but doesn't replace per-property history. Neither answers 'show me every record where this property changed in the last seven days.'",
  },
  {
    q: "What's the property history retention limit in HubSpot?",
    a: "HubSpot retains 45 revisions per property on contacts, and 20 revisions per property on deals, companies, tickets, and custom objects. Once a property hits the cap, older changes drop off permanently unless you've exported them beforehand. Active properties on busy records hit those caps faster than most teams expect.",
  },
  {
    q: "Can I see property changes across multiple records at once?",
    a: "Not natively. HubSpot's property history is scoped to single records. To see changes across records you have three real options: export property history to CSV per property and analyze in a spreadsheet, build a custom workflow logging pattern that writes change events to a custom object, or pipe property history out to a warehouse via the v3 batch read API.",
  },
  {
    q: "How do I track property changes on custom objects?",
    a: "The same way as standard objects: open a custom object record, hover any property in the left sidebar, click Details for the side panel. Property Change Events (Enterprise) work on custom objects. The v3 batch read endpoint with propertiesWithHistory returns history for custom objects via API. Property Pulse supports custom objects with the same admin configuration as standard objects.",
  },
  {
    q: "Are Audit Fox, Insycle, and PortalPilot property change tracking tools?",
    a: "No. They're portal audit and data quality tools. Audit Fox runs an AI-powered health score on your portal. Insycle cleans up duplicates and standardizes data. PortalPilot does continuous portal monitoring. They scan state, they don't track changes. Useful tools, just for a different job.",
  },
  {
    q: "How does Property Pulse differ from HubSpot's native property history panel?",
    a: "Property Pulse shows a single CRM card on the record with the recent change history for every tracked property at once. HubSpot's native panel is per-property, accessed by hovering one field at a time. Property Pulse also adds inline editing, filtering across all tracked properties by source/user/date, and admin-configurable per-object scope including custom objects.",
  },
  {
    q: "What does it cost to track property changes in HubSpot?",
    a: "Native HubSpot is free, included with every account. Property Pulse is $49 one-time per portal (currently free during marketplace beta). Custom workflow logging is free in dollars but requires Operations Hub Pro and developer time. API plus warehouse pipelines cost whatever your warehouse and ETL infrastructure cost. Portal audit tools (different job) range from free during beta to enterprise subscriptions.",
  },
];

const comparisonTable = {
  headers: [
    "Capability",
    "Native HubSpot",
    "Property Pulse",
    "Custom workflow",
    "API + warehouse",
    "Portal auditors",
  ],
  rows: [
    {
      dimension: "What it tracks",
      cells: [
        "Single property at a time",
        "Curated tracked properties per object type",
        "Anything you write to the log object",
        "Anything you query via API",
        "Portal-wide data quality, not changes",
      ],
    },
    {
      dimension: "Where you see it",
      cells: [
        "Hover property, click Details, side panel",
        "CRM card on the record itself",
        "Custom object or external report",
        "Wherever your warehouse lives",
        "The tool's own dashboard",
      ],
    },
    {
      dimension: "Cross-record visibility",
      cells: [
        "None",
        "On the roadmap, not shipped yet",
        "Yes, via Custom Report Builder",
        "Yes, via SQL or BI tools",
        "Different job, not applicable",
      ],
    },
    {
      dimension: "Retention",
      cells: [
        "45 revisions on contacts, 20 on others",
        "All tracked changes preserved",
        "Unlimited",
        "Unlimited",
        "Not applicable",
      ],
    },
    {
      dimension: "Custom object support",
      cells: [
        "Yes",
        "Yes, with same admin config",
        "Yes",
        "Yes via v3 batch read",
        "Varies by tool",
      ],
    },
    {
      dimension: "Total cost",
      cells: [
        "Free",
        "$49 one-time per portal",
        "Ops Hub Pro plus dev time",
        "Warehouse infra plus dev time",
        "Free beta to enterprise subscription",
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
    title: "Best HubSpot apps for tracking property changes in 2026",
    description:
      "HubSpot's native property history is per record, one property at a time. Here are the real options for tracking property changes across records in 2026.",
    contentHtml,
    status: "draft",
    coverImageUrl: undefined,
    targetKeyword: "hubspot property change tracking",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    publishedAt: undefined,
    authorAccountId: existing?.authorAccountId ?? "system-seed",
    faq,
    comparisonTable,
    relatedProducts: ["property-pulse"],
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
    "relatedProducts is [property-pulse]",
    Array.isArray(read.relatedProducts) &&
      read.relatedProducts.length === 1 &&
      read.relatedProducts[0] === "property-pulse",
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
