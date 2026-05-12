"use client";

import * as React from "react";

import type { AdminActionLogEntry } from "@/lib/admin/audit-log";
import { Button } from "@/components/ui/button";
import { LocalTime } from "@/components/admin/local-time";

/**
 * Client wrapper that owns the paginated audit log state for one
 * account. Initial entries are server-rendered (the customer detail
 * page already loaded the first 20 entries server-side); this
 * component appends subsequent pages by fetching the GET audit-log
 * endpoint with a moving `start` cursor.
 *
 * Renders the list itself so all entries share the same markup,
 * including ones fetched after initial render. The Load More button
 * hides itself when the server reports hasMore=false.
 */

const ACTION_LABELS: Record<string, string> = {
  deactivate_device: "Deactivated device",
  revoke_license: "Revoked license",
  resend_license_email: "Resent license email",
  update_account_profile: "Updated profile",
  delete_account: "Deleted account",
  trigger_data_export: "Triggered data export",
  refresh_from_stripe: "Refreshed from Stripe",
  set_refund_flag: "Set refund flag",
};

export interface ActivityLogLoaderProps {
  accountId: string;
  initialEntries: AdminActionLogEntry[];
  initialTotal: number;
}

export function ActivityLogLoader(props: ActivityLogLoaderProps) {
  const [entries, setEntries] = React.useState<AdminActionLogEntry[]>(
    props.initialEntries,
  );
  const [total, setTotal] = React.useState(props.initialTotal);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const hasMore = entries.length < total;

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const url = `/api/admin/customers/${props.accountId}/audit-log?start=${entries.length}&count=20`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as {
        entries: AdminActionLogEntry[];
        total: number;
      };
      setEntries((prev) => [...prev, ...body.entries]);
      setTotal(body.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ol className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
        {entries.map((entry, idx) => (
          <li
            key={`${entry.timestamp}-${idx}`}
            className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[var(--fg)]">
                <span className="font-medium">
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </span>
                {entry.result === "failure" ? (
                  <span className="ml-2 inline-flex items-center rounded-full bg-[var(--color-danger-bg,#fee2e2)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-danger-fg,#991b1b)] dark:bg-[#3a1010] dark:text-[#fca5a5]">
                    failed
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
                <span className="font-medium">{entry.admin_email}</span>
                {entry.error_message ? (
                  <span className="ml-2 italic">{entry.error_message}</span>
                ) : null}
              </p>
            </div>
            <span className="shrink-0 text-xs text-[var(--fg-subtle)]">
              <LocalTime iso={entry.timestamp} />
            </span>
          </li>
        ))}
      </ol>

      {error ? (
        <p
          role="alert"
          className="mt-2 text-xs text-[var(--color-danger-700,#991b1b)] dark:text-[#fca5a5]"
        >
          {error}
        </p>
      ) : null}

      {hasMore ? (
        <div className="mt-3 flex items-center justify-center">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={loadMore}
          >
            {loading
              ? "Loading..."
              : `Load more (${entries.length}/${total})`}
          </Button>
        </div>
      ) : null}
    </>
  );
}
