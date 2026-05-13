---
title: "Bug fix policy"
description: "Atelier's commitment to free bug fixes for the lifetime of the major version, the major-version upgrade model, and how to report a bug."
category: policies
order: 1
updated: "2026-05-09"
---

The current policy is **indefinite free bug fixes** for the major version you purchased — no time limit, no support-renewal cycle.

## The commitment

> Bug fixes are free indefinitely for the major version you purchased. Atelier is supported with bug fixes and security patches for as long as Dunamis Studios continues to operate the major version.

This is the standing commitment. There is no expiration date attached to your license, no support-renewal email, no "your support window has ended" notification. You bought a perpetual license; bug fixes for that license are part of what you bought.

The legal version of this commitment is in [EULA §10](doc:eula). The relevant clauses:

- §10.1: Bug fixes and minor version updates within the same major version are provided at no additional charge for as long as Dunamis Studios continues to operate that major version.
- §10.2: Continued operation of a major version is a commercial commitment, not an open-ended legal guarantee. Dunamis Studios reserves the right to discontinue support for a particular major version with reasonable advance notice. Discontinuation does not affect your right to continue using the version you purchased.
- §11.1: Bug-fix support is best-effort, not SLA-guaranteed. We respond and we fix, but we don't promise a specific turnaround.

## Major versions are separate

Atelier follows a major-version release cadence. v1 is the current major version. v2, v3, and so on are not yet planned with specific dates — when they ship, they ship.

When a new major version ships:

- It is a separate paid purchase, not a forced upgrade.
- Existing customers receive **30% loyalty pricing on every major upgrade for life**. The loyalty discount is not a one-time thing — it stacks across major versions, so v3 is also 30% off for v1/v2 owners.
- Your existing major version continues to receive bug fixes and security patches as long as we operate it. You can stay on v1 indefinitely if you don't need v2's new features.
- The auto-updater never silently upgrades you across a major version. The upgrade is always a deliberate, paid decision on your part.

This model is the deal: you buy a major, you own it forever, you get free bug fixes for it forever, and if you want the new shiny thing in v2 you pay a discounted upgrade price. Nobody gets surprised, nobody gets locked out, nobody pays a subscription.

## Reporting a bug

The fastest path is email. Send to **legal@dunamisstudios.net** (the same address handles bug reports, support questions, and licensing issues — small studio, single inbox).

What helps us fix it faster:

- **What you were trying to do.** "I was trying to print a Timeline PDF for the Smith wedding."
- **What happened.** "Atelier showed an error popup that said `Unable to render PDF: missing logo`."
- **What you expected.** "I expected the PDF to render with no logo since I haven't uploaded one yet."
- **Atelier version.** Visible at **Settings → Software updates → Current version**.
- **Windows version.** Settings → System → About in Windows. Specifically the OS build number.
- **A screenshot if it's a UI bug.** Attaching the screenshot is faster than describing the visual.

If you're comfortable on GitHub, public bug reports go in our issue tracker at [github.com/Dunamis-Studios/atelier-issues](https://github.com/Dunamis-Studios/atelier-issues) — same response, more visible to other customers who might be hitting the same thing.

## Severity and response expectations

We don't promise SLAs (see [EULA §11](doc:eula)), but here's what we actually do:

- **App is unusable / data at risk.** Highest priority. We respond within one business day with at minimum a "we're looking at this" acknowledgment, and we work the issue continuously until it's resolved or a workaround is in your hands. If your data is at risk, we'll get on a call.
- **Feature broken but workaround exists.** We respond within two-to-three business days with a workaround if one exists, and we schedule the fix for the next minor version. Most customer-reported bugs land in this bucket.
- **Cosmetic / minor / unclear.** We respond when we get to it, usually within a week. We may ask for more details before triaging.

Bug fixes ship through the auto-updater. When a fix is in, you get the patched build automatically (or manually, if you've turned off auto-update — the patch is in the next minor version released).

## What counts as a bug vs. a feature request

A bug is the app doing something it shouldn't, or failing to do something it claims to do. A feature request is the app not yet doing something we never said it would.

Examples:

- **Bug.** "Timeline PDF export fails with an error when no logo is set." (The app should handle that case.)
- **Bug.** "Day-of mode shows the wrong time for an event after I edit it." (The displayed value should match the saved value.)
- **Feature request.** "Atelier should sync with Google Calendar." (We don't claim it does, and we haven't agreed to build it.)
- **Feature request.** "I want a Mac build." (Out of scope for v1.)

Feature requests aren't bugs and aren't covered by the bug-fix policy. They're either on the roadmap, off the roadmap, or candidates for [post-purchase custom development](doc:eula#11-support-and-custom-engagements). Reply or forward to legal@dunamisstudios.net and we'll let you know which bucket your request lands in.

## What this policy does not cover

- **Issues with third-party software.** If Windows Update breaks something Atelier depends on, we'll work around it where we can, but Microsoft is the responsible party for the underlying break.
- **Hardware failures.** A failed drive that takes your `atelier.sqlite` with it is not something we can fix. Back up your data — see [first-run § backing up](doc:first-run) for three approaches.
- **Issues with your own customizations.** If you've modified Atelier's source code (which the [EULA](doc:eula) permits for internal business use), bugs in your modifications are yours. We'll help you debug if it's something we can spot quickly, but ongoing support for your fork is a separate engagement.
- **Issues caused by environmental misconfiguration.** Antivirus software quarantining the binary, group-policy lockdowns preventing local file access, that sort of thing. We'll diagnose and recommend a path forward, but the fix is yours to apply.

The honest framing: this policy covers the software we ship, behaving correctly per its own claims, on a supported configuration. Beyond that boundary, we'll help where we can — we're not the kind of studio that hides behind support boundaries — but those issues aren't covered by the standing commitment.

## How fixes are delivered

Bug fixes ship as part of normal updates through the auto-updater. The auto-update check runs alongside the daily license heartbeat — they share the same outbound network event. When a fix is in, the next successful heartbeat surfaces the new build in **Settings → Software Updates** and you can install it with one click.

Customers running offline beyond the [30-day grace period](doc:user-guide#the-30-day-offline-grace-in-detail) are locked out until the next successful heartbeat, which means they also won't pull updates until they come online and re-activate. The "I'm running an air-gapped install for compliance reasons" scenario isn't supported in v1 — Atelier is designed for studios on regular internet, not for fully isolated environments.

