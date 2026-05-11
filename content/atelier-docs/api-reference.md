---
title: "API reference"
description: "Atelier's localhost REST API: authentication, error shapes, and worked examples for the most common endpoints across leads, weddings, vendors, payments, tasks, and reports."
category: reference
order: 1
updated: "2026-05-10"
---

> **About this reference.** The localhost REST API and the **Settings → Local API** panel ship with Atelier today. The endpoints below are the curated surface; the in-app `/api/docs` page is the live source of truth. New endpoints continue to land alongside new Tauri commands as the API-first parity rule covers each new user action, so check the in-app docs for anything missing here.

This page is the customer-facing API reference. The authoritative version of every endpoint, with full request/response shapes and live response examples, will ship in the running app at **`http://127.0.0.1:7423/api/docs`** — open it in any browser when the local API is enabled.

The reference below is the curated, narrative version of the most common endpoints, organized by domain. For an endpoint not covered here, the in-app docs are the source of truth.

> **Auto-generation status.** The end goal for this reference is automatic generation from the Rust handler signatures so it stays exactly in sync with the running API. That work is queued; for v1 the page is hand-curated against the live API surface. If you spot a discrepancy between this page and `/api/docs` in the running app, the in-app version is correct — please report the drift to legal@dunamisstudios.com.

---

## Authentication

Every endpoint requires a Bearer token in the `Authorization` header:

```
Authorization: Bearer atlr_your_api_key_here
```

The key is generated from **Settings → Local API → Generate API key** inside Atelier. It's per-installation; regenerating invalidates the previous key.

The main API binds to `127.0.0.1` only and cannot be exposed on `0.0.0.0` from Settings. The localhost-only default is the right answer for the full API surface; if you want a phone on the same WiFi to view the run-of-show, that's what the [phone-friendly day-of view](#phone-friendly-day-of-view-lan-listener) on the LAN listener is for.

## Response shape

Every successful response is a JSON object with a single top-level key matching the resource:

```json
{ "weddings": [ ... ] }
```

For single records, the key is singular:

```json
{ "wedding": { ... } }
```

Errors return a 4xx or 5xx status with:

```json
{ "error": "Human-readable error message", "field": "optional_field_name" }
```

The optional `field` key is present on validation errors and points at the specific field that failed validation (e.g. `"field": "wedding_date"` on a 400 from `POST /api/weddings` with a bad date).

## Domains

The API is organized into the same domains as the app itself:

