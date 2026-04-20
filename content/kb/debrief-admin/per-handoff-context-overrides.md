---
title: Per-handoff-type context overrides
description: Tune which associations, properties, engagements, and section labels feed each handoff type (BDR to AE, AE to CS, rep to rep, etc.).
category: debrief-admin
product: debrief
access: customers
order: 2
updated: 2026-04-20
draft: true
tags:
  - admin
  - customization
  - handoff
---

By default, every Debrief brief pulls the same context regardless of handoff type. Per-handoff-type overrides let admins configure different scope per type, so a BDR → AE brief reads different data than an AE → CSM brief.

## Why you might want this

- **Stage-specific context.** A BDR → AE brief wants discovery notes and qualification framework data. An AE → CSM brief wants contract terms and promised deliverables. Same record, different relevant context.
- **Section relabeling per stage.** "Risk Flags" means different things to a seller and a post-sale owner. Overrides let each handoff type use its own vocabulary.
- **Credit management.** Heavier context costs more credits. If some handoff types need the deep context and others do not, you can keep the cheap ones cheap.

## Where the settings live

Dashboard → the portal's Debrief entitlement → **Handoff types**.

You see the built-in handoff types and any custom ones you have defined. Click a type to open its override editor.

## What you can override per type

- **Associations to include.** Contacts, companies, deals, tickets, custom objects. Toggle each.
- **Records per type.** Cap the fan-out. Default is 10 per association.
- **Engagement fan-out.** On or off. If on, how many days of history.
- **Property allowlist.** Which record properties to include in the brief. Unchecked properties are never read.
- **Section overrides.** Rename or disable the six default sections for this handoff type only (see [Customize brief sections](/help/debrief-admin/configure-brief-sections) for the portal-wide version).
- **Message template guidance.** Freeform text that tunes the conversational message generation for this handoff type.
- **AI instruction overrides.** Enterprise tier only. Freeform text prepended to the LLM prompt for this handoff type.

## Changes and audit

Every override change is logged to the audit trail, visible in the dashboard. The log shows who changed what, when, and the before/after values. Reverting a change restores the prior config but does not rewrite briefs generated under the old config.

## Dry-run mode

Before activating an override in production, enable **Dry run** on the handoff type. In dry run, the override applies but no owner changes happen on Handoff. The brief is generated, the cost preview runs, but the atomic reassignment is skipped. Use this to verify brief quality before opening the gates.

## Enforcement windows

To roll out an override gradually, set an **Enforcement date**. Before that date, briefs use the old config; on and after, briefs use the new. This gives reps time to adjust to new section labels without being surprised.
