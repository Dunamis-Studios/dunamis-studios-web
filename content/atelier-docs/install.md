---
title: "Install guide"
description: "How to install Atelier on Windows 10 or 11, from download to first launch."
category: getting-started
order: 1
updated: "2026-05-09"
---

This guide walks through installing Atelier on a Windows machine and getting to the first launch. Allow about ten minutes the first time through.

## Activation, in plain terms

Before you install, three facts about how Atelier handles licenses — these surface during first launch and worth knowing in advance:

- **Up to 3 devices per license.** A single Atelier license activates on up to three computers concurrently. You can deactivate any device at any time from inside Atelier (**Settings → License**) or from the customer portal at `dunamisstudios.net/account/atelier-licenses` to free a slot for a new device.
- **First launch needs internet.** Atelier verifies the license against the activation server on first launch. You have a 7-day provisional grace period if you're offline at first launch — Atelier will work, but it'll attempt activation each subsequent launch and lock if it can't reach the server within 7 days.
- **30-day offline grace after activation.** Once activated, Atelier checks in with the server about once per day and works offline for up to 30 days between successful check-ins. The day-of mode at the venue, working from a hotel, traveling for destination weddings — none of those scenarios are an issue. A laptop that hasn't seen the internet in over a month is.

The heartbeat payload is small (license ID, hashed hardware fingerprint, version) and contains zero business data. See the [privacy notice](doc:privacy) for the exact contract.

## System requirements

- **Operating system:** Windows 10 (version 1809 or later) or Windows 11. Windows Server is not officially supported but works on Server 2019 / 2022 in our testing.
- **Architecture:** 64-bit only. Atelier does not ship a 32-bit build.
- **Disk space:** 200 MB free for the install, plus room for your data. A typical studio's database is under 50 MB after a year of use; storage is not a meaningful concern.
- **Memory:** 4 GB RAM minimum, 8 GB recommended.
- **WebView2 runtime:** Pre-installed on Windows 11. On Windows 10, the installer will prompt to install it if missing — accept the prompt.

Atelier does not require .NET, Java, Python, or any other runtime. It is a single self-contained Windows binary.

## Download

Download the installer from [https://dunamisstudios.net/atelier/download](https://dunamisstudios.net/atelier/download). The file is named `Atelier-Setup-{version}.exe`.

Save it somewhere you'll find it again — your Downloads folder is fine.

## SmartScreen warning

When you run the installer for the first time, Windows SmartScreen will likely show a warning that says **"Windows protected your PC"** or **"unrecognized publisher"**. This is expected.

Atelier is not yet code-signed with an Authenticode certificate. We're a small studio and the cost-benefit on a code-signing cert hasn't crossed our threshold for v1 — we'd rather pass the savings to customers as a one-time license price. The downside is this SmartScreen warning, which we acknowledge is not great UX.

To proceed:

1. Click **More info** on the warning dialog.
2. Click **Run anyway**.

If you're uncomfortable running unsigned software, that's a reasonable position. The installer is open to inspection — the source ships with the install once it lands, and you can verify the binary's SHA-256 against the checksum published at [/atelier/download#checksum](https://dunamisstudios.net/atelier/download#checksum). If you'd rather wait until we sign the binary, email us — we'll let you know when that happens.

## Installer wizard

The installer is a standard Windows wizard with a few decisions to make:

- **Install location.** Default is `C:\Program Files\Atelier\`. Change it if you'd rather install per-user (no admin needed) at `%LOCALAPPDATA%\Atelier\`. Either is fine.
- **Start menu shortcut.** Yes by default. Leaves an Atelier entry under the studio name in Start.
- **Desktop shortcut.** Off by default. Turn on if you'd rather click an icon on the desktop than open Start.
- **Launch on install.** On by default. Atelier opens to the EULA acceptance screen as soon as the install finishes.

The installer's only mandatory registry write is the standard uninstall registration entry. The optional **Launch Atelier when Windows starts** task, if you tick it during install, also adds a per-user `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` entry that re-runs the binary at logon. Both writes are unwound by the uninstaller. The installer does not install drivers, services, or background tasks.

## First launch

The first time Atelier opens, three things happen in order:

1. **License key entry.** Paste the license key you received in your purchase confirmation email. The key starts with `ATLR-` and is a single line of base64-style text. On first paste, Atelier verifies the signature locally and then makes one HTTPS call to `dunamisstudios.net/api/atelier/activate` carrying the license string, hashed machine fingerprint, and Atelier version. The activation server records the slot, returns an activation token, and includes a snapshot of your Dunamis Studios profile (name, business, email) for the next step. See [what's included § What network calls Atelier makes](doc:whats-included) for the full activation surface.
2. **EULA acceptance.** A scrollable view of the [End User License Agreement](doc:eula) with an "Accepting as:" block pre-populated from the customer profile snapshot. Read it, scroll to the bottom, tick the acknowledgement, and click **Accept**. The acceptance is recorded both locally and against your Dunamis Studios account so the audit trail survives reinstalls.
3. **Setup screen.** Display name, business name, time zone, and an optional logo, mostly pre-filled from the same Dunamis Studios profile. Editable. See the [first-time setup guide](doc:first-run) for the details on each field.

After the wizard, Atelier opens to the multi-wedding dashboard. The first time it's empty — that's expected.

## Upgrading from a previous version

Atelier checks for updates on launch by default, against the GitHub Releases for the current major version. When a new minor version is available, you'll see a small badge in **Settings → Software Updates**. Click through, read the release notes, and click **Download and install**. The updater downloads the patch, verifies the signature against an embedded public key, and re-launches Atelier into the updated build.

You can disable update checks in **Settings → Software Updates**. Toggling that off stops the daily GitHub release check. Atelier's licensing check-in (the daily heartbeat to `dunamisstudios.net/api/atelier/heartbeat`) continues regardless — it's required for license enforcement and is independent of the update toggle. See the [privacy notice](doc:privacy) for the full list of what does and doesn't leave your machine.

Major version upgrades (v2, v3) are separate paid purchases and are not delivered through the auto-updater. When a new major version is available, you'll receive an email with a discount code and a link — see the [bug fix policy](doc:bug-fix-policy) for the major-version policy.

## Uninstalling

Atelier installs through Windows' standard installer infrastructure, so it shows up in **Settings → Apps → Installed apps**. Uninstall from there.

Two things to know about uninstall:

- The uninstaller removes the program files, but **does not remove your data**. Your wedding database lives at `%APPDATA%\studios.dunamis.atelier\atelier.sqlite` and stays put unless you delete it manually. This is intentional — accidentally re-installing shouldn't lose a year of work. If you want a clean wipe, delete that file after uninstall.
- Your license key is yours. Save it somewhere safe before uninstalling if you might want to re-install later. We can re-issue lost keys (see [troubleshooting](doc:troubleshooting)), but it's faster if you have it on hand.

If you're thinking of uninstalling because of a problem, the [troubleshooting guide](doc:troubleshooting) covers the common ones. If it's a refund question, see the [refund policy](doc:refund-policy).
