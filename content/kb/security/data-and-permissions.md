---
title: What Debrief reads from HubSpot, and what it doesn't
description: The HubSpot OAuth scopes Debrief requests, what it reads on each generation, and what it never touches.
category: security
product: debrief
access: public
order: 1
updated: 2026-04-20
tags:
  - security
  - permissions
  - data
---

Debrief asks for the minimum HubSpot permissions it needs to generate briefs and run the atomic Handoff operation. This article lists what those are and what Debrief actively does not do.

## OAuth scopes at install

When you install Debrief, HubSpot shows you the scopes Debrief requests. These are:

- **CRM read.** Contacts, companies, deals, tickets, custom objects. Debrief uses these to pull record context for the brief.
- **Engagements read.** Calls, emails, meetings, notes. The brief's Timeline section reads from engagement history.
- **Owner read.** Debrief needs to know who owns a record to generate handoff context and to know who the incoming owner is.
- **CRM write (owner + notes only).** Used by the atomic Handoff operation to reassign ownership and attach the generated brief as a Note.

Debrief does not request scopes for workflows, lists, marketing events, or files. If HubSpot's install screen shows any of those, something is wrong. Stop and contact support.

## What Debrief reads on each generation

On a Brief me or Handoff:

1. The record itself (properties you configured for inclusion).
2. Associated contacts, companies, deals, tickets, and custom objects (configurable fan-out depth).
3. Recent engagements (calls, emails, meetings, notes) within the configured time window.
4. The current owner of the record.

Admins control which associations and properties are in scope per handoff type. If a field is not in the scope config, Debrief does not read it.

## What Debrief never does

- Deletes records or properties.
- Modifies existing Notes.
- Changes properties other than owner (and only during Handoff).
- Sends email, creates tasks, or fires workflows.
- Exports data to third parties.
- Shares your portal's data with other Dunamis Studios customers.

## Data retention

The generation pipeline holds the context it reads only for the duration of the generation (seconds). After the brief is produced:

- The brief itself is attached to the record as a HubSpot Note. HubSpot owns that data.
- The Handoff Log entry stores metadata (who, who, when, cost). No record content.
- The raw context pulled from HubSpot is discarded.

Debrief does not keep a long-term copy of your CRM data.

## AI processing

The AI call that generates the brief and the message runs against the context Debrief just pulled. The LLM provider (currently Anthropic, via API) processes the prompt and returns a response. Per our LLM provider agreement, your portal's data is not used to train the model.

## Admin controls

Portal admins can tune what goes into the brief, per handoff type:

- Which associations to include.
- How many records per type.
- Whether to fan out to engagements.
- How much history to include.

If a field is sensitive and should never be in a brief, exclude it at the scope config level rather than after the fact.
