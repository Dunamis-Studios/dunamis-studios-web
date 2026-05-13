---
title: "Privacy notice"
description: "What Atelier collects (no business data, ever), what leaves your machine (license activation + heartbeat + an optional update check), and how Dunamis Studios relates to your data under GDPR and CCPA."
category: policies
order: 4
updated: "2026-05-10"
---

This privacy notice describes how Atelier handles data. The headline: your wedding data never leaves your machine. License activation does — exactly what gets sent and why is described below. The legal version is in [EULA §15](doc:eula).

## What we do NOT collect

Atelier collects **none** of the following from your machine:

- Wedding data (couples, dates, venues, ceremonies, anything in a wedding workspace)
- Vendor data (your vendor database, rates, contact info, notes)
- Guest data (names, contact info, dietary restrictions, RSVP status)
- Contract or document content
- Photos, mood boards, or any media you upload
- Usage analytics — what tabs you click, how long Atelier is open, which features you use
- Telemetry — performance metrics, crash reports, error pings
- Business intelligence — how many weddings you have, what your budgets look like, who your clients are

This is a hard boundary, not a default. The Atelier code does not contain the wiring to send any of the above. If a future version ever introduces optional telemetry, it will be off by default and require an explicit opt-in checkbox in Settings — see [EULA §15.4](doc:eula).

## What leaves your machine, and when

Three outbound network surfaces exist:

### 1. License activation (first launch, then per-device once)

When you paste your license key on first launch, Atelier sends a single request to `dunamisstudios.net/api/atelier/activate` with three values:

- **Your license key string** (the `ATLR-…` text you pasted)
- **A hardware fingerprint hash** — a SHA-256 of your Windows machine GUID, motherboard serial, and CPU ID. Hashed locally before being sent; the raw values never leave your machine.
- **The Atelier version you're running** (e.g. `1.0.3`)

That's the entire payload. The server records the activation and returns a confirmation. The response also includes a snapshot of your Dunamis Studios profile (your first name, last name, business name, and email) so the in-app EULA acceptance screen can render an "Accepting as:" block without making a separate authenticated round-trip. The snapshot is not retransmitted on the daily heartbeat. If your license is already activated on three devices, the server returns the list of active devices so you can deactivate one inline (the device labels and activation dates only — nothing else).

### 2. License heartbeat (once per day)

Once activated, Atelier sends a heartbeat once per day to `dunamisstudios.net/api/atelier/heartbeat` with the same three values: license key, device fingerprint hash, version. Same payload as activation. The heartbeat exists for license enforcement (catching shared keys, processing deactivations, applying revocations) and for nothing else.

If Atelier hasn't been opened in 7+ days, the heartbeat fires on next open instead of waiting for the daily window. Atelier works offline for up to 30 days between successful heartbeats; after 30 days, it locks until the next successful check-in.

### 3. Auto-update check (optional, toggleable)

On launch, Atelier asks GitHub Releases for the latest published version. The check sends only a generic GitHub Releases API request — no installation ID, no machine fingerprint, no user identification beyond what your IP and User-Agent reveal to GitHub itself. Atelier doesn't see this request; GitHub does. You can turn off update checks in **Settings → Software Updates**.

If you configure a third-party integration via Atelier's REST API — say, a script that posts new weddings to a Slack webhook — that script generates outbound traffic. The traffic is yours, going to a destination you chose, governed by your own data-handling rules. Atelier doesn't see it pass through.

## Why license activation phones home

We thought about this for a long time. The honest tradeoff:

- **What we gain:** the ability to enforce the three-device limit, process customer-initiated deactivations, handle refund-driven revocations, and resist license-sharing piracy that would make the one-time-purchase model unsustainable.
- **What we lose:** pure offline operation. Atelier needs internet on first launch and once per day after that.
- **What we don't lose:** your data privacy. The license payload is the smallest possible — license ID, device fingerprint hash, version. No business data, no usage data, no anything else.

The wedding data architectural commitment stands: it stays on your machine, in a single SQLite file you can audit, copy, or back up. License activation is a separate concern from data privacy, and the license payload is engineered to keep them separate.

## Activation and heartbeat data retention

