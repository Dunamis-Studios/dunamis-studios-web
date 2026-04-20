---
title: Per-portal pricing, and why
description: Each HubSpot portal you install a Dunamis Studios app on has its own subscription. Here is what that means operationally and why it is structured this way.
category: billing
product: platform
access: public
order: 2
updated: 2026-04-20
tags:
  - pricing
  - billing
  - portals
---

Every HubSpot portal that runs a Dunamis Studios app has its own subscription. If you run Debrief on two portals, you have two subscriptions. They bill separately, invoice separately, and carry separate credit balances.

## The operational consequences

| Aspect             | Behavior                                                  |
| ------------------ | --------------------------------------------------------- |
| Billing            | One Stripe subscription per portal, per product           |
| Invoices           | Separate per portal                                       |
| Credits            | Do not pool across portals                                |
| Credit packs       | Apply to the portal they were purchased against           |
| Cancellation       | Per portal. Canceling one does not touch the others       |
| Plan tier          | Each portal picks its own tier independently              |
| First-month bonus  | Granted per portal, per product, on initial subscription  |

One Dunamis Studios account can hold many portal subscriptions across many products. The account is the identity layer. The subscription is the billing layer. They meet in your dashboard at `/account`.

## Why per-portal

HubSpot portals are real operational boundaries. They hold distinct CRM data, distinct object definitions, distinct teams. Treating them as a billing aggregate would hide cost signals that matter: one portal running heavy handoff volume should not silently spend credits granted for another portal's separate use case.

Per-portal pricing also matches how HubSpot itself bills. If your finance team already owns N HubSpot subscriptions, adding N Dunamis Studios subscriptions fits the existing cost-center breakdown. It is not a workaround; it is aligned with how HubSpot structures multi-portal organizations.

## What this means if you have one portal

Nothing unusual. One subscription, one invoice, one credit balance. The per-portal model is transparent from the single-portal side.

## Managing multiple portals

The dashboard at `/account` lists every entitlement (each one is a product plus portal pair). You can manage billing, swap tiers, and add credit packs on any of them. You cannot transfer credits between them. If you need to consolidate across portals, email support and we can arrange a manual transfer for edge cases.
