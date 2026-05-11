---
title: "User guide"
description: "Day-to-day Atelier: the dashboard, weddings, timelines, vendors, budgets, payments, contracts, and the day-of mode."
category: using-atelier
order: 1
updated: "2026-05-09"
---

> **What ships today vs. what's on the v1 roadmap.** This guide is the v1 product vision and most of it is in active development. The current Atelier build supports the multi-wedding **dashboard**, the **add-wedding** form, the wedding **detail** view, **license activation and management** (Settings → License), and the **first-time setup screen**. The eleven-tab wedding workspace (Timeline, Vendors, Guests, Seating, Style, Budget, Payments, Documents, Contracts, Tasks, Notes), **day-of mode**, the **vendor database**, **templates**, the **milestone playbook**, the **calendar view**, **reports**, **notifications**, and the **local REST API panel** ship in subsequent v1 slices in roughly the order they appear below. Sections describing those features are accurate descriptions of how they will work — but if you install Atelier today, you won't see them yet. The release notes for each minor version flag which guide section newly went live.

This guide walks through Atelier as a working planner uses it. Read it cover to cover the first week to build a mental model; come back to specific sections as needed.

## Layout overview

Atelier opens to a multi-wedding dashboard. The top navigation has three regions:

- **Left:** the studio name (clicking returns to the dashboard) and the primary section nav — Leads, Proposals, Tasks, Vendors, Templates, Payments, Disbursements, Calendar, Reports.
- **Center:** the active wedding, when one is open. Clicking it returns to that wedding's workspace.
- **Right:** the bell icon (notifications), the calendar quick-view, and the settings gear.

Most of the time you'll be inside a wedding, in one of its eleven workspace tabs. The top-level sections are for cross-wedding work — managing your CRM pipeline, tracking money, generating reports, and so on.

## The CRM pipeline

Atelier's leads-to-wedding flow is a three-stage CRM:

1. **Leads** — inquiries. A new lead starts here with whatever you have: name, email, wedding date guess, source. Drag the card across columns (`New`, `Contacted`, `Proposal sent`, `Won`, `Lost`) as the conversation progresses.
2. **Proposals** — when a lead is ready for a quote, build a proposal from a template. The proposal is a structured document with sections, line items, totals, and a per-proposal expiration date. Click **Send** to generate a PDF and copy a sharable summary to your clipboard.
3. **Convert to wedding** — when a proposal is accepted, click **Convert to wedding** on the proposal detail page. Atelier creates a full wedding workspace pre-populated with the couple's names, the date, the budget skeleton from the accepted proposal, and the vendor list. The original proposal is preserved on the wedding's Documents tab.

Leads and proposals stay searchable forever. You can filter the lead pipeline by source, by month, by team-member assignment, or by source attribution.

## Creating a wedding directly

Not every wedding starts as a lead. From the dashboard, click **Add wedding**. The dialog asks:

- Couple's names (required)
- Wedding date (required)
- Venue (optional but useful for Calendar coloring)
- Lead source (optional — set if you remember; you can update later)
- Assigned planner (defaults to you)

Click **Create**. Atelier opens the new wedding's workspace at the Timeline tab.

## The eleven-tab wedding workspace

Each wedding has its own workspace with eleven tabs. The order is intentional — it follows the rough chronology of how a wedding is built.

### Timeline

