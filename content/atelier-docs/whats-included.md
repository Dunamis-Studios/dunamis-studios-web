---
title: "What's included"
description: "What ships with an Atelier license, what doesn't, and what's deliberately not on the roadmap."
category: getting-started
order: 3
updated: "2026-05-08"
---

A perpetual Atelier license is $149, paid once. This page is the canonical list of what that buys you and, just as importantly, what it doesn't.

## What's in the box

- **The full Atelier app.** Every feature is unlocked. There is no premium tier, no feature gate, no functionality reserved for a subscription. The app a customer paying $149 receives is the same app we use ourselves.
- **Activation on up to 3 devices, customer-controlled deactivation.** A single license activates on up to three computers concurrently. You can deactivate any device at any time from inside Atelier (**Settings → License**) or from the customer portal at `dunamisstudios.net/account/atelier-licenses`. See the [user guide § License management](doc:user-guide#license-management) for the full surface and [EULA §6](doc:eula) for the legal version.
- **Source code.** Atelier ships with unobfuscated source. You can read it, audit it, modify it for your own internal business use. You cannot redistribute it or use it as the foundation for a competing product — see [EULA §5](doc:eula) for the full restrictions.
- **Local REST API.** A localhost-bound HTTP API on port 7423 exposes Atelier's data model to anything that can make HTTP requests. Per-installation Bearer key, documented at `/api/docs` inside the running app. See the [API reference](doc:api-reference) for the customer-facing version of those docs.
- **Perpetual license for the current major version.** Yours forever. The license verifies offline against a key embedded in the app — no server check-in, no online activation, no kill switch.
- **Free bug fixes for as long as we operate the major version you bought.** No 30-day window, no 12-month cliff. See the [bug fix policy](doc:bug-fix-policy) for the full statement and how to report bugs.
- **Free minor updates for as long as we operate the major version you bought.** New features added within a major version land in your install via the auto-updater (which you can turn off in **Settings → Software Updates** if you'd rather pin a specific build).

## Network requirements

Atelier is a local-first desktop app, but it is not a fully offline app. License enforcement runs against an activation server.

- **First-launch internet.** Required for first activation. A 7-day provisional grace period applies if you're offline at first launch — Atelier works, but it'll attempt activation on each subsequent launch and lock if it can't reach the server within 7 days.
- **Periodic heartbeat.** About once per day after activation. Payload is roughly 1 KB and contains your license ID, a hashed hardware fingerprint, and the running Atelier version — nothing else. See the [privacy notice](doc:privacy) for the exact contract.
- **30-day offline grace.** Once activated, Atelier works offline for up to 30 days between successful heartbeats. After 30 days, the next launch shows a "Reconnect to verify license" lockdown until the next successful check-in.
- **Outbound HTTPS to `dunamisstudios.net`** is the only required network egress for licensing. Antivirus or firewall software that blocks the domain will surface as an activation/heartbeat failure — whitelist if needed.

Wedding data is never sent to Dunamis Studios. The activation/heartbeat traffic is a separate, narrow channel from your business data.

## What's not included, but available separately

- **Major version upgrades.** When v2 ships (no committed date — we don't ship to deadlines), it's a separate paid purchase. Existing customers get loyalty pricing — currently 30% off — every major upgrade for life. See the [bug fix policy](doc:bug-fix-policy) for the major-version contract.
- **Custom development.** If Atelier doesn't have a feature you need, we can scope a custom development engagement after you've used the app and know exactly what's missing. Pricing is per-customer, not a fixed tier — see [EULA §11](doc:eula) for the engagement framing. Contact us at [legal@dunamisstudios.com](mailto:legal@dunamisstudios.com) to start a conversation.
- **Support agreements.** The default support is best-effort — no SLA, no guaranteed response time, but we do reply. Studios that need guaranteed response times can purchase a separate support agreement. Most studios don't need this.

## What's deliberately not coming

We get asked about these regularly. The honest answer for each is "no, not now and not later."

- **Cloud-hosted Atelier.** Atelier does not, and will not, run as a SaaS hosted by Dunamis. The local-first architecture is core to the product — your data stays on your machine, the license verifies offline, and the studio doesn't double as a hosting provider. If we ever did SaaS, it would be a different product with a different name.
- **Real-time multi-user sync.** Atelier is single-machine in v1. Multi-user sync (one studio, multiple planners, shared database) is on the v2 roadmap, but it will be a peer-to-peer or self-hosted server model — never a Dunamis-hosted service.
- **Mobile app.** Atelier runs on Windows. There's no iOS app, no Android app, no plans for one. The day-of mode is a phone-friendly web view served by Atelier itself over your local network — that's the closest thing to "Atelier on a phone" that ships in v1. iOS and Android native apps are not on the roadmap because the cost-to-benefit ratio is upside-down for a single-developer studio.
- **Mac or Linux build.** Mac is the most likely next platform after Windows, but it's not in v1 and we don't have a date. Linux is not currently planned.
- **Telemetry, analytics, or usage tracking.** Atelier does not send usage data anywhere. Future versions may introduce optional telemetry — if so, it will be off by default and require an explicit opt-in checkbox in Settings. See [EULA §15](doc:eula) and the [privacy notice](doc:privacy) for the standing commitment.
- **Vendor referrals or affiliate revenue.** Atelier's vendor database is your data, not ours. We don't take a cut of vendors you book through Atelier, we don't surface "preferred" vendors in the UI, and we don't sell vendor placements.

## The non-purchasable distinction

Some of the items above ("cloud-hosted Atelier", "vendor referrals") are listed as "not coming" rather than "not yet." The distinction matters: features marked **not coming** are things we believe make the product worse, and adding them would be an architectural reversal, not a roadmap item. Saying "no" to those things is part of the product.

If you need cloud sync, multi-tenant access, or a SaaS-shaped tool, Atelier is not the right fit and never will be. There are good tools in that shape — Aisle Planner, HoneyBook, Planning Pod — and one of them is probably right for you. Atelier is the alternative shape: software you own, runs on your hardware, your data on your disk, paid once. It is a positive choice for a specific kind of studio, not a universal upgrade.
