---
title: "Privacy notice"
description: "What Atelier collects (nothing by default), what leaves your machine (one optional update check), and how Dunamis Studios relates to your data under GDPR and CCPA."
category: policies
order: 4
updated: "2026-05-07"
---

This privacy notice describes how Atelier handles data. The short version: it doesn't. The long version is below, and the legal version is in [EULA §15](doc:eula).

## What Atelier collects from your machine

Nothing by default. No telemetry, no analytics, no usage tracking, no crash reporter, no error pings. Atelier runs entirely on your local machine. There is no Atelier-side dashboard at Dunamis Studios that watches what you do.

This is a deliberate architectural commitment, not an oversight. The shape of the product — a desktop application running locally, paid once, owned forever — is incompatible with usage tracking. We do not get useful data out of it that would justify the trust cost, and our customers (professional wedding planners) handle other people's life events under expectations of discretion. The only acceptable answer is to not collect.

## What leaves your machine, and when

Exactly one outbound network call exists in Atelier v1, and it is optional and toggleable:

- **Auto-update check.** On launch, Atelier asks GitHub Releases for the latest published Atelier release version. If a newer version exists, the badge in **Settings → Software Updates** lights up. The check sends only a generic GitHub Releases API request — no installation ID, no machine fingerprint, no user identification beyond what your IP and User-Agent reveal to GitHub itself. Atelier doesn't see this request; GitHub does. You can turn off update checks in **Settings → Software Updates**, and that toggle stops every outbound network call from Atelier.

The license activation flow does **not** send anything to any server. License keys are signed by Dunamis Studios at issuance, and Atelier verifies the signature locally against a public key embedded in the binary. No network traffic, no phone-home, no online activation step.

If you configure a third-party integration via Atelier's REST API — say, a script that posts new weddings to a Slack webhook — that script generates outbound traffic. The traffic is yours, going to a destination you chose, governed by your own data-handling rules. Atelier doesn't see it pass through.

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

Per [EULA §17](doc:eula), we reserve the right to publicly reference your business name and industry as a Dunamis Studios customer for case study, portfolio, or social-proof purposes — for example, "Acme Weddings uses Atelier" on the product page. You can opt out by emailing legal@dunamisstudios.com at any time. We will not use your logo, photographs, your clients' names, or any client work product without separate written permission from you.

## Cookies and trackers on this website

Separate from Atelier-the-software is dunamisstudios.net, this website. The website uses Vercel Analytics for aggregate visit metrics. It does not use third-party advertising trackers. The website's privacy disclosure is at [dunamisstudios.net/privacy](https://dunamisstudios.net/privacy) and applies to the website only — not to the Atelier software.

## Contacting us

Questions about this privacy notice should be directed to **legal@dunamisstudios.com**. The same address handles licensing, support, and bug reports.
