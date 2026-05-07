---
title: "First-time setup"
description: "Walking through the Atelier setup wizard, configuring your studio profile, and finding your data on disk."
category: getting-started
order: 2
updated: "2026-05-07"
---

After the [install](doc:install) finishes and you've accepted the EULA and entered your license key, Atelier walks you through a one-time setup wizard. This page covers what each step is asking and where Atelier stores the answers.

## The setup wizard

Four steps, none required to be filled out perfectly the first time — every value is editable later from **Settings → Studio profile**.

### Studio name

The display name your studio uses with clients. Shows up at the top of the app, on PDF exports of contracts and timelines, and in email subjects when you use Atelier's email-draft feature. Your studio name and business name (next step) can be the same; they don't have to be.

### Business name

The legal entity that gets paid. Shows up on invoices, contracts, and tax documents Atelier generates. If you operate as a sole proprietorship under your own name, this is your name. If you operate as an LLC, this is the LLC's registered name.

### Time zone

The time zone Atelier uses when interpreting wedding dates, day-of mode, calendar events, and notifications. Defaults to your Windows system time zone, which is correct for almost everyone. Change it only if your studio operates in a time zone different from the machine's clock — for example, if you travel for destination weddings and want event times in the venue's local time, leave Atelier on the venue's zone for that trip.

The time zone field accepts standard IANA names: `America/New_York`, `Europe/London`, `Pacific/Auckland`, etc. The field offers autocomplete on the common ones.

### Logo (optional)

A PNG or JPEG to use on contract and invoice exports. Atelier copies the file into the app data directory at `%APPDATA%\studios.dunamis.atelier\logos\planner-logo.{ext}` so deleting the original doesn't break exports later.

Recommended: 800×200 pixels at minimum, transparent background if PNG. Atelier scales the logo down to fit the document header and won't enlarge it past its native resolution. Square logos work but tend to look squat in document headers; landscape orientation reads better.

You can skip this step and add the logo later. Skipping is the right move if you don't have a finalized logo yet — exports without a logo simply use the studio name in display type, which is perfectly readable.

## Finishing the wizard

The wizard's last screen says "You're set up." Click through. Atelier opens the multi-wedding dashboard, which is empty until you add your first wedding. The empty state has a "Create your first wedding" button — that's the entry point for [the user guide](doc:user-guide).

## Where your data lives

Everything Atelier persists is in a single directory:

```
%APPDATA%\studios.dunamis.atelier\
├── atelier.sqlite          ← your wedding database
└── logos\
    └── planner-logo.png    ← copied from the wizard step above
```

`%APPDATA%` resolves to `C:\Users\{your username}\AppData\Roaming`. Note that AppData is hidden by default in File Explorer — type the path into the address bar to navigate there directly, or enable **View → Hidden items** in Explorer.

`atelier.sqlite` is a standard SQLite database file. You can open it with any SQLite browser (DB Browser for SQLite is the popular free one) to inspect tables and verify what's stored. The schema is documented in the [API reference](doc:api-reference) — every table the API exposes is a real table in this file.

Atelier never writes outside this directory. It does not write to the registry, does not create background tasks, does not modify any global Windows state.

## Backing up your data

Atelier does not include automatic cloud backups (and won't — see [what's included](doc:whats-included) for why). Backing up is your responsibility. Three options:

- **Manual file copy.** Periodically copy `atelier.sqlite` somewhere safe. A flash drive, a NAS, a personal cloud account — anywhere that isn't the same machine. Copy while Atelier is closed; copying while Atelier is running can produce a partial file.
- **Synced folder.** Point a OneDrive, Dropbox, or Google Drive folder at `%APPDATA%\studios.dunamis.atelier\` and let it sync continuously. This works, but the sync provider's behavior on locked files (Atelier holds an exclusive lock while running) is sometimes flaky — verify after the first sync that the file actually went up.
- **Scheduled backup.** A Windows scheduled task that copies the database to a target location nightly. We have a sample PowerShell script we can email you on request — it's a few lines, but the right shape depends on where you want backups to land.

The data file is portable. If your machine fails, install Atelier on a new machine, copy `atelier.sqlite` from your backup into the new machine's `%APPDATA%\studios.dunamis.atelier\` directory before launching Atelier the first time, and the new install picks up your data on first launch (you'll skip the setup wizard since the database is already populated).

## Importing data from other tools

Atelier does not include a built-in importer for spreadsheets, Aisle Planner, HoneyBook, Planning Pod, or any other planning tool. We didn't build one for v1 because every export format we looked at was different, and a "good" importer for one tool is a fragile importer for the next.

If you have data in another tool, two paths:

1. **Manual entry.** Painful but reliable. Atelier's data model is structured enough that re-entering a current wedding takes 20-30 minutes. For studios with a backlog of weddings, this is realistically the right answer for the active ones — you won't reference last year's weddings as often as you think you will.
2. **REST API import.** The localhost REST API on port 7423 (documented in the [API reference](doc:api-reference)) supports creating every entity Atelier stores. If you can get your data into a CSV, JSON, or any structured form, a 50-line Python script can bulk-create weddings, vendors, and budget lines. We can scope this as a paid post-purchase engagement — see the [bug fix policy](doc:bug-fix-policy) for how the engagement model works.

For studios deciding between the two, our honest recommendation: start with manual entry on your two or three active weddings. If you find Atelier is the right tool, the API import is straightforward and we'll help you scope it.
