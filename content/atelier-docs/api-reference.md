---
title: "API reference"
description: "Atelier's localhost REST API — authentication, error shapes, and worked examples for the most common endpoints across leads, weddings, vendors, payments, tasks, and reports."
category: reference
order: 1
updated: "2026-05-07"
---

This page is the customer-facing API reference. The authoritative version of every endpoint, with full request/response shapes and live response examples, ships in the running app at **`http://127.0.0.1:7423/api/docs`** — open it in any browser when the local API is enabled.

The reference below is the curated, narrative version of the most common endpoints, organized by domain. For an endpoint not covered here, the in-app docs are the source of truth.

> **Auto-generation status.** The end goal for this reference is automatic generation from the Rust handler signatures so it stays exactly in sync with the running API. That work is queued; for v1 the page is hand-curated against the live API surface. If you spot a discrepancy between this page and `/api/docs` in the running app, the in-app version is correct — please report the drift to legal@dunamisstudios.com.

---

## Authentication

Every endpoint requires a Bearer token in the `Authorization` header:

```
Authorization: Bearer atlr_your_api_key_here
```

The key is generated from **Settings → Local API → Generate API key** inside Atelier. It's per-installation; regenerating invalidates the previous key.

The API binds to `127.0.0.1` only — there is no way to expose it on `0.0.0.0` from Settings. If you need the API reachable from another machine on your LAN (for example, a phone running [day-of mode](doc:user-guide#day-of-mode)), you'd front it with a local reverse proxy. For most studios, the localhost-only default is the right answer.

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
      "contact_phone": "+15551234567",
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
  "contact_phone": "+15551234567",
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