The day-of run-of-show. Events with start times, durations, locations, and per-event vendor assignments. Build it from a [template](doc:user-guide#templates-that-capture-your-playbook) or from scratch.

The Timeline tab supports both list and Gantt-strip views. Drag events to reorder, click an event to edit, click the small + between events to insert a new one. Each event has fields for:

- Start time + duration (Atelier computes end time automatically)
- Title and one-line description
- Location (free-text, but Atelier suggests recently-used venues)
- Vendor assignments (multi-select against the wedding's vendor list)
- Notes for the day-of (markdown supported, shown in day-of mode)

Click **Print** at the top right to export the Timeline as a PDF formatted for the day-of binder. The PDF respects your studio profile's logo if you uploaded one during [first-time setup](doc:first-run).

### Vendors

The wedding's vendor list. Each entry pulls from your top-level [Vendor database](doc:user-guide#the-vendor-database) but can be customized per-wedding (different rate, different scope, different contact at the same vendor).

Per-wedding vendor entries track:

- Status: contacted, contracted, paid in full, etc.
- Total fee, deposit paid, balance owed
- Per-vendor notes (where Atelier remembers things like "Maria handles weekends, Tony weekdays")
- Contracts and email threads (linked from the Documents tab)

### Guests

The guest list. Each entry has a name, contact info, RSVP status, dietary restrictions, plus-one details, and a meal selection. Bulk-import from a CSV via **Import** or paste from a spreadsheet.

The Guests tab also shows the master count summary — confirmed adults, kids, plus-ones, vendors who eat — with separate counts for ceremony, cocktail hour, and reception. The summary updates live as RSVPs change.

### Seating

The reception seating chart. Drag tables onto the canvas, drag guests onto tables. Atelier shows per-table count limits and warns when you exceed them. The seating chart respects your guests' dietary and plus-one info — hover a guest card to see allergies and family relationships before placing them next to specific people.

Click **Print** to export the seating chart as a PDF for the venue and the catering manager.

### Style

Vision board, color palette, mood board. Drop image files onto the canvas or paste from clipboard. Atelier copies images into the wedding's local asset folder so the original files can be moved or deleted without breaking the board. Color palette stores hex codes you can copy to share with vendors.

Style is intentionally lightweight — we're not trying to replace Pinterest. The use case is "I need to remember the exact navy the couple chose," not "I need to design the wedding from scratch."

### Budget

Per-wedding budget tracker. Line items grouped by category (Venue, Catering, Florals, Music, etc.), each with an estimated amount and an actual amount. The totals row at the top shows estimate vs. actual vs. paid, with a running variance.

The Budget tab is bidirectionally connected to Payments. When a payment lands and is allocated against a budget line, the line's "paid" total updates automatically. You don't have to maintain the cross-reference manually — Atelier maintains a `paid_amount` cache on each budget line that tracks `SUM(payment_allocations)`.

### Payments

Money coming in. Each payment record has a date, an amount, a method (check, ACH, Stripe, cash, etc.), a payer, and an allocation against one or more budget lines. The payment can be split across multiple budget lines if a single check covers multiple categories.

The top of the tab shows a summary: total paid, total outstanding, percentage paid. Filter by date range or by allocated category to slice the data.

### Documents

Every file attached to the wedding: contracts, proposals, vendor invoices, copies of the Timeline PDF you printed for the day-of binder, etc. Drag files onto the tab to upload, or click **Add** to browse.

Documents are stored on disk in the wedding's local asset folder, not in the SQLite database. The database tracks the file's logical name, content hash, upload date, and per-file notes; the file itself is on disk where you can copy or back it up directly.

### Contracts

Generated from a contract template. Templates live at the studio level (**Settings → Document templates**) and produce a per-wedding contract pre-filled with the couple's names, the wedding date, the vendors involved, and the budget terms. Click **Generate** to produce a contract from a template; click **Print** to export the contract as a PDF.

Contracts are versioned — every regeneration creates a new version, the old one is preserved. Useful when terms change mid-engagement.

### Tasks

Per-wedding to-do list. Each task has a title, an owner (you, a team member, or a vendor), a due date, and a status. The Tasks tab is also where the [milestone playbook](doc:user-guide#the-milestone-playbook) surfaces overdue or due-soon items.

Tasks integrate with notifications — overdue and due-soon tasks appear in the bell icon and, optionally, as Windows tray notifications.

### Notes

Free-text notes on the wedding. Markdown supported. Use it for the things that don't fit anywhere else — the couple's anniversary preferences, the venue manager's quirks, the bride's brother who can't be seated next to anyone from the dad's side.

Notes are searchable from the wedding workspace's search bar.

## Day-of mode

The day-of mode is the in-app run-of-show view designed for the planner working a wedding at the venue. Click **Day-of** in the wedding's top navigation to open it.

What's different in day-of mode:

- **Live current event.** Whichever event is in progress is bumped to the top of the page in a highlighted card. Surrounding events stay in the list at lower contrast.
- **Status flips.** Each event has Start / Complete / Skip controls. Tapping flips the status and timestamps it; the in-progress card moves on automatically.
- **Tappable vendor numbers.** Vendor phone numbers render as `tel:` links so tapping dials.
- **Incident capture.** A persistent "Log incident" button records timestamped notes (DJ ran late, bridesmaid lost the boutonniere). Incidents land in the wedding's Notes tab with timestamps for the post-event debrief.

### Open on phone (QR code)

The desktop view above is the version you'll mostly use during prep. On the actual wedding day at the venue, click **Open on phone** in the day-of mode header. Atelier shows a QR code with a URL like `http://192.168.1.42:7424/weddings/{id}/dayof?token=...`.

Scan the QR with any phone on the same WiFi network and the day-of view opens in the phone's browser. The phone view is intentionally read-only (you can't edit timeline events from the phone) plus an incident-log form (so on-site staff can drop a note without grabbing the laptop). It auto-refreshes every 30 seconds, so changes you make on the desktop appear on the phone within a refresh cycle.

A few things to know:

- **The phone listener runs on a separate port** (default `7424`, which is your local API port plus one). It's bound to `0.0.0.0` so devices on the same network can reach it. The full Atelier API stays on `127.0.0.1:7423` and remains unreachable from any other machine.
- **The QR URL contains your local API key.** Treat it like a password: don't take a screenshot or post the QR code anywhere it could be seen by anyone outside your trusted on-site team.
- **Rotating the API key invalidates the URL.** If you ever suspect the URL leaked, **Settings → Local API → Regenerate API key** kills the old URL immediately. Generate a fresh QR for any phone that still needs access.
- **If "Phone access unavailable" shows up,** Atelier couldn't detect a LAN IP for your machine. Make sure WiFi or wired networking is connected and try again.

Day-of mode is one of the features that sells the local-architecture story: no internet needed at the venue, the database is local, the phone shares the same WiFi as the laptop running Atelier, and everything works regardless of cell signal.

## The vendor database

Top-level vendor management at **Vendors** in the main nav. Each vendor is a record with categories (Florist, DJ, Photographer, etc.), contact info, your past notes, and a list of weddings they've worked with you on.

The Vendors tab is the one place to update a vendor's contact info — every wedding's per-wedding view of that vendor links back here. Update once, propagate everywhere.

You can mark vendors as preferred (shows up first in dropdowns) or as do-not-use (greyed out, with a one-line reason field). The do-not-use field is one of the small things planners ask for and other tools don't surface — it's saved your future self from re-inviting a problem vendor.

## Templates that capture your playbook

Atelier's templates feature is the closest thing the app has to a competitive moat for repeat planners. From any wedding workspace, click **Save as template** at the top right. Atelier captures the wedding's Timeline events (with relative times rather than absolute times), the budget structure (with category proportions rather than absolute amounts), and the standard vendor categories.

Apply a template to a fresh wedding from the wedding's empty Timeline or Budget tab. The relative times anchor to the wedding date, the proportions scale to the budget total, and you start from your hard-won repeatable process instead of a blank canvas.

Templates are studio-wide — every wedding can apply any template. Manage them at **Templates** in the main nav.

## Multi-wedding workflow

Atelier expects you to be working on several weddings concurrently. The dashboard shows all active weddings as cards, sorted by proximity (today, this week, next month, future). The card shows the date, days-until, vendor count, payment status, and a small timeline strip showing the current week's events for that wedding.

Switch between weddings from the dashboard or from the wedding-name dropdown in the top nav. Atelier remembers which tab you were on per-wedding, so jumping back to a wedding lands you where you left off.

## The milestone playbook

Atelier ships with an opinionated milestone playbook — the standard sequence of milestones a wedding moves through (book venue, send save-the-dates, finalize florals, etc.). The playbook is configured at **Settings → Planning playbook** and is studio-wide.

For each wedding, Atelier compares the wedding date against the playbook and highlights gaps — milestones that should have been hit by now but haven't been. Gaps surface as:

- A red badge on the wedding's dashboard card with the count of overdue items
- A dismissible banner at the top of the wedding workspace
- Items in the Tasks tab pre-populated with due dates derived from the playbook

You can dismiss the banner per-wedding (when the milestone genuinely doesn't apply) or update the playbook to match how you actually work (when the default is wrong for your studio's process).

## Calendar

The Calendar view fills the content area with a Month / Week / Day toggle. Day-of events from every wedding's Timeline render here, color-coded by wedding. The today indicator is a thick oxblood left-border on the day cell with a filled-pill day number — easy to find at a glance.

Filter the calendar by wedding status, by team-member assignment, or by event category. The filter row is sticky at the top so it stays in view as you scroll.

## Reports

Reports live at **Reports** in the main nav. Four report categories ship in v1:

- **Revenue** — payment totals over time, grouped by month or by lead source.
- **Pipeline** — lead-to-conversion funnel and current pipeline value.
- **Outstanding money** — balances owed by couple and by vendor, with aging buckets.
- **Wedding load** — count of weddings by month, with team-member assignment breakdown.

Each report respects a sticky filter row at the top — date range, wedding status multi-select, lead source, team member. Filters that don't apply to a specific section render as italic "Not scoped by …" notes so it's clear what each section is and isn't slicing.

## Notifications

The bell icon in the top nav surfaces in-app notifications generated from overdue and due-soon money, tasks, milestones, weddings, and proposals. Click the bell to see the feed; click a notification to jump to the relevant entity.

Each notification category can be configured at **Settings → Notifications** to either:

- **In-app only** — surfaces in the bell icon, doesn't pop a Windows toast.
- **On change** — also fires a Windows system-tray toast notification when the state changes (overdue threshold crossed, etc.). The toasts respect quiet hours, configurable per category.

The notification feed is the single source of truth for "what should I be looking at right now." If something matters, it shows up here.

## Settings

Five panels at **Settings** (gear icon, top right):

- **Studio profile** — what you set up in the [first-run wizard](doc:first-run), editable here.
- **Planning playbook** — the milestone sequence, editable.
- **Team management** — add team members. Each member has a name, role, and a unique color used for assignment chips throughout the app. Team members are local-only in v1 — assignments are tracked, but there's no per-member login. Multi-user mode is on the v2 roadmap.
- **Notifications** — quiet hours and per-category routing.
- **Local API** — the localhost REST API panel. Toggle the API on or off, generate or regenerate the per-installation Bearer key, and view the documentation URL (`http://127.0.0.1:7423/api/docs` when the API is enabled). See the [API reference](doc:api-reference) and [integration examples](doc:integration-examples) for what you can do with the API.
- **Software updates** — auto-update toggle and current version info. See [install § upgrading](doc:install#upgrading-from-a-previous-version).

## License management

Atelier licenses activate on up to three devices. Activation, deactivation, and grace-period status all surface in **Settings → License** (and in the customer portal at `dunamisstudios.net/account/atelier-licenses`).

### What the License panel shows

- **This device** — the server-assigned label (e.g. "Computer 1"), first activation date, and last successful heartbeat date.
- **Other devices on this license** — a short list of every other device this license is active on, with the same label / first-activated / last-seen fields. Useful for confirming your laptop and your office desktop are both checked in.
- **Grace period status** — one of:
  - "Verified Xh ago" / "Verified X days ago" — normal operation, recent successful heartbeat.
  - "Verifying…" — heartbeat in flight.
  - "Offline grace: X days remaining" — Atelier hasn't reached the server in a while; this is the countdown to lockdown.
- **Two action buttons:**
  - **Deactivate this device** — clears the local activation, locks Atelier on this machine, and frees the slot for another device. The app closes after deactivation.
  - **Manage other devices** — opens the customer portal in your browser, where you can deactivate any other device on the license remotely.

### Active vs. deactivated

Each activation slot is in one of two states:

- **Active** — Atelier on that device is working normally, sending heartbeats. Counts toward the 3-device limit.
- **Deactivated** — explicitly deactivated by you (either from the device itself or from the customer portal). The slot is freed; the next device that activates takes the slot. Atelier on a deactivated device locks within 24 hours of the next heartbeat. Deactivated records are kept in the customer portal for audit reference but don't count against the limit.

If a device is broken, lost, or otherwise unreachable, deactivate it from the customer portal — you don't need physical access to the machine.

### The 30-day offline grace, in detail

After successful first activation, Atelier checks in with the server once per day. Each successful heartbeat resets a 30-day clock. If Atelier hasn't had a successful heartbeat for 30 days, the next launch shows a full-screen "Reconnect to verify license" lockdown view — your data is safe, but the app won't open until a successful check-in.

In practice, 30 days is generous. The scenarios that actually hit it:

- A laptop that's been in storage for a month between weddings.
- A traveling planner working from venues with no internet, then a remote office, then a hotel without ever connecting to a network that can reach `dunamisstudios.net`.
- A failed Windows network stack you haven't gotten around to fixing.

Recovery is one click: come online, click **Try to reconnect now** on the lockdown screen, Atelier sends a heartbeat, and you're back in.

### What happens at the 3-device limit

When you activate Atelier on a fourth device, the License Entry screen shows the three active devices in an inline list, each with a **Deactivate this one** button. Tap one, confirm, and Atelier on that device locks within 24 hours while the new device activates. No support ticket required.

If you can't pick which one to deactivate from a label alone, the customer portal shows the same list with the addition of recent activity dates and Atelier versions — useful for spotting "the one I haven't used in months."
