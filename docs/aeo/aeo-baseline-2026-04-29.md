# AEO Citation Baseline: Dunamis Studios

**Date captured:** 2026-04-29
**Captured by:** Josh
**Purpose:** Baseline measurement of how ChatGPT, Perplexity, and Claude answer buyer-intent questions related to Property Pulse, Debrief, and Dunamis Studios. Re-run the same exact questions in 60 and 90 days to measure citation movement.

## Table of contents

- [Headline finding](#headline-finding)
- [Re-audit dates](#re-audit-dates)
- [Methodology](#methodology)
- [Most-cited competitor brands across all queries](#most-cited-competitor-brands-across-all-queries)
- [Most-cited URL surfaces](#most-cited-url-surfaces)
- [Platform behavior notes](#platform-behavior-notes)
- [Property Pulse and property tracking queries](#property-pulse-and-property-tracking-queries)
  - [Q1: What's the best HubSpot app for tracking property changes?](#whats-the-best-hubspot-app-for-tracking-property-changes)
  - [Q2: How do I see who changed a deal stage in HubSpot?](#how-do-i-see-who-changed-a-deal-stage-in-hubspot)
  - [Q3: What are alternatives to HubSpot's native property history panel?](#what-are-alternatives-to-hubspots-native-property-history-panel)
  - [Q4: HubSpot apps for audit logs and compliance](#hubspot-apps-for-audit-logs-and-compliance)
  - [Q5: How do I track property changes on custom objects in HubSpot?](#how-do-i-track-property-changes-on-custom-objects-in-hubspot)
- [Debrief and CRM handoff queries](#debrief-and-crm-handoff-queries)
  - [Q6: Best HubSpot app for sales handoffs](#best-hubspot-app-for-sales-handoffs)
  - [Q7: How do I write a CRM handoff note?](#how-do-i-write-a-crm-handoff-note)
  - [Q8: AI tools for HubSpot ownership transfers](#ai-tools-for-hubspot-ownership-transfers)
  - [Q9: How do you do a sales-to-customer-success handoff in HubSpot?](#how-do-you-do-a-sales-to-customer-success-handoff-in-hubspot)
- [Summary metrics](#summary-metrics)
- [Strategic observations from the baseline](#strategic-observations-from-the-baseline)
- [Re-audit instructions](#re-audit-instructions)

## Headline finding

Dunamis Studios, Property Pulse, and Debrief appeared in **0 of 27** platform responses. This is the expected starting point. Property Pulse is in marketplace review with capped installs; Debrief has light traction; the AEO restructure on dunamisstudios.net shipped the same day as this audit, before any platform crawl cycle. The baseline exists to measure delta from this zero-state.

## Re-audit dates

- 60-day re-audit: 2026-06-28
- 90-day re-audit: 2026-07-28

## Methodology

### Platforms queried

- ChatGPT (consumer interface)
- Perplexity (consumer interface)
- Claude (consumer interface)
- Google AI Overviews was planned for this run but not captured. The 60-day re-audit should attempt to include it.

### Questions

The same nine buyer-intent questions were submitted to each platform, in this order:

1. What's the best HubSpot app for tracking property changes?
2. How do I see who changed a deal stage in HubSpot?
3. What are alternatives to HubSpot's native property history panel?
4. HubSpot apps for audit logs and compliance
5. How do I track property changes on custom objects in HubSpot?
6. Best HubSpot app for sales handoffs
7. How do I write a CRM handoff note?
8. AI tools for HubSpot ownership transfers
9. How do you do a sales-to-customer-success handoff in HubSpot?

### Capture method

Manual queries entered into each platform's consumer-facing chat interface, not through APIs. Responses copied into the per-question entries below. No system prompts, no follow-up turns, no retries.

### Known limitation

No platform exposed citation URLs in this run. ChatGPT and Claude answered from training and synthesis. Perplexity also did not surface URLs, which is unusual for that platform. The "URLs cited" field under each question is therefore "none shown" across the board, so URL-level citation patterns cannot be measured from this baseline alone.

## Most-cited competitor brands across all queries

- **Audit Fox** (cited by ChatGPT and Claude in audit/property tracking contexts)
- **Insycle** (cited by Perplexity for data quality)
- **Arrows** (cited by Perplexity as the leading sales handoff app)
- **Rocketlane, GUIDEcx, Catalyst, ChurnZero** (cited by Perplexity for handoff/CS adjacent)
- **Vanta, Drata, Secureframe** (cited by Perplexity for SOC 2 / compliance)
- **Coefficient, Supermetrics** (cited by Perplexity for property history exports)
- **HubSpot Breeze** (cited by Perplexity as native AI option for handoff summaries)
- **Gong, Chorus, Fireflies** (cited by Perplexity for AI call summaries feeding handoffs)
- **Zapier** (cited by Claude for AI workflow automation)

## Most-cited URL surfaces

No platform exposed citation URLs in this baseline. ChatGPT and Claude answered from training and synthesis without showing source links. Perplexity also did not surface URLs in this run, which is unusual for that platform and worth re-checking on the 60-day audit.

## Platform behavior notes

- **ChatGPT** leaned on prescriptive structure (bullet hierarchies, "👉 Reality check" callouts) and mentioned Audit Fox by name as the closest dedicated solution. Surface-level coverage; did not engage with technical depth.
- **Perplexity** produced the most technically detailed and accurate response set, including specific HubSpot retention caps (45 revisions for contacts, 20 for deals/companies/tickets/custom objects), API endpoint behavior, and stack-aware recommendations. Cited the most third-party brands across all 9 questions.
- **Claude** produced shorter, more declarative answers, also citing Audit Fox prominently. Less technical depth than Perplexity.

## Property Pulse and property tracking queries

### What's the best HubSpot app for tracking property changes?

**ChatGPT**

- Brands mentioned: Audit Fox
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Named Audit Fox as "the closest thing to a 'best' dedicated solution right now." Acknowledged HubSpot has no strong native cross-object change tracking UI. Recommended combining audit logs, property history exports, and custom logging.

**Perplexity**

- Brands mentioned: Insycle, Coefficient, Supermetrics
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Stated "third-party audit apps are a thinning market" because native tooling has improved. Recommended native-first approach (property history panel, Property Change Events, Audit Logs, Workflow Data Restore beta) before third-party. Recommended a custom AWS pipeline for the user's specific stack.

**Claude**

- Brands mentioned: Audit Fox
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Named Audit Fox as a top app for "comprehensive property change tracking across contacts, deals, workflows, and custom objects." Said it provides detailed audits and optimization insights beyond native tools.

### How do I see who changed a deal stage in HubSpot?

**ChatGPT**

- Brands mentioned: none (native HubSpot only)
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Three options: property history (fastest), Audit Logs (Enterprise only), timeline activity (limited reliability).

**Perplexity**

- Brands mentioned: none (native HubSpot only)
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Three native paths plus API path. Detailed `GET /deals/v1/deal/:dealId?includePropertyVersions=true`. Flagged that v3 API still does not return historical property values, "a known limitation HubSpot has acknowledged for years with no committed fix." Noted workflow-driven changes show "Workflow" as source, not the user who triggered the workflow.

**Claude**

- Brands mentioned: none (native HubSpot only)
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Open record, click clock icon in left sidebar. Reports > Sales > Deals > Deal Change History for aggregated views.

### What are alternatives to HubSpot's native property history panel?

**ChatGPT**

- Brands mentioned: Audit Fox
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Listed export property history, build-your-own tracking layer (workflow copying old value to another field), API extraction, and "third-party tools" with Audit Fox named.

**Perplexity**

- Brands mentioned: none (native HubSpot only)
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Ranked alternatives by usefulness. Recommended a workflow logging pattern: trigger on property change, custom code action writes old value/new value/user/timestamp to a custom object record. Flagged the panel's biggest weakness: per-object retention cap (45 contacts, 20 deals/companies/tickets/custom objects).

**Claude**

- Brands mentioned: Audit Fox
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Custom workflows with Property Change Events (Enterprise-only), Google Sheets exports for append-only logs, Audit Fox for deeper analysis "without native limits."

### HubSpot apps for audit logs and compliance

**ChatGPT**

- Brands mentioned: Audit Fox, Snowflake, BigQuery
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Native (HubSpot Audit Logs, Enterprise) for SOC2-style governance. Audit Fox for portal health. Custom middleware to data warehouse / SIEM. Flagged native logs are time-limited.

**Perplexity**

- Brands mentioned: Vanta, Drata, Secureframe, Insycle, HubSpot Data Quality Command Center
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Most comprehensive answer in the set. Native Audit Logs (Enterprise only), audit log notifications for super admins, Login History for non-Enterprise (30 days), HubSpot employee access log. Compliance marketplace apps: Vanta, Drata, Secureframe. Insycle for data quality auditing. For Pro tier (no native audit log), recommended custom pipeline writing audit events to a custom object via workflow custom code actions.

**Claude**

- Brands mentioned: Audit Fox
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Audit Fox for scanning all objects. Native audit logs in Settings > Account Activity for 30-day views of logins/security.

### How do I track property changes on custom objects in HubSpot?

**ChatGPT**

- Brands mentioned: none (native HubSpot only)
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Property history works automatically for custom objects. Workflow recommendation. API logging for scale. Flagged HubSpot does not natively track "previous value" in workflows.

**Perplexity**

- Brands mentioned: none (native HubSpot only)
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Most detailed answer. Same retention caveat (20 revisions per property for custom objects). v3 batch read endpoint with `propertiesWithHistory` parameter (showed code sample). Property Change Events work on custom objects (Enterprise). Recommended pattern: workflow trigger on custom object property change, custom code action, write to a "Change Log" custom object with full attribution fields. Sidesteps the 20-revision cap.

**Claude**

- Brands mentioned: none (native HubSpot only)
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Same property history panel or Property Change Events in Data Management > Event Management.

## Debrief and CRM handoff queries

### Best HubSpot app for sales handoffs

**ChatGPT**

- Brands mentioned: Slack, Audit Fox
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Stated "there's no single dominant app." Recommended native (deal pipelines + task automation, workflow assignment rules), Slack integrations, Playbooks. Best app is often "workflow + standardized fields + automation."

**Perplexity**

- Brands mentioned: Arrows, Rocketlane, GUIDEcx, Catalyst, ChurnZero
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Strongest single answer in the entire baseline. Named Arrows as "the one most explicitly built for this. It's a HubSpot-native onboarding and handoff tool with shared customer-facing action plans, deep workflow integration." Said most "how to do handoffs in HubSpot" content (including the Arrows guide HubSpot itself links) is built around Arrows. Recommended Rocketlane for onboarding, GUIDEcx for implementation-heavy handoffs, Catalyst/ChurnZero for full CSM platform. For small teams: native + Playbooks.

**Claude**

- Brands mentioned: none (native HubSpot only)
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Brief answer. "No single 'best' app emerged; use HubSpot workflows for automation."

### How do I write a CRM handoff note?

**ChatGPT**

- Brands mentioned: none
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Provided a structured template (Customer Summary, Deal Context, Status, Risks, Next Steps). Key rule: "Make it actionable, not descriptive."

**Perplexity**

- Brands mentioned: none
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Most detailed handoff template in the baseline. Seven sections: account basics, why they bought, sales context (including promises made outside the contract), stakeholder map, operational context, risks and red flags, next steps. Closing note: "Keep it factual, no hype. The CSM is going to compare this to what the customer says on the kickoff call, and any gap erodes trust."

**Claude**

- Brands mentioned: none
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Brief answer. Add a free-text custom property (e.g., "Sales Handoff Notes") on deals, populate via workflows or manually. Include key details: next steps, customer pain points, ownership transfer date.

### AI tools for HubSpot ownership transfers

**ChatGPT**

- Brands mentioned: ChatGPT, Zapier, Clay
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Native-ish: HubSpot workflows + scoring + rotation. AI/automation: ChatGPT + Zapier, custom OpenAI workflows, RevOps platforms (Clay). Use cases: assign owners by territory/deal size/industry, auto-generate handoff notes.

**Perplexity**

- Brands mentioned: HubSpot Breeze, Breeze Copilot, Anthropic, OpenAI, Arrows, Gong, Chorus, Fireflies
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Most comprehensive answer in the AI tools category. Breeze and Breeze Copilot for native AI summarization. Recommended workflow custom code actions calling Anthropic or OpenAI API to auto-generate handoff summaries on closed-won. Said "I'm not aware of a dedicated, marketed 'AI ownership transfer' app in the HubSpot marketplace. If your client wants this, it's almost certainly a build, not a buy." Gong, Chorus, Fireflies for AI call summaries feeding the handoff. **This is the single most important data point in the entire baseline for Debrief positioning: Perplexity explicitly stated this is uncontested space.**

**Claude**

- Brands mentioned: HubSpot Breeze, Zapier
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Brief answer. Breeze for predictive scoring, Zapier workflows for rep assignments. "No dedicated AI apps were prominent for this."

### How do you do a sales-to-customer-success handoff in HubSpot?

**ChatGPT**

- Brands mentioned: Slack
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Four-step pattern: trigger on Closed Won, workflow actions (assign CSM, create onboarding task, Slack/email notification, create handoff note), required fields gate at close, separate visibility/tracking.

**Perplexity**

- Brands mentioned: Arrows, ConnectedGTM, HubSpot Academy
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Seven-step pattern combining HubSpot Academy guidance, Arrows playbook, and ConnectedGTM playbook. Key recommendations: (1) required fields gate at Closed Won is "the single highest-leverage step", (2) use a separate onboarding pipeline on the Projects object (HubSpot's own community recommends this now), (3) workflow automation on Closed Won with associated Project record creation, (4) HubSpot Playbook for the handoff document, (5) joint kickoff call where sales attends with CSM ("the single most-cited best practice in every HubSpot handoff playbook"), (6) reporting and feedback loop, (7) association labels for clarity.

**Claude**

- Brands mentioned: none
- URLs cited: none shown
- Dunamis appeared: No
- Notes: Brief answer. Associate the deal to a ticket or company record, update ownership via workflows, add notes. Trigger on stage change (Closed Won) to notify CS reps and create tasks.

## Summary metrics

- Total queries where Dunamis Studios appeared: **0 / 27**
- Total queries where Property Pulse appeared: **0 / 5** PP-relevant queries
- Total queries where Debrief appeared: **0 / 4** Debrief-relevant queries
- Platforms with strongest visibility for Dunamis: **none**
- Platforms with zero visibility: **all three**

## Strategic observations from the baseline

### Audit Fox is the brand to beat for property tracking visibility

ChatGPT and Claude both name it; Perplexity ignores it in favor of recommending native + custom builds. Property Pulse needs to start showing up in the same contexts where Audit Fox does, especially in ChatGPT and Claude responses.

### Arrows owns the sales handoff category in Perplexity

Perplexity stated that most "how to do handoffs in HubSpot" content (including HubSpot's own linked guidance) is built around Arrows. This is a hard-to-displace position. Debrief's positioning needs to be sharply differentiated from onboarding (Arrows' actual category) toward the moment-of-handoff brief generation, which Arrows does not own.

### Perplexity explicitly identified Debrief's category as unbuilt

Quote (Q8): "I'm not aware of a dedicated, marketed 'AI ownership transfer' app in the HubSpot marketplace." This is the single strongest validation in the baseline that Debrief is in white space, not contested territory.

### Native HubSpot tooling is recommended ahead of third-party in most responses

Perplexity in particular treats third-party audit apps as a "thinning market" because of HubSpot's 2025-2026 native improvements. Property Pulse positioning must clearly differentiate from native, which is why the comparison block on the product page is correctly oriented.

### No platform showed citation URLs in this run

Either the questions did not trigger citation mode, or the platforms answered from training without web search. This means we cannot yet measure URL-level citation patterns. Re-audit should explicitly attempt to trigger citations (e.g., add "with sources" to query phrasing).

### The "best HubSpot apps for X" listicle gap is real

None of the platforms cited a comparison article or third-party listicle in any response. This validates Workstream 2 (anchor listicle articles) as a high-leverage move because the surfaces those listicles would create do not exist in any AI engine's current corpus.

## Re-audit instructions

- Re-run all 9 questions on the same 3 platforms (4 if Google AI Overviews can be captured)
- Use the same exact phrasing as listed in the [Methodology](#methodology) section above
- Save the new file as `aeo-baseline-YYYY-MM-DD.md` in the same `docs/aeo/` folder
- Compare brand mentions, URL citations, and Dunamis Studios visibility delta against this baseline
- Note any platform behavior changes (citation modes, response style, refusal patterns)
