---
title: How a Debrief handoff works
description: Step by step, from opening a record to the log entry, what happens when you run Brief me or Handoff on a HubSpot CRM record.
category: getting-started
product: debrief
access: public
order: 2
updated: 2026-04-20
tags:
  - handoff
  - getting-started
---

Every Debrief surface exposes the same two actions: **Brief me** and **Handoff**. They share the same generation pipeline. They differ in what they write back to HubSpot.

## Brief me

Brief me is the read-only action.

1. Open any record with Debrief installed (contact, company, deal, ticket, or custom object).
2. Open the Debrief CRM card and click **Brief me**.
3. Pick the handoff type you want the brief framed for (BDR → AE, AE → CS, rep → rep, marketing → sales).
4. Optionally add sender notes. These are your context for the incoming reader, not scraped from HubSpot.
5. Debrief runs the pre-flight scan (see below), shows a credit cost preview, and waits.
6. Confirm. Debrief generates the brief in place.

The owner of the record does not change. No Note is attached. No Handoff Log entry is written. You see the brief, close the card, and it is gone. If you want to keep it, copy the text or start again and run Handoff instead.

Use Brief me before a call, when you inherit a quiet account, or when you need to catch a teammate up without triggering an ownership change.

## Handoff

Handoff is the atomic action.

1. Open the record, open the Debrief CRM card, click **Handoff**.
2. Pick the recipient (the new owner).
3. Pick the handoff type.
4. Optionally add sender notes.
5. Debrief runs the pre-flight scan and shows a cost preview covering both the brief and the drafted message.
6. Confirm. Debrief does three things in one operation:
   - Reassigns ownership of the record to the recipient.
   - Attaches the generated brief as a Note on the record, pinned and visible to the recipient.
   - Writes an entry to the Handoff Log (who, who, when, cost).

All three happen or none happen. If the HubSpot owner reassignment fails (permissions, invalid recipient, etc.), the Note is not attached and the log is not written. You get an error and your credits are refunded.

## Pre-flight data gap scanner

Before generation, Debrief scans the record for context gaps that would produce a weak brief:

- Missing owner.
- Low recent engagement (no activity in the last N days, configurable).
- Stale property values.
- Empty sender notes for handoff types that expect them.

Gaps do not block generation. They show up as a warning you can dismiss. If you dismiss and generate anyway, the brief ships with the data you have.

## Cost preview

The preview shows two lines:

- The brief itself (one to three credits depending on depth).
- The conversational handoff message (separate line, priced per message type).

You see the total before you confirm. Nothing is charged if you cancel.

## What happens after

The recipient sees the brief in two places:

- The **Note** pinned on the record, so it is visible whenever they open the record.
- Their **Briefs for me** inbox, which lists every incoming handoff with timestamp and sender.

The outgoing owner sees the event in the **Handoff Log** attached to the record, with the who, when, and credit cost.

## Reversibility

Ownership changes are reversible through HubSpot in the usual way. The Note that Debrief attached stays on the record permanently unless you delete it. The Handoff Log entry is immutable.

If you need to undo a handoff entirely, reassign ownership back in HubSpot and delete the Debrief Note. The log entry remains as a record of what happened.
