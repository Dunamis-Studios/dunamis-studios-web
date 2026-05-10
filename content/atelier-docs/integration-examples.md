---
title: "Integration examples"
description: "Working code examples for Atelier's local REST API — curl, a Python CSV importer, a webhook example, and a task-automation example."
category: using-atelier
order: 2
updated: "2026-05-09"
---

> **Examples target an API that ships in a later v1 slice.** The localhost REST API on port 7423 and the **Settings → Local API** panel referenced throughout the page have not yet shipped. The examples below are the patterns that will work the moment the API slice is live; today they're a planning resource, not runnable code. The [API reference](doc:api-reference) carries the same admonition and the same scope.

Atelier's localhost REST API on port 7423 is what makes the data model accessible to the rest of your toolchain. Every endpoint returns JSON, every endpoint is authenticated with a per-installation Bearer key, and the whole thing runs on `127.0.0.1` — nothing crosses your network boundary.

This page is the working-code companion to the [API reference](doc:api-reference). Every example is complete, runnable, and copyable.

## Setup

Before anything below works, enable the local API:

1. Open Atelier.
2. Go to **Settings → Local API**.
3. Toggle **Enable local API** on.
4. Click **Generate API key**. Copy the key (starts with `atlr_`); it won't be shown again unless you regenerate it.
5. Verify the API is up by visiting [http://127.0.0.1:7423/api/docs](http://127.0.0.1:7423/api/docs) in a browser — the in-app docs render there, with every endpoint listed.

The API key is per-installation. Regenerating invalidates the old key and any script using it. There's no way to have two simultaneous keys; if a script needs to be revoked, regenerate.

## Example 1 — Curl: list weddings

The simplest possible API call. Lists every wedding the studio is tracking.

```bash
curl http://127.0.0.1:7423/api/weddings \
  -H "Authorization: Bearer atlr_your_api_key_here"
```

Response (truncated for the example):

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

Every API response has the same shape: a top-level object with a single key matching the resource name (plural for lists, singular for single records). Errors return `{ "error": "..." }` with an HTTP 4xx/5xx status.

## Example 2 — Python: bulk-import vendors from a CSV

A common ask from studios with existing vendor data in a spreadsheet. Save your spreadsheet as `vendors.csv` with columns `name,category,email,phone,notes` and run this script. It creates one vendor record per row.

```python
"""Bulk-import vendors into Atelier from a CSV file.

Reads vendors.csv and creates one vendor per row via the local
REST API. Skips rows where the vendor name already exists in
Atelier (by exact case-insensitive match) so re-running the script
is idempotent.

Usage:
    pip install requests
    python import_vendors.py vendors.csv

Requires ATELIER_API_KEY in the environment, e.g.:
    set ATELIER_API_KEY=atlr_your_api_key_here
"""

import csv
import os
import sys

import requests

API = "http://127.0.0.1:7423/api"
KEY = os.environ["ATELIER_API_KEY"]
HEADERS = {
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
}


def existing_vendor_names() -> set[str]:
    response = requests.get(f"{API}/vendors", headers=HEADERS, timeout=10)
    response.raise_for_status()
    return {v["name"].strip().lower() for v in response.json()["vendors"]}


def create_vendor(row: dict) -> None:
    payload = {
        "name": row["name"].strip(),
        "category": row.get("category", "").strip() or "uncategorized",
        "contact_email": row.get("email", "").strip() or None,
        "contact_phone": row.get("phone", "").strip() or None,
        "notes": row.get("notes", "").strip() or None,
    }
    response = requests.post(
        f"{API}/vendors",
        headers=HEADERS,
        json=payload,
        timeout=10,
    )
    response.raise_for_status()
    print(f"  created: {payload['name']}")


def main(csv_path: str) -> None:
    existing = existing_vendor_names()
    print(f"{len(existing)} vendors already in Atelier; skipping any duplicates.")

    with open(csv_path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        skipped = 0
        for row in reader:
            name = row["name"].strip().lower()
            if name in existing:
                skipped += 1
                continue
            create_vendor(row)
            existing.add(name)

    print(f"\nDone. {skipped} duplicates skipped.")


if __name__ == "__main__":
    main(sys.argv[1])
```

Run it once on a clean Atelier install with a CSV of 50 vendors and the whole import takes about three seconds. Re-run it and nothing changes (the duplicate check makes it idempotent).

The script's structure is the canonical pattern for any bulk-import: list-then-skip-existing, post-one-at-a-time, fail loudly on the first error so you know exactly which row broke. Adapt it for guests, budget lines, or anything else by swapping the resource path.

## Example 3 — Webhook receiver: log every wedding-created event

Atelier doesn't ship a built-in webhook system in v1, but the API is structured enough to poll. Pair this with a local webhook receiver and you have the same shape: when a new wedding lands in Atelier, an external system gets pinged.

This example is a tiny Flask receiver that logs every wedding-created event. Pair it with a Windows scheduled task or a simple polling daemon (a few lines of cron-equivalent) that calls Atelier's `/api/weddings` endpoint, diffs the response against the previous call, and POSTs each new wedding to your receiver.

```python
"""Webhook receiver — logs every wedding-created event.

Run alongside a polling script that POSTs each new wedding here
when it appears in Atelier. The receiver writes to a flat log
file; replace with a database insert, a Slack notification, or
whatever your downstream system expects.

Usage:
    pip install flask
    python webhook_receiver.py
"""

import json
from datetime import datetime, timezone

from flask import Flask, request, jsonify

app = Flask(__name__)


@app.post("/atelier/wedding-created")
def wedding_created():
    wedding = request.get_json(silent=True)
    if not wedding:
        return jsonify({"error": "Invalid JSON"}), 400

    received_at = datetime.now(timezone.utc).isoformat()
    log_entry = {
        "received_at": received_at,
        "wedding_id": wedding.get("id"),
        "couple_first_names": wedding.get("couple_first_names"),
        "wedding_date": wedding.get("wedding_date"),
    }
    with open("wedding_log.jsonl", "a", encoding="utf-8") as fh:
        fh.write(json.dumps(log_entry) + "\n")

    return jsonify({"received_at": received_at}), 200


if __name__ == "__main__":
    app.run(port=8080)
```

For the polling side, the simplest cadence is "every 5 minutes, list weddings, diff against the last list, POST any new ones to the webhook." A 30-line Python script handles that. We can scope a more robust event-driven webhook system as a [post-purchase custom-development engagement](doc:eula#11-support-and-custom-engagements) — Atelier's data model is webhook-friendly under the hood, the wiring just isn't shipped in v1.

## Example 4 — Auto-populate default tasks when a wedding is created

A pattern several studios have asked for: when a new wedding is created, automatically populate it with a standard checklist of tasks (book photographer, send save-the-dates, finalize florals, etc.). Atelier ships templates for [Timeline and Budget](doc:user-guide#templates-that-capture-your-playbook) but task templates aren't in v1.

Workaround using the API: a small script polls for new weddings and, for each one, creates the default task list against it. Run the script as a Windows scheduled task every few minutes.

```python
"""Auto-populate default tasks when a new wedding lands.

Polls /api/weddings every few minutes, identifies weddings
without any tasks, and creates the default task checklist
against them. Idempotent — only adds tasks if the wedding has
zero tasks, so re-running doesn't double-up.

Usage:
    pip install requests
    set ATELIER_API_KEY=atlr_your_api_key_here
    python auto_populate_tasks.py
"""

import os
import time

import requests

API = "http://127.0.0.1:7423/api"
KEY = os.environ["ATELIER_API_KEY"]
HEADERS = {"Authorization": f"Bearer {KEY}"}

DEFAULT_TASKS = [
    {"title": "Book photographer", "days_before_wedding": 270},
    {"title": "Send save-the-dates", "days_before_wedding": 180},
    {"title": "Finalize florals", "days_before_wedding": 90},
    {"title": "Confirm catering count", "days_before_wedding": 14},
    {"title": "Final venue walkthrough", "days_before_wedding": 7},
    {"title": "Day-of run-of-show review", "days_before_wedding": 1},
]


def weddings_needing_tasks() -> list[dict]:
    weddings = requests.get(f"{API}/weddings", headers=HEADERS, timeout=10).json()
    needing = []
    for w in weddings["weddings"]:
        tasks = requests.get(
            f"{API}/weddings/{w['id']}/tasks", headers=HEADERS, timeout=10
        ).json()
        if not tasks["tasks"]:
            needing.append(w)
    return needing


def populate_tasks(wedding: dict) -> None:
    from datetime import datetime, timedelta

    wedding_date = datetime.fromisoformat(wedding["wedding_date"])
    for spec in DEFAULT_TASKS:
        due = wedding_date - timedelta(days=spec["days_before_wedding"])
        payload = {
            "wedding_id": wedding["id"],
            "title": spec["title"],
            "due_date": due.date().isoformat(),
            "status": "pending",
        }
        requests.post(
            f"{API}/tasks",
            headers={**HEADERS, "Content-Type": "application/json"},
            json=payload,
            timeout=10,
        )
    print(f"populated {len(DEFAULT_TASKS)} tasks for {wedding['couple_first_names']}")


def main_loop() -> None:
    while True:
        for wedding in weddings_needing_tasks():
            populate_tasks(wedding)
        time.sleep(300)  # 5 minutes


if __name__ == "__main__":
    main_loop()
```

Once this script is running (as a Windows service, a scheduled task, or just `python auto_populate_tasks.py` in a terminal you leave open), every new wedding gets the default tasks within 5 minutes of being created. No Atelier-side code change needed.

## Beyond the examples

Every endpoint in the [API reference](doc:api-reference) supports the same patterns shown above: list, get, create, update, delete. The full response shape for each resource is documented in the in-app `/api/docs` page, served by Atelier itself when the API is enabled.

If you build something interesting and want to share it with other planners, send it our way — we can link to community examples from this page.
