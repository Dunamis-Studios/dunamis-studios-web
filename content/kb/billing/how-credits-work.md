---
title: How Debrief credits work
description: What one credit buys, what raises or lowers the cost of a brief, and how your monthly allotment interacts with credit packs.
category: billing
product: debrief
access: public
order: 1
updated: 2026-04-20
tags:
  - credits
  - billing
  - pricing
---

Debrief charges credits per generation. One credit is not one brief. A brief costs between one and three credits, depending on how much context it pulls.

## What drives the per-brief cost

The cost preview shows you the number before you generate. In general:

| Context depth                                              | Typical cost |
| ---------------------------------------------------------- | -----------: |
| Simple contact or company, no associations fanned out      |     1 credit |
| Deal with standard associations, a few recent engagements  |    2 credits |
| Custom objects, deep engagement history, multi-hop context |    3 credits |

The conversational handoff message is priced separately, on its own line in the cost preview. Most message types cost a fraction of a credit. The preview shows you both lines before you confirm.

## Monthly allotment by plan

Each portal has a monthly credit allotment from its subscription. The allotment resets on your billing period boundary.

| Plan       | Monthly allotment | First-month bonus |
| ---------- | ----------------: | ----------------: |
| Starter    |                50 |              +50  |
| Pro        |               250 |            +250   |
| Enterprise |             1,000 |          +1,000   |

The first-month bonus is a one-time grant on initial subscription. It doubles your first month's cap so you can evaluate Debrief at full depth without burning through the allotment.

## Credit packs

Credit packs are separate purchases, billed once. They stack on top of the monthly allotment in a second bucket (the "addon" bucket) that never expires.

Spend order is fixed: monthly first, then addon. The addon bucket only gets touched after the monthly allotment is exhausted for the period. This means unused monthly credits expire at the end of the period (they do not roll into addon), and addon credits persist indefinitely.

## What happens at zero credits

If a generation would push your balance negative, Debrief blocks the generation and shows the current balance. Nothing happens in HubSpot. No owner change, no Note attached, no log entry. Top up a credit pack or wait for the next period reset, then retry.

## Transparent cost signal

The preview is token-accurate, not an estimate. The number you see before confirming is the number that gets deducted on success. If generation fails (HubSpot error, timeout, etc.), credits are refunded to the bucket they came from.