Per [EULA §15.6](doc:eula), license activation and heartbeat records are retained by Dunamis Studios for the lifetime of your license plus seven years for tax and audit purposes. The records contain: your license ID, the hashed device fingerprints of the devices you've activated, timestamps of first activation and last heartbeat, and the Atelier versions seen. Nothing more.

## EULA acceptance records

When you accept the End User License Agreement on first launch, Atelier posts the acceptance to `dunamisstudios.net/api/atelier/record-eula-acceptance`. The server renders your personalized EULA — the document with your name, email, business name, license ID, device fingerprint, and acceptance date baked into it — and stores **the verbatim text of that document** as the legal artifact. Stored once at acceptance, never re-rendered.

The full record contains: the EULA version, your Dunamis account ID, your Atelier license ID, the timestamp of acceptance, the Atelier client version that posted it, the IP address and user-agent of the request, the device fingerprint of the activated machine, the SHA-256 of the rendered text, the substitution values used to render it, and the rendered text itself. A snapshot of your name, business name, and email at the moment of acceptance is included so a later account-email rotation doesn't rewrite the audit trail. No business data, no wedding data.

Records are append-only — a re-acceptance after an EULA version bump adds a new row alongside the prior one. You can download the verbatim accepted document for any of your acceptances directly from your customer portal at [dunamisstudios.net/account/atelier-licenses](https://dunamisstudios.net/account/atelier-licenses), or email legal@dunamisstudios.net for a copy of every record bound to your account.

## Phone-friendly day-of view

When you click **Open on phone** in day-of mode, Atelier shows a QR code and starts serving a read-only HTML view of that wedding's day-of board on your local network. This is the only Atelier surface that's reachable from anything other than the machine you installed it on, so it's worth being explicit about how it works.

**Two listeners, two scopes.** The main Atelier API is bound to `127.0.0.1` only and can't be reached from any other machine. The day-of phone view runs on a *separate* listener bound to `0.0.0.0:{api_port + 1}` (default `7424`) so devices on the same WiFi network can reach it. The two listeners share auth but not routes: the phone listener serves only two endpoints and rejects everything else.

**What's reachable from the LAN listener.** Just two URLs, both gated behind your Bearer token:

- `GET /weddings/:wedding_id/dayof`: read-only HTML page with the timeline, vendor list with tap-to-call links, recent incidents, and an incident-log form.
- `POST /weddings/:wedding_id/incidents`: accepts a logged incident from the phone form and redirects back to the day-of view.

That's the entire LAN surface. There is no way to read other weddings' data, edit any data outside the incident log, or query the rest of the API from a phone.

**Token in the QR URL.** The QR encodes a URL of the form `http://192.168.x.x:7424/weddings/{id}/dayof?token={api_key}`. The token in the URL is the same per-installation Bearer key you can rotate from **Settings → Local API**.

Two practical consequences:

- **Don't screenshot or share the QR code.** Anyone who scans it can read that wedding's day-of board and log incidents from any device on the same WiFi network until you rotate the API key or close Atelier.
- **Rotating the API key invalidates the URL.** If you rotate the key in Settings (or if you ever suspect the URL leaked), every previously-shown QR code is dead immediately. Generate a fresh one for any phone that still needs access.

**Trust your venue's WiFi.** This feature assumes the WiFi network is reasonably trusted: the planner's hotspot, the venue's staff network, your studio's WiFi. It is not designed for coffee-shop WiFi or any other network where you don't trust the other devices on it.

**Nothing leaves your network.** The phone view is served from your machine over local WiFi only. The day-of view never reaches the public internet, never reaches Dunamis Studios, never goes through a relay. If you turn the local API off in Settings, the phone listener also stops.

## The `atelier://` URL handler

Atelier registers itself as the OS handler for `atelier://` URLs so a customer who finishes Stripe checkout in their browser can be returned directly to the activation screen. This is OS-level URL handling, not a network surface: the browser tells Windows to open the link, Windows hands the URL to Atelier if installed, Atelier reads the activation parameters out of the URL. No network call happens as part of the handoff. If Atelier is not installed, the URL does nothing.

## Dunamis Sync (opt-in, sold separately)

Atelier's **Settings → Dunamis Sync** section is the entry point to Dunamis Sync, an optional cross-device subscription product sold separately from Atelier. Sync is **off by default**: a fresh install does no Sync work, generates no encryption key, makes no Sync network calls. Activation is a deliberate user action.

When Sync is activated, Atelier exchanges client-encrypted blobs with `dunamisstudios.net/api/sync/*` and `sync.dunamisstudios.net`. The encryption key is generated on your machine, stored in Windows Credential Manager, and never crosses the network. Sync v1 covers a defined entity scope (weddings, vendors, timeline events, budget lines, tasks); other record types are not synced today.

Sync has its own Terms of Service and Privacy Policy that govern the data the Sync server receives. The Atelier privacy commitments above (no business data on the activation/heartbeat surface) remain unaffected by Sync state. Cancelling Sync never affects Atelier's perpetual license; cancelling Atelier never affects a Sync subscription.

## Where your data lives

In a single SQLite file at `%APPDATA%\studios.dunamis.atelier\atelier.sqlite`, on your machine. Plus any image files you uploaded to the Style or Logo features, in the same directory tree. That's it.

Dunamis Studios does not have a copy of this file. We cannot recover it if you lose it. We cannot inspect it remotely. If you sync the file to your own cloud (OneDrive, Dropbox, etc.) — see [first-run § backing up](doc:first-run) — that's your sync, between your machine and your cloud account. Dunamis Studios is not a party to it.

## Your clients' data

Atelier is a tool for managing your clients' wedding planning, which means your clients' personal information passes through it: names, addresses, phone numbers, email addresses, dietary restrictions, family relationships, and so on.

That data is yours and your clients'. Dunamis Studios is not the data controller, not the data processor, and not a sub-processor under the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), or any similar privacy regulation. You remain the sole controller of your clients' personal data.

This means:

- **You don't need a Data Processing Agreement (DPA) with Dunamis Studios for the Atelier software itself.** A DPA is a contract between a data controller and a data processor; we are neither for your client data, because we never see it. (If your clients ask about your tooling, you can point them at this page.)
- **You're responsible for your own GDPR/CCPA compliance.** That includes handling data-subject requests (access, deletion, portability), maintaining security on your machine where the data lives, and any DPAs with downstream services you integrate Atelier with.
- **If Atelier has a security vulnerability that lets data leak**, we'll fix it under the [bug fix policy](doc:bug-fix-policy). But the responsibility for your machine's overall security posture (disk encryption, OS updates, who has physical access to your laptop) is yours.

## Future telemetry

A future version of Atelier may introduce optional telemetry — for example, anonymous crash reports or feature-usage metrics. If we ever do introduce telemetry, three commitments stand:

1. **Off by default.** Telemetry will be opt-in, with a clearly labeled checkbox in Settings.
2. **No per-customer ID by default.** Crash reports won't include your installation's license ID or any other linkable identifier unless you explicitly opt in to that level.
3. **Disclosed before introduction.** When telemetry is added, it will be announced in release notes and on the marketing page before the version that includes it ships, so customers can decline the upgrade if they prefer.

This is the same commitment in [EULA §15.4](doc:eula). It is not abstract — telemetry is a legitimate engineering tool, and we may eventually want it, but introducing it without affirmative consent would betray the standing commitment customers paid for.

## Marketing reference

Per [EULA §17](doc:eula), we reserve the right to publicly reference your business name and industry as a Dunamis Studios customer for case study, portfolio, or social-proof purposes — for example, "Acme Weddings uses Atelier" on the product page. You can opt out by emailing legal@dunamisstudios.net at any time. We will not use your logo, photographs, your clients' names, or any client work product without separate written permission from you.

## Cookies and trackers on this website

Separate from Atelier-the-software is dunamisstudios.net, this website. The website uses Vercel Analytics for aggregate visit metrics. It does not use third-party advertising trackers. The website's privacy disclosure is at [dunamisstudios.net/privacy](https://dunamisstudios.net/privacy) and applies to the website only — not to the Atelier software.

## Contacting us

Questions about this privacy notice should be directed to **legal@dunamisstudios.net**. The same address handles licensing, support, and bug reports.
