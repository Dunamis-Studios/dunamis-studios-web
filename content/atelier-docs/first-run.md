---
title: "First-time setup"
description: "Walking through the Atelier setup screen, configuring your studio profile, and finding your data on disk."
category: getting-started
order: 2
updated: "2026-05-09"
---

After the [install](doc:install) finishes — and after you've activated your license and accepted the EULA on first launch — Atelier shows a one-time setup screen. This page covers what each field is asking and where Atelier stores the answers.

## The setup screen

A single screen with four fields. Every value is pre-filled from your Dunamis Studios account where one exists, editable in place, and changeable later from **Settings → Studio profile**.

### Display name

The name Atelier uses to greet you in the dashboard ("Hey, Pat") and on PDF exports of contracts and timelines. Pre-fills from your Dunamis Studios profile's first name. Edit if you want the in-app greeting to use a nickname or shorter form.

### Business name

The legal entity that gets paid. Shows up on invoices, contracts, and tax documents Atelier generates. If you operate as a sole proprietorship under your own name, this is your name. If you operate as an LLC, this is the LLC's registered name. Pre-fills from your Dunamis Studios profile's business name when set.

### Time zone

The time zone Atelier uses when interpreting wedding dates, day-of mode, calendar events, and notifications. Pre-fills from your Dunamis Studios profile when set, otherwise from your Windows system time zone (which is correct for almost everyone). Change it only if your studio operates in a time zone different from the machine's clock — for example, if you travel for destination weddings and want event times in the venue's local time, set Atelier on the venue's zone for that trip.

The time zone field accepts standard IANA names: `America/New_York`, `Europe/London`, `Pacific/Auckland`, etc. The field offers autocomplete on the common ones.

### Logo (optional)

A PNG, JPEG, SVG, or WebP to use on contract and invoice exports. Logos upload to your Dunamis Studios account so they're available across any future Atelier install you sign into; nothing is copied locally. Pre-renders if your account already has a logo from a prior session or settings page edit.

Recommended: 800×200 pixels at minimum, transparent background if PNG/SVG. Atelier scales the logo down to fit the document header and won't enlarge it past its native resolution. Square logos work but tend to look squat in document headers; landscape orientation reads better.

You can skip this step and add the logo later. Skipping is the right move if you don't have a finalized logo yet — exports without a logo simply use the business name in display type, which is perfectly readable.

## Finishing setup

Click **Save and continue**. Atelier writes the values to your Dunamis Studios account and opens the multi-wedding dashboard, which is empty until you add your first wedding. The empty state has a "Create your first wedding" button — that's the entry point for [the user guide](doc:user-guide).

If your Dunamis Studios account already has display name, business name, and time zone all set when this screen would render — typical of a second Atelier install on the same account — Atelier skips the screen entirely and opens the dashboard directly.

## Where your data lives

Everything Atelier persists locally is in a single directory:

```
%APPDATA%\studios.dunamis.atelier\
└── atelier.sqlite          ← your wedding database
```

`%APPDATA%` resolves to `C:\Users\{your username}\AppData\Roaming`. Note that AppData is hidden by default in File Explorer — type the path into the address bar to navigate there directly, or enable **View → Hidden items** in Explorer.

`atelier.sqlite` is a standard SQLite database file. You can open it with any SQLite browser (DB Browser for SQLite is the popular free one) to inspect tables and verify what's stored. The schema is documented in the [API reference](doc:api-reference) — every table the API exposes is a real table in this file.

Your studio profile (display name, business name, time zone, logo) lives on your Dunamis Studios account, not in `atelier.sqlite`, so it follows you to any new Atelier install you sign into.

Once installed and running, Atelier itself doesn't write outside this directory or modify global Windows state. The optional **Launch Atelier when Windows starts** task you may have ticked during install adds a one-time `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` entry — that's an installer-time event, not a per-run write, and the uninstaller removes it.

## Backing up your data

Atelier does not include automatic cloud backups (and won't — see [what's included](doc:whats-included) for why). Backing up is your responsibility. Three options:

- **Manual file copy.** Periodically copy `atelier.sqlite` somewhere safe. A flash drive, a NAS, a personal cloud account — anywhere that isn't the same machine. Copy while Atelier is closed; copying while Atelier is running can produce a partial file.
- **Synced folder.** Point a OneDrive, Dropbox, or Google Drive folder at `%APPDATA%\studios.dunamis.atelier\` and let it sync continuously. This works, but the sync provider's behavior on locked files (Atelier holds an exclusive lock while running) is sometimes flaky — verify after the first sync that the file actually went up.
- **Scheduled backup.** A Windows scheduled task that copies the database to a target location nightly. We have a sample PowerShell script we can email you on request — it's a few lines, but the right shape depends on where you want backups to land.

The data file is portable. If your machine fails, install Atelier on a new machine, copy `atelier.sqlite` from your backup into the new machine's `%APPDATA%\studios.dunamis.atelier\` directory before launching Atelier the first time, and the new install picks up your data on first launch (you'll skip the setup screen since your studio profile is already on your account).

## Importing data from other tools

Atelier does not include a built-in importer for spreadsheets, Aisle Planner, HoneyBook, Planning Pod, or any other planning tool. We didn't build one for v1 because every export format we looked at was different, and a "good" importer for one tool is a fragile importer for the next.

If you have data in another tool, two paths:

1. **Manual entry.** Painful but reliable. Atelier's data model is structured enough that re-entering a current wedding takes 20-30 minutes. For studios with a backlog of weddings, this is realistically the right answer for the active ones — you won't reference last year's weddings as often as you think you will.
2. **REST API import.** The localhost REST API on port 7423 (documented in the [API reference](doc:api-reference)) supports creating every entity Atelier stores. If you can get your data into a CSV, JSON, or any structured form, a 50-line Python script can bulk-create weddings, vendors, and budget lines. We can scope this as a paid post-purchase engagement — see the [bug fix policy](doc:bug-fix-policy) for how the engagement model works.

For studios deciding between the two, our honest recommendation: start with manual entry on your two or three active weddings. If you find Atelier is the right tool, the API import is straightforward and we'll help you scope it.
