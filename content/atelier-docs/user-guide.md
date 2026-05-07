---
title: "User guide"
description: "Day-to-day Atelier — the dashboard, weddings, timelines, vendors, budgets, payments, contracts, and the day-of mode."
category: using-atelier
order: 1
updated: "2026-05-07"
---

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

The day-of mode is a separate phone-friendly view of a wedding's Timeline, designed for the planner working at the venue. Click **Day-of** in the wedding's top navigation to open it.

Day-of mode is a different URL (`/weddings/{id}/dayof`) optimized for one-handed phone use. Atelier serves it from the same local-only HTTP server that backs the REST API; you can open the URL on your phone over the venue's WiFi if both devices are on the same network. (See [troubleshooting](doc:troubleshooting) for how to find the URL.)

What's different in day-of mode:

- **Single-event focus.** The current event is large, the surrounding events are minimized.
- **Status flips.** Each event has Start / Complete / Skip controls. Tapping flips the status and timestamps it. The timeline auto-advances to the next event when one completes.
- **Tappable vendor numbers.** Vendor phone numbers render as `tel:` links — tap to dial.
- **Incident capture.** A persistent "Log incident" button at the bottom records timestamped notes (DJ ran late, bridesmaid lost the boutonniere). Incidents land in the wedding's Notes tab with timestamps for the post-event debrief.

Day-of mode is one of the features that sells the local-architecture story: you don't need internet at the venue, the database is local, the phone is on the same WiFi as the laptop running Atelier, and everything works regardless of cell signal.

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
