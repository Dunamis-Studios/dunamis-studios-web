---
title: What is Debrief?
description: Debrief writes a structured brief and a handoff message when a HubSpot CRM record changes owners, so the incoming rep inherits context, not just the record.
category: getting-started
product: debrief
access: public
order: 1
updated: 2026-04-20
tags:
  - overview
  - getting-started
---

Debrief is a HubSpot-native app that fixes the handoff layer of your CRM. When a contact, company, deal, ticket, or custom object switches owners (or when you want to catch a teammate up on a record), Debrief writes two things the outgoing owner would otherwise have to produce by hand:

1. A **structured brief** for the incoming owner, laid out as Why / People / Timeline / Next Steps / Risk Flags / Promises.
2. A **conversational message** drafted in the outgoing owner's voice and tuned to the handoff type (BDR → AE, AE → CS, rep → rep, and so on).

## Where Debrief lives

Debrief attaches as a CRM card on every standard object and every custom object in your portal. Install once, and every record has a handoff surface. No per-object setup, no separate workflow.

## Draft Brief vs. Handoff

Every record surface exposes two actions:

- **Draft Brief.** Generates a preview brief for you without changing ownership. Useful before a call, an internal review, or when you've just inherited a record and need to get up to speed before taking action.
- **Handoff.** The atomic operation. It reassigns the record to the new owner, attaches the generated brief as a Note, and writes the event to the Handoff Log.

Draft Brief is read-only. Debrief never writes to HubSpot unless you explicitly run a Handoff.

## What Debrief reads

On each run, Debrief pulls the record itself plus its associated contacts, companies, deals, tickets, custom objects, and recent engagements (calls, emails, meetings, notes). Admins control which associations and properties are in scope per handoff type, so the brief stays focused on what matters for that specific transition.

## Credits, in one paragraph

Each brief costs one to three credits, depending on how much context it pulls. Custom objects and deep engagement fan-out cost more than a simple contact handoff. Your portal has a monthly allotment from your plan, plus any credit packs you've added on top. Credit packs never expire; the monthly allotment resets with your subscription period.

## At a glance

| Plan       | Monthly briefs | First-month bonus | Fits                                |
| ---------- | -------------: | ----------------: | ----------------------------------- |
| Starter    |             50 |              +50  | Single-team pilots                  |
| Pro        |            250 |            +250   | Growing sales + CS orgs             |
| Enterprise |          1,000 |          +1,000   | Multi-pod teams with heavy handoffs |

## Is Debrief right for you?

- [x] You run HubSpot as your CRM.
- [x] Your team has real handoffs: BDR to AE, AE to CSM, CSM to CSM, or cross-team ownership changes.
- [ ] You only work accounts solo. Debrief still works, but the value is lower.
- [ ] You don't use HubSpot. Debrief is HubSpot-only today.

## Who Debrief is for

Debrief is built for HubSpot Sales and Service teams that have real handoffs: BDR to AE, AE to CSM, CSM to CSM on account changes, marketing to sales on qualified leads. If your team's handoffs today are a Slack message and a shrug, Debrief replaces that.
