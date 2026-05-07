---
title: "Refund policy"
description: "Atelier refund window, how to request a refund, and how license deactivation works."
category: policies
order: 5
updated: "2026-05-07"
---

## The 30-day window

Within 30 days of purchase, you can request a full refund of your Atelier license, no questions asked. We'll refund the original payment method.

The 30-day clock starts on the date the purchase confirmation email was sent. If you bought Atelier on April 1, the refund window closes at the end of April 30.

## How to request a refund

Email **legal@dunamisstudios.com** from the email address used to purchase. Include:

- The email address used at purchase (so we can find the order)
- A short note about why — not because we're going to argue, but because feedback shapes the product

We respond within one business day to confirm the refund. The refund itself processes manually for v1 — Stripe automation comes later. Expect 3-5 business days for the refund to appear on your card or bank statement, depending on your bank.

## What happens to your license

A refund includes license deactivation:

1. We mark your license as **refunded** in our issuance database. The license string itself remains cryptographically valid (Atelier has no online revocation in v1 — see [EULA §6.4](doc:eula)), but it is recorded as refunded for support purposes.
2. We ask you to uninstall Atelier from your machines. The good-faith expectation is that you stop using the software once the refund is issued; this is consistent with [EULA §19.5](doc:eula) on Licensee discontinuation.
3. Your data remains yours. Per [first-run § backing up](doc:first-run), `%APPDATA%\studios.dunamis.atelier\atelier.sqlite` is your file. Refunding the license does not entitle us to your data, and we have no way to access it remotely.

If you change your mind later and want Atelier again, contact us — we'll re-issue the license at the original price (no upcharge for the previously-refunded purchase). Refunds aren't punishment.

## After the 30-day window

After the 30-day window closes, refunds are at our discretion (per [EULA §19.5](doc:eula), refund eligibility is governed by the Terms of Sale, of which this page is the operative version while a separate Terms of Sale doc is being written).

In practice, we've issued post-window refunds for:

- Genuine duplicate purchases (you bought twice by mistake)
- Bought-too-soon purchases where the customer's situation changed before they ever installed (business closing, change of role away from wedding planning)
- Material misunderstandings about scope ("I thought it was a Mac app") if the misunderstanding can be traced to ambiguous marketing copy on our part

We have not issued refunds for:

- Buyer's remorse months after install and active use
- Disagreement with the policy you're reading right now (refund window, no SLA, single-machine v1, etc.) — these are documented before purchase and accepting the EULA at first launch is acknowledgment of the terms

If you're past 30 days and want to request a refund, email us with the situation. We respond honestly — yes, no, or "let's talk" — and if it's no, we explain why.

## Chargebacks

If you initiate a chargeback through your bank or card issuer instead of contacting us first, we strongly prefer to handle the issue directly. Chargebacks are expensive on both sides (the merchant fee for a contested charge often exceeds the refund amount, and chargeback wins on either side accumulate as record signals to the payment processor). Email us — we'd much rather refund and move on than fight a chargeback.

## Loyalty pricing on major upgrades

A refund of your v1 license also forfeits the [30% major-version loyalty discount](doc:bug-fix-policy#major-versions-are-separate) that v1 owners would otherwise be eligible for on v2 and future majors. The loyalty discount is tied to having an active (not refunded) license. If you re-purchase later, you start fresh — re-purchase price is full v1 price, and the loyalty clock starts at that point.

## Contact

Refund requests, chargeback discussions, and any related questions: **legal@dunamisstudios.com**.
