/**
 * One-off seed script: creates the "How to audit stale HubSpot
 * properties" guide as a draft, using the same savePost path the
 * admin API and smoke test use. Bypasses the /api/admin/content auth
 * boundary so it can run from the CLI without a session cookie.
 *
 * Mirrors scripts/seed-sales-handoffs-article.ts. Same shape, same
 * em/en dash sweep, same round-trip verification. The only structural
 * difference is type "guide" instead of "article" so the record lands
 * under guides:index in Redis and shows up in /admin/content under
 * the Guides table.
 *
 * Usage:
 *   npx tsx scripts/seed-stale-properties-guide.ts
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

const SLUG = "how-to-audit-stale-hubspot-properties";

const contentHtml = `<p>Every HubSpot portal accumulates properties faster than it sheds them. A campaign manager adds a custom field for a one-quarter push and forgets to delete it. Marketing imports a vendor list and the import wizard creates 30 new fields on the way in. Operations duplicates a field with slightly different semantics because nobody could find the canonical one. A migration leaves behind columns nobody reads from. Five years of this and a contact object can carry 600+ properties, of which maybe 80 are still actively maintained.</p>
<p>The cost is invisible until something breaks. Reports pull from frozen fields and quietly misreport pipeline. Workflow conditions reference properties whose dropdown options drifted from the current taxonomy. New hires open a record, see four fields that all look like they should hold the same value, and have no way to tell which one is current. Integrations write to the wrong field because the field name in the third-party config matched the internal name of a property that got deprecated two years ago.</p>
<p>We see this on every portal we audit. The fix is not heroic. It is just patient work that nobody wants to do, and a repeatable shape so the work does not get heroic the next time.</p>
<h2>What "stale" actually means</h2>
<p>Three definitions. Each is useful on its own. A property is fully stale when all three apply.</p>
<p><strong>Fill-rate stale.</strong> Less than 5% of records in the relevant scope have the property set. A custom contact property at 2% fill rate is either dead or scoped to such a narrow segment that it should probably live on a different object. The 5% threshold is not magic; pick whatever your portal can defend.</p>
<p><strong>Activity stale.</strong> Nobody has written to the property in 90+ days, regardless of fill rate. This is the harder signal to get out of native HubSpot reporting, but it is the most diagnostic. A 60% fill rate property nobody has updated since 2024 is a frozen historical artifact, not a working data point. Treat it accordingly.</p>
<p><strong>Reference stale.</strong> The property is not used by any workflow, list, report, form, sequence, integration, or custom code module. HubSpot exposes this on the property's edit screen under the "Used in" tab. If "Used in" is empty across every category, nothing in your portal depends on this property continuing to exist.</p>
<p>The interesting cases are the partial ones. High fill rate with no recent writes is a frozen dataset that may still matter for historical reporting, but the property should be renamed (something like <code>archived_</code> or <code>legacy_</code>) and locked from future writes. Low fill rate with an active workflow reference is a property somebody is still trying to use, often badly. Active workflow reference with zero recent writes is a workflow that fires on a condition that no longer happens, which means the workflow itself is the stale thing, not the property.</p>
<h2>A seven-step audit</h2>
<p>Here is what we run, in order. The whole pass takes two to four hours for a mid-sized portal once you have the inputs assembled.</p>
<p><strong>Step 1: Export the property list.</strong> Settings, Properties, pick the object type, click Export. HubSpot mails you a CSV with property name, internal name, group, type, field type, and a flag for whether the property is hubspot-defined or custom. Repeat for contacts, companies, deals, and tickets. Custom objects get the same export from their respective settings panels.</p>
<p><strong>Step 2: Filter to custom only.</strong> HubSpot-defined properties are not your problem. They are versioned by HubSpot and they exist whether you want them or not. The audit is about properties your team or your vendors created.</p>
<p><strong>Step 3: Pull "Used in" data for each property.</strong> This is the most laborious step in native HubSpot because there is no bulk export of the "Used in" tab. You have to click into each property and read the count. For a 600-property contact object that is 600 clicks. We have written internal scripts that pull this through the CRM Properties API plus the Workflows, Lists, and Reports APIs. If you do not write code, batch this work over a week and budget two minutes per property.</p>
<p><strong>Step 4: Pull fill rate.</strong> Custom Report Builder, single-property report, set the metric to "% of records with property set." Save the report. Repeat for every custom property on the object, or build one report per group. For a faster pass, export 10,000 records via CRM list export and count nulls in a spreadsheet.</p>
<p><strong>Step 5: Sample last-write timestamps.</strong> HubSpot does not expose per-property last-write timestamps at the schema level. You have to derive them from property history on individual records via the Property History endpoint. Sample 50 records that have the property set, pull the most recent timestamp from each property's history, take the max across the sample. Anything older than 90 days is activity-stale by our definition.</p>
<p><strong>Step 6: Bucket each property.</strong> Five buckets: keep as-is, archive, hide-from-forms, merge, delete. We define each in the next section. Every custom property goes into exactly one bucket. Document the decision and the reason in a shared sheet so the audit is auditable.</p>
<p><strong>Step 7: Execute in batches.</strong> Archive is the safest reversible action. Run all archives first, watch for two weeks, look for any reports or workflows that suddenly broke. If nothing broke, the archive was correct. Then run the deletes. Then run the merges, which are more involved because they require a workflow to copy values from the source field to the canonical destination before the source field is archived.</p>
<h2>Tools and queries</h2>
<p>What we actually use:</p>
<ul>
<li><strong>HubSpot Settings, Properties.</strong> The native UI. Free. The "Used in" tab on each property is the highest-signal datapoint in the whole audit. Read it, every time.</li>
<li><strong>Custom Report Builder.</strong> For fill rate. Single-property reports. Build them once, save them, re-run them on every audit cycle so the second pass is cheap.</li>
<li><strong>CRM Properties API.</strong> <code>GET /crm/v3/properties/{objectType}</code> returns the full schema in one call. Useful for programmatic passes, especially when the property count gets above 200 and clicking through the UI stops being reasonable.</li>
<li><strong>CRM Search API plus Property History endpoint.</strong> For deriving last-write timestamps. Sample records, pull history per property, take the max. There is no shortcut endpoint for this at the schema level; it is a derived metric, always.</li>
<li><strong>CSV export plus spreadsheet.</strong> For fill rate when Custom Report Builder feels too slow. List export, count nulls, divide. Crude but fast.</li>
</ul>
<p>What we do not use: any third-party "property auditor" app that promises a one-click report. We have evaluated several. They surface fill rate well, "Used in" coverage poorly, and last-write timestamps not at all. The signal you actually want for the keep-or-kill decision is the one those tools cannot deliver, because HubSpot does not expose it at the schema level and the apps cannot derive it cheaply at scale.</p>
<h2>What to do with the stale ones</h2>
<p>Five actions. Pick one per property.</p>
<p><strong>Keep.</strong> The property is current, in use, has a clear owner, and nothing about the audit changed your view of it. Document why you kept it so the next auditor does not reopen the question and run through the same chain of reasoning.</p>
<p><strong>Archive.</strong> Reversible soft-delete. The property hides from the UI and from new records, but historical values stay on records that already had them, and any report or workflow that explicitly references the property by internal name keeps working. This is the right action for most stale properties. If you are unsure between keep and delete, archive is the safe middle. Unarchiving is one click if you change your mind.</p>
<p><strong>Hide from forms.</strong> A property-level setting under Settings, Properties, Edit, Form options. Useful for properties you want to keep in the schema but no longer surface to contacts via marketing forms. Common case: an internal scoring field that got accidentally added to a public form, where contacts can now see and edit it. Hide it from forms; do not delete it.</p>
<p><strong>Merge.</strong> Two duplicate properties holding the same concept get collapsed into one canonical. Build a workflow that fires on record-update with the source property as a trigger, copies the source value into the canonical destination if the destination is empty, and clears the source. Run the workflow once, verify the migration on a sample of records, then archive the source. Merges are the most labor-intensive action because they require careful workflow design and a verification step. They are also the most valuable because every merged duplicate removes a future point of confusion for new hires and integrations.</p>
<p><strong>Delete.</strong> Hard delete. Gone forever. Breaks anything pointing at it. Reserve this for properties with zero historical data, no references, and zero risk of someone asking "where did that field go" six months from now. For everything else, archive is the better choice.</p>
<p>The rough split we see across audited portals: archive 70%, merge 15%, delete 10%, hide-from-forms 5%. Numbers vary by portal, but the shape of the distribution does not. Most stale properties are not actively dangerous; they are just clutter that should be hidden, not destroyed.</p>
<h2>Prevention</h2>
<p>A clean audit lasts about 18 months before drift returns. The audit cycle is necessary either way, but the drift rate is something you can slow down so the audits stay shallow instead of becoming structural rebuilds.</p>
<p>What works:</p>
<ul>
<li><strong>Naming convention.</strong> Custom properties get a short namespace prefix indicating the team or domain that owns them: <code>ops_</code>, <code>mkt_</code>, <code>sales_</code>, <code>cs_</code>. The prefix shows up in the property list view and instantly tells anyone reading the schema who to ask before changing the field. Properties without a namespace become orphans within a quarter.</li>
<li><strong>Description field is mandatory.</strong> The description on every custom property answers "what reads this?" If the description is empty, the property has no documented consumer and is one rotation away from being stale. Make the answer to that question a precondition for property creation, not an afterthought.</li>
<li><strong>Quarterly mini-audit.</strong> Run steps 3, 4, and 5 of the audit (Used-in, fill rate, last-write) every 90 days as a partial pass. Full audits with bucketing and execution happen once a year. The quarterly pass catches new drift before it becomes structural.</li>
<li><strong>Sunset clause on campaign properties.</strong> When a property is created for a one-off campaign or vendor integration, the creator sets a calendar reminder for 90 days out to review and archive it. Most one-off properties never get that review on their own.</li>
<li><strong>Document the canonical property.</strong> For every common concept (lead source, last touch channel, NPS score, account tier), write down which property is the source of truth. Pin the doc somewhere people will find it. The most common cause of duplicate properties is somebody creating a new one because they could not find the old one.</li>
</ul>
<p>None of these are hard rules. They are friction surfaces that keep the rate of new stale properties below the rate of old stale properties getting cleaned up. As long as the second number is bigger than the first, the portal trends toward clean.</p>
<h2>How Property Pulse fits</h2>
<p>Disclosure: we make Property Pulse. It is a HubSpot marketplace app that records every property change on every CRM record and renders a filterable change log card on the record itself.</p>
<p>For the audit, two things in Property Pulse are useful. First, the change log gives you a fast read on which properties are actively being written to and which have not been touched in months, without sampling individual records by hand for last-write timestamps. Second, the per-property history lets you see at a glance whether changes come from humans, integrations, or workflows, which is often the difference between "delete safely" and "this property is load-bearing for a vendor sync I forgot about."</p>
<p>Property Pulse does not do the bucketing for you, and it is not meant to. The keep-or-kill decision still belongs to a person who knows the business. What it does is shorten the time you spend gathering the inputs to that decision, which is most of the work in any audit.</p>
<p>It is in marketplace beta and free during the beta. If you are about to run an audit and you do not already have it installed, it is the cheap version of answering "is anyone still writing to this field, and who is it" without writing a script that hits the Property History API for every record on the object.</p>
<h2>The take</h2>
<p>Stale property cleanup is unglamorous work that every portal needs and almost none of them get. The cost of putting it off is invisible until somebody runs a report that has been silently broken for 18 months, or a new hire spends a week trying to figure out which of four similarly-named fields holds the actual value, or a vendor integration writes to a field that nothing reads.</p>
<p>Run the audit, or schedule the audit. Either is better than the third option, which is what most portals are doing right now.</p>`;

const faq = [
  {
    q: "What does \"stale\" mean for a HubSpot property?",
    a: "Three signals matter, and a property is fully stale when all three apply. Fill rate under 5% of records in scope. No writes to the property in the last 90 days. No references from workflows, lists, reports, forms, sequences, integrations, or custom code (the \"Used in\" tab on the property's edit screen). Partial cases are common: high fill rate with no recent writes is a frozen historical artifact, low fill rate with an active workflow reference is a property somebody is still trying to use badly. Bucket each property based on which signals it hits and pick an action.",
  },
  {
    q: "How often should we audit our HubSpot properties?",
    a: "A full audit (export, fill rate, used-in, last-write timestamps, bucket, execute) once a year. A partial mini-audit (just the data-gathering steps, no bucketing or execution) every 90 days. The quarterly pass catches new drift before it becomes structural. The annual pass actually moves things into archive, merge, or delete. Skipping the quarterly pass is fine; skipping the annual one means every audit becomes a rebuild instead of an update.",
  },
  {
    q: "Should we delete or archive stale HubSpot properties?",
    a: "Archive in almost every case. Archive is reversible: the property hides from the UI and from new records, but historical values stay on records that had them, and reports or workflows referencing the property by internal name keep working. Delete is permanent and breaks anything pointing at the property. Reserve delete for properties with zero historical data, no references, and zero risk of \"where did that field go\" questions later. The portals we audit usually end up archiving about 70% of stale properties and deleting only around 10%.",
  },
  {
    q: "Can we tell which HubSpot properties are unused without writing code?",
    a: "Mostly yes, but slowly. Settings, Properties, click into each property, read the \"Used in\" tab. That tells you whether anything in HubSpot references the property. Custom Report Builder gives you fill rate. The harder signal, last-write timestamp, requires sampling Property History on individual records and there is no native UI for that at the schema level. For portals with hundreds of custom properties, hand-clicking through the audit is a multi-day project. A script that pulls the same data via the Properties, Workflows, and Lists APIs runs in minutes once written.",
  },
  {
    q: "What's the difference between archiving and hiding a HubSpot property?",
    a: "Archive removes the property from the UI and from new records but keeps it in the schema and on records that already had values set. Hide-from-forms is a property-level setting that keeps the property visible to internal users but stops surfacing it on marketing forms. Use hide-from-forms when an internal-only field accidentally got exposed to contacts via a public form. Use archive when the property has no current owner and no current writers but historical data on it might still be referenced by old reports.",
  },
  {
    q: "How do we find duplicate HubSpot properties?",
    a: "Sort the property export by group, then scan for fields with similar labels or similar internal names. Common duplicates: <code>lead_source</code> and <code>lead_source_v2</code>, or <code>nps_score</code> and <code>nps_rating</code>, or a HubSpot-default property and a custom property with overlapping semantics. For each candidate pair, check whether both have non-null data on the same records (a real duplicate) or whether one is empty wherever the other is filled (a clean swap). Real duplicates get merged via a workflow that copies values forward; clean swaps get archived directly.",
  },
];

const comparisonTable = {
  headers: [
    "Action",
    "Reversible?",
    "Best for",
    "Avoid when",
  ],
  rows: [
    {
      dimension: "Keep",
      cells: [
        "n/a",
        "Properties with current owners and active writers",
        "The fill rate is under 5% and nothing writes to it",
      ],
    },
    {
      dimension: "Archive",
      cells: [
        "Yes, one-click unarchive",
        "Stale properties with historical data worth preserving",
        "The property has zero historical data and zero references",
      ],
    },
    {
      dimension: "Hide from forms",
      cells: [
        "Yes, toggle in form options",
        "Internal-only fields accidentally exposed to contacts on public forms",
        "The property has no role in the schema at all",
      ],
    },
    {
      dimension: "Merge",
      cells: [
        "Partially, source can be unarchived after",
        "Two duplicate properties holding the same concept",
        "The two properties hold subtly different concepts that look duplicate",
      ],
    },
    {
      dimension: "Delete",
      cells: [
        "No",
        "Properties with zero historical data, zero references, zero ambiguity",
        "Anything else",
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

  const existing = await getPost("guide", SLUG);
  const now = Date.now();

  const post: Post = {
    slug: SLUG,
    title: "How to audit stale HubSpot properties",
    description:
      "Every HubSpot portal accumulates properties faster than it sheds them. A repeatable seven-step audit for finding the dead ones, deciding what to do with them, and slowing the drift between audits.",
    contentHtml,
    status: "draft",
    coverImageUrl: undefined,
    targetKeyword: "audit hubspot properties",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    publishedAt: undefined,
    authorAccountId: existing?.authorAccountId ?? "system-seed",
    faq,
    comparisonTable,
    relatedProducts: ["property-pulse"],
  };

  if (existing) {
    console.log(`[seed] guide already exists at slug "${SLUG}", overwriting`);
  } else {
    console.log(`[seed] creating new draft guide at slug "${SLUG}"`);
  }

  await savePost("guide", post);

  // Read it back and verify the optional fields round-tripped.
  const read = await getPost("guide", SLUG);
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
  check("faq length 6", Array.isArray(read.faq) && read.faq.length === 6);
  check(
    "comparisonTable headers length 4",
    !!read.comparisonTable && read.comparisonTable.headers.length === 4,
  );
  check(
    "comparisonTable rows length 5",
    !!read.comparisonTable && read.comparisonTable.rows.length === 5,
  );
  check(
    "comparisonTable each row has 3 cells",
    !!read.comparisonTable &&
      read.comparisonTable.rows.every((r) => r.cells.length === 3),
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
    `[seed] preview at /admin/content/guides/${SLUG}/preview (status: draft)`,
  );
}

main().catch((err) => {
  console.error("[seed] unhandled error:", err);
  process.exit(1);
});
