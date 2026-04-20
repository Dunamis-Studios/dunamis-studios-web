---
title: Brief didn't generate?
description: The common reasons a brief fails to generate, how credits behave on failure, and how to recover.
category: troubleshooting
product: debrief
access: customers
order: 1
updated: 2026-04-20
draft: false
tags:
  - troubleshooting
  - briefs
---

When you run Draft Brief or Handoff, one of four things can happen: success, a blocking pre-flight warning, a HubSpot error, or a generation error. This article covers the last three.

## Pre-flight warnings

The pre-flight scanner flags context gaps before generation starts. These are not errors; they are warnings. Common ones:

- **Missing owner.** The record has no current owner. Fix by assigning an owner in HubSpot, then retry.
- **Low engagement.** No activity in the last N days (configurable per handoff type). You can dismiss and generate anyway; the Timeline section will be thin.
- **Stale properties.** One or more key properties have not been updated in 180 or more days. Same: dismiss to proceed.
- **Empty sender notes.** Some handoff types expect sender notes. If blank and the type requires them, pre-flight blocks. Add notes to proceed.

Warnings do not consume credits. Credits only move after you confirm past the preview.

## HubSpot errors

If HubSpot rejects the Handoff operation (for example, the recipient is invalid or your portal is over a rate limit), the entire operation rolls back:

- Owner is not changed.
- Note is not attached.
- Log entry is not written.
- Credits are refunded.

You see the HubSpot error message verbatim in the Debrief card. Fix the underlying issue (valid recipient, wait out the rate limit, etc.) and retry.

## Generation errors

If the AI generation call fails (timeout, provider error, malformed response), Debrief shows a generation error and refunds credits. You can retry immediately. Repeated failures on the same record usually mean the context is malformed in some way. Contact support with the record ID so we can inspect.

## Credits on failure

Credits are only deducted on successful generation. Any failure (pre-flight block, HubSpot error, generation error) results in a full refund to the originating bucket (monthly first, addon second, matching the spend order).

If you see a deduction you believe is wrong, contact support with:

1. The record ID.
2. The approximate timestamp.
3. The brief's log entry ID if one was written.

We audit the ledger and reverse a bad deduction.

## When to contact support

- Same record fails three times in a row with the same error.
- A successful generation produced obviously wrong output (wrong entity names, hallucinated data).
- A credit balance does not match what the log entries imply.

support@dunamisstudios.net. A human reads and responds.