- [Dashboard](doc:api-reference#dashboard) — multi-wedding summary
- [Leads](doc:api-reference#leads) — CRM pipeline
- [Weddings](doc:api-reference#weddings) — the core entity
- [Vendors](doc:api-reference#vendors) — vendor database + per-wedding assignments
- [Tasks](doc:api-reference#tasks) — per-wedding to-dos
- [Payments](doc:api-reference#payments) — money in
- [Reports](doc:api-reference#reports) — pre-aggregated summaries
- [Calendar](doc:api-reference#calendar) — cross-wedding event feed

---

## Dashboard

### `GET /api/dashboard/summary`

Returns a multi-wedding overview suitable for rendering a dashboard or alerting on aggregate state.

**Response** (`200 OK`)

```json
{
  "summary": {
    "active_weddings": 7,
    "weddings_this_month": 2,
    "weddings_next_30_days": 3,
    "outstanding_payments_cents": 47250,
    "overdue_tasks": 4,
    "milestone_gaps": 2
  }
}
```

The `outstanding_payments_cents` field aggregates across every active wedding and reflects the live `paid_amount` cache on every budget line — see the user-guide [Budget tab](doc:user-guide#budget) for the maintenance contract.

---

## Leads

### `GET /api/leads`

Lists every lead in the CRM pipeline.

**Query parameters**

- `status` — filter by pipeline stage (`new`, `contacted`, `proposal_sent`, `won`, `lost`)
- `source` — filter by lead source (`referral`, `website`, `instagram`, etc.)
- `since` — ISO date; only leads created after this date

**Response** (`200 OK`)

```json
{
  "leads": [
    {
      "id": "lead_01HX...",
      "name": "Robin Patel",
      "email": "robin@example.com",
      "wedding_date_estimate": "2027-04-18",
      "status": "contacted",
      "source": "referral",
      "assigned_team_member_id": "tm_01HW...",
      "created_at": "2026-04-12T09:33:21Z"
    }
  ]
}
```

### `POST /api/leads`

Create a new lead.

**Request body**

```json
{
  "name": "Robin Patel",
  "email": "robin@example.com",
  "wedding_date_estimate": "2027-04-18",
  "source": "referral",
  "notes": "Met at the venue tour at Bayfront last weekend."
}
```

**Response** (`201 Created`) — the full created lead, same shape as in the list response.

---

## Weddings

### `GET /api/weddings`

Lists every wedding the studio is tracking.

**Query parameters**

- `status` — `active`, `archived`, `cancelled`
- `since` — ISO date; only weddings with `wedding_date >= since`
- `until` — ISO date; only weddings with `wedding_date <= until`

**Response** (`200 OK`)

```json
{
  "weddings": [
    {
      "id": "wed_01HX...",
      "couple_first_names": ["Alex", "Jordan"],
      "wedding_date": "2026-09-12",
      "venue": "Bayfront Estate",
      "status": "active",
      "lead_source": "referral",
      "assigned_planner_id": "tm_01HW...",
      "created_at": "2025-11-04T14:21:33Z"
    }
  ]
}
```

### `GET /api/weddings/{id}`

Returns the full wedding record, with embedded counts for vendors, guests, tasks, and budget lines.

**Response** (`200 OK`)

```json
{
  "wedding": {
    "id": "wed_01HX...",
    "couple_first_names": ["Alex", "Jordan"],
    "couple_last_names": ["Lee", "Mendez"],
    "wedding_date": "2026-09-12",
    "venue": "Bayfront Estate",
    "status": "active",
    "lead_source": "referral",
    "assigned_planner_id": "tm_01HW...",
    "vendor_count": 12,
    "guest_count": 124,
    "task_count": 38,
    "tasks_overdue": 2,
    "budget_total_cents": 4250000,
    "budget_paid_cents": 1700000,
    "created_at": "2025-11-04T14:21:33Z",
    "updated_at": "2026-04-30T08:15:02Z"
  }
}
```

### `POST /api/weddings`

Create a new wedding.

**Request body**

```json
{
  "couple_first_names": ["Alex", "Jordan"],
  "couple_last_names": ["Lee", "Mendez"],
  "wedding_date": "2026-09-12",
  "venue": "Bayfront Estate",
  "lead_source": "referral",
  "assigned_planner_id": "tm_01HW..."
}
```

**Response** (`201 Created`) — the created wedding record.

---

## Vendors

### `GET /api/vendors`

Lists every vendor in the studio-wide database.

**Response** (`200 OK`)

```json
{
  "vendors": [
    {
      "id": "vnd_01HX...",
      "name": "Lila's Florals",
      "category": "florist",
      "contact_email": "lila@lilasflorals.com",
      "contact_phone": null,
      "preferred": true,
      "do_not_use": false,
      "do_not_use_reason": null,
      "weddings_used_count": 14
    }
  ]
}
```

### `POST /api/vendors`

Create a new vendor.

**Request body**

```json
{
  "name": "Lila's Florals",
  "category": "florist",
  "contact_email": "lila@lilasflorals.com",
  "contact_phone": null,
  "notes": "Best for fall palettes; bills net-30."
}
```

**Response** (`201 Created`) — the created vendor record.

---

## Tasks

### `POST /api/tasks`

Create a per-wedding task.

**Request body**

```json
{
  "wedding_id": "wed_01HX...",
  "title": "Confirm catering count",
  "due_date": "2026-08-29",
  "owner_team_member_id": "tm_01HW...",
  "status": "pending"
}
```

`status` is one of `pending`, `in_progress`, `completed`, `skipped`. Defaults to `pending` on create.

**Response** (`201 Created`) — the created task.

### `GET /api/weddings/{id}/tasks`

Lists every task for a given wedding.

**Response** (`200 OK`)

```json
{
  "tasks": [
    {
      "id": "tsk_01HX...",
      "wedding_id": "wed_01HX...",
      "title": "Confirm catering count",
      "due_date": "2026-08-29",
      "status": "pending",
      "owner_team_member_id": "tm_01HW...",
      "completed_at": null
    }
  ]
}
```

---

## Payments

### `POST /api/payments`

Record a payment received.

**Request body**

```json
{
  "wedding_id": "wed_01HX...",
  "amount_cents": 250000,
  "received_at": "2026-05-01",
  "method": "ach",
  "payer": "Lee/Mendez",
  "allocations": [
    { "budget_line_id": "bgl_01HX...", "amount_cents": 200000 },
    { "budget_line_id": "bgl_01HY...", "amount_cents":  50000 }
  ]
}
```

The `allocations` array splits the payment across budget lines. The sum of `allocations[*].amount_cents` must equal `amount_cents`. Atelier maintains a `paid_amount` cache on each budget line that tracks the sum of allocations against that line — see the [user guide § Budget](doc:user-guide#budget) for the bidirectional contract.

**Response** (`201 Created`) — the created payment plus a refreshed snapshot of the affected budget lines so the caller can update its UI without re-fetching.

```json
{
  "payment": { ... },
  "updated_budget_lines": [ ... ]
}
```

---

## Reports

### `GET /api/reports/revenue`

Pre-aggregated revenue report.

**Query parameters**

- `from` — ISO date; report start
- `to` — ISO date; report end
- `bucket` — `month` (default), `quarter`, or `year`

**Response** (`200 OK`)

```json
{
  "report": {
    "from": "2026-01-01",
    "to": "2026-12-31",
    "bucket": "month",
    "buckets": [
      { "label": "2026-01", "revenue_cents": 0 },
      { "label": "2026-02", "revenue_cents": 250000 },
      { "label": "2026-03", "revenue_cents": 425000 }
    ],
    "total_cents": 675000
  }
}
```

---

## Calendar

### `GET /api/calendar/events`

Lists every event across every wedding within a date range, suitable for rendering a calendar view.

**Query parameters**

- `from` — ISO date (required)
- `to` — ISO date (required)

**Response** (`200 OK`)

```json
{
  "events": [
    {
      "id": "evt_01HX...",
      "wedding_id": "wed_01HX...",
      "wedding_label": "Lee/Mendez · Sep 12",
      "title": "Ceremony",
      "starts_at": "2026-09-12T17:00:00-04:00",
      "duration_minutes": 30,
      "location": "Bayfront Estate — Garden Lawn",
      "category": "ceremony"
    }
  ]
}
```

The `wedding_label` is pre-formatted for display in the calendar's wedding-color legend; clients should not parse it.

---

## Guests CSV import

The Guests tab's bulk-import flow exposes two POST endpoints. They share a service layer with the Tauri command surface, so a CLI tool can drive the same import the UI does.

### `POST /api/weddings/{wedding_id}/guests/import-csv`

Accepts a pre-parsed array of normalized rows and persists them. The UI does the column-mapping step client-side and posts the mapped result; a script can do the same.

**Body**

```json
{
  "rows": [
    {
      "first_name": "Alex",
      "last_name": "Mendez",
      "email": "alex@example.com",
      "rsvp_status": "yes",
      "dietary_notes": "vegetarian",
      "group_name": "Lee family"
    }
  ]
}
```

**Response** (`200 OK`)

```json
{
  "import": {
    "inserted_guest_ids": ["gst_01HX..."],
    "inserted_group_ids": ["grp_01HX..."],
    "row_count": 1
  }
}
```

Group rows referenced by `group_name` are created on the fly when no matching group exists for the wedding.

### `POST /api/weddings/{wedding_id}/guests/undo-csv-import`

Reverses a prior import. The body is the `inserted_guest_ids` and `inserted_group_ids` from the response above.

**Body**

```json
{
  "guest_ids": ["gst_01HX..."],
  "group_ids": ["grp_01HX..."]
}
```

**Response** (`200 OK`) is an empty body. The undo is best-effort: rows already mutated since the import remain.

---

## PDF payloads

Atelier's print views (Timeline, Seating, Contract) render from a Rust-built payload that bundles the header, body data, and computed labels in one shape. The same payload is exposed over REST so external tools can produce parallel renderings (third-party PDF templates, custom branded variants, etc.) without re-implementing the resolution logic.

### `GET /api/weddings/{wedding_id}/pdf-payloads/timeline`

Returns the bundled run-of-show shape for the Timeline print view.

**Response** (`200 OK`)

```json
{
  "payload": {
    "header": {
      "couple_label": "Lee / Mendez",
      "wedding_date": "2026-09-12",
      "venue_label": "Bayfront Estate"
    },
    "events": [
      {
        "id": "evt_01HX...",
        "starts_at": "2026-09-12T08:00:00-04:00",
        "duration_minutes": 60,
        "title": "Hair and makeup",
        "location": "Bridal suite",
        "vendor_labels": ["Maria's Beauty"],
        "notes": "Bride first, then bridesmaids"
      }
    ]
  }
}
```

### `GET /api/weddings/{wedding_id}/pdf-payloads/seating`

Returns the bundled seating chart shape: header, per-table guest buckets, the unassigned list, capacity totals, and any overflow IDs (guests assigned to a table beyond its capacity).

### `GET /api/contracts/{contract_id}/pdf-payload`

Returns the bundled contract shape: header, full contract row, and an alphabetized vendor label list.

---

## Licensing scheduler

### `GET /api/licensing/heartbeat-scheduler-status`

Returns the current state of the daily heartbeat scheduler. Useful for monitoring scripts and for diagnosing why a heartbeat hasn't fired.

**Response** (`200 OK`)

```json
{
  "running": true,
  "last_tick_at": "2026-05-10T14:02:00Z",
  "last_outcome": "ok",
  "next_tick_at": "2026-05-11T14:02:00Z",
  "consecutive_failures": 0
}
```

`last_outcome` is one of `ok`, `ok_with_grace_warning`, `license_revoked`, `license_refunded`, `unreachable`, `deactivated`, `not_found`, or `unexpected_response`. If the scheduler has not yet completed its first tick, the value is `null` and `last_tick_at` is also `null`. If the scheduler is not running (no activation stored yet, or shutdown in progress), the endpoint returns `503 Service Unavailable`.

## Online activation

The five endpoints below pair 1:1 with the same-named Tauri commands in `commands/activation.rs`. Each pair shares one `service_*` function, so the localhost API and the desktop UI surface identical behavior. Authoritative server responses (slot full, revoked, refunded, license not found, unreachable) flow as **`200 OK` with a structured `{ "kind": "...", ... }` payload** so callers branch on the `kind` discriminant rather than on HTTP status; only request-validation failures use `400 Bad Request`.

### `POST /api/licensing/activate-online`

Activates a license against the activation server and persists the slot locally on success. Verifies the license cryptographically against the embedded public key before the network call so a malformed key short-circuits without round-tripping.

**Body**

```json
{
  "licenseString": "ATLR-...",
  "deviceLabel": "Atelier on Studio Desktop"
}
```

`deviceLabel` is optional; when omitted, the server-side label defaults to the Windows hostname (`COMPUTERNAME`), with a final fallback of `"Atelier device"`.

**Response** (`200 OK`)

A discriminated union via `kind`:

```json
{ "kind": "granted", "activation_id": "...", "slot_count": 1, "max_slots": 3, "first_activation": true }
```

Other `kind` values: `slot_full` (carries `max_slots` + `active_devices: PublicSlot[]`), `license_refunded`, `license_revoked` (carries `mode`, `revoked_at`), `license_not_found`, `unreachable` (carries `message`), `unexpected_response` (carries `status`, `body`).

**Errors** (`400 Bad Request`)

- `validation_failed` with `field_errors: { licenseString: "..." }` when the license fails signature, format, or major-version checks.
- Plain `error` message when `licenseString` is missing or empty, or when the hardware fingerprint can't be computed.

### `POST /api/licensing/heartbeat-now`

Manually triggers a heartbeat against the activation server. The daily scheduler covers automatic heartbeats; this endpoint exists for the Settings → License "Reconnect now" button and for integration scripts that want to force a check.

**Body**: none.

**Response** (`200 OK`)

A discriminated union via `kind`:

```json
{ "kind": "ok", "heartbeat_at": "2026-05-10T14:00:00Z" }
```

Other `kind` values: `ok_with_grace_warning`, `deactivated`, `license_refunded`, `license_revoked`, `license_not_found`, `unreachable`, `unexpected_response`. Each carries the fields appropriate to the outcome (e.g. `revoked_at`, `grace_remaining_days`, `deactivated_reason`).

**Errors**

- `503 Service Unavailable` when no activation row exists (fresh install, post-deactivation, or pre-activation grace).

### `GET /api/licensing/activation-status`

Returns the local cached `activation` row that the scheduler and lockdown UI read.

**Response** (`200 OK`)

```json
{
  "activation_id": "...",
  "lid": "...",
  "first_activated_at": "2026-05-01T18:30:00Z",
  "last_heartbeat_at": "2026-05-10T08:00:00Z",
  "first_launch_grace_started_at": null,
  "revocation_state": "none",
  "revoked_at": null,
  "grace_remaining_days": null
}
```

Returns `null` (not an error) when no activation row exists. `revocation_state` is one of `none`, `grace_14d`, `immediate`, `locked`, or `refunded`.

### `POST /api/licensing/deactivate-this-device`

Self-eviction. Posts to the activation server to release the current install's slot, then clears the local `activation` + `license` rows so the next launch returns to License Entry.

**Body**: none.

**Response** (`200 OK`)

```json
{ "kind": "ok" }
```

Other `kind` values: `forbidden`, `not_found` (treated the same as `ok` for local cleanup), `unreachable`, `unexpected_response`.

**Errors**

- `503 Service Unavailable` when no activation row exists.

### `POST /api/licensing/deactivate-other-device`

Slot-full picker eviction. Used to free a slot held by a different device when activation returns `slot_full` and the user picks one from the list to kick. Does not touch local state; the caller follows up with `activate-online`.

**Body**

```json
{
  "licenseString": "ATLR-...",
  "activationId": "..."
}
```

`licenseString` is verified cryptographically against the embedded public key before the network call so a hostile caller can't drive this surface against an arbitrary license.

**Response** (`200 OK`)

Same `DeactivateOutcome` discriminator as `deactivate-this-device`.

**Errors** (`400 Bad Request`)

- `validation_failed` with `field_errors: { licenseString: "..." }` on signature/format/version failure.
- Plain `error` when `licenseString` or `activationId` is empty.

---

## Phone-friendly day-of view (LAN listener)

When the local API is enabled, Atelier also runs a **second axum listener** on `0.0.0.0:{api_port + 1}` (default `7424`) so a phone on the same WiFi network can pull up a wedding's day-of board. This listener is intentionally narrow: only two endpoints are exposed, and everything else returns 404. The full API stays on `127.0.0.1:7423` and is unreachable from the LAN.

Both listeners share the same Bearer token. The phone view accepts the token either via the `Authorization: Bearer ...` header or as a `?token=...` query parameter, since QR codes carry URLs rather than headers.

### `GET http://{lan-ip}:{api_port + 1}/weddings/{wedding_id}/dayof`

Server-rendered HTML page (not JSON). Phone-optimized layout with the timeline events, vendor list with `tel:` links, recent incidents, and an inline incident-log form. Auto-refreshes every 30 seconds via meta refresh.

The HTML inlines all CSS and has no external dependencies; it works on any reasonably modern phone browser without internet access.

```
GET /weddings/wd_01HQ8.../dayof?token=atlr_your_api_key_here
```

In Atelier, click **Open on phone** in day-of mode to display a QR code containing exactly this URL.

### `POST http://{lan-ip}:{api_port + 1}/weddings/{wedding_id}/incidents`

Form-encoded POST that creates an incident from the phone's incident-log form. Body fields:

- `severity`: `"minor"`, `"major"`, or `"critical"`
- `summary`: required, the incident description
- `resolution`: optional notes on how it was handled
- `token`: the Bearer token (same as the URL query param)

On success, redirects (303) back to the day-of HTML view so the form submission round-trips without breaking the phone-friendly UX.

### What's NOT on the LAN listener

- Mutating any resource other than the incident log
- Reading or writing any other wedding's data
- Any endpoint from the main API (`/api/...`)
- Any admin or licensing surface

If you try to reach `http://{lan-ip}:7424/api/weddings`, you get a 404. The LAN listener has no such route.

---

## Errors and rate limits

Common status codes:

- **`400 Bad Request`** — validation error. Body includes `error` and `field`.
- **`401 Unauthorized`** — missing or wrong Bearer token.
- **`404 Not Found`** — resource doesn't exist.
- **`409 Conflict`** — write would violate a uniqueness constraint (e.g. creating a vendor with a name that already exists).
- **`500 Internal Server Error`** — unexpected. Worth reporting to legal@dunamisstudios.com with the request that triggered it.

There is no rate limit on the local API — you're calling your own machine. Be reasonable about pollers (5-minute intervals are plenty; 5-second intervals are wasteful).

---

## What's not in this curated reference

- The full catalog of `PUT`/`PATCH`/`DELETE` endpoints for every resource. They exist; the in-app `/api/docs` is authoritative.
- The full per-resource field list including timestamps, soft-delete flags, and audit columns. The in-app docs include them; we trim the reference here for readability.
- The webhook subscription endpoints. Atelier does not ship outbound webhooks in v1 — see [integration examples](doc:integration-examples) for the polling-based workaround.

For a complete, autoritative-as-of-the-running-build reference, open `http://127.0.0.1:7423/api/docs` in any browser while the local API is enabled.
