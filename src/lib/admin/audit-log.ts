import { redis, KEY } from "@/lib/redis";

/**
 * Admin action audit log service.
 *
 * Every read-write admin action against a customer account writes one
 * entry here on both success and failure. Two destinations per write:
 *
 *   1. Per-account LIST at `dunamis:admin-action-log:{account_id}`.
 *      LPUSH so newest entries land at head. Retention indefinite.
 *      Reads via LRANGE for the customer detail page's Activity Log
 *      section.
 *
 *   2. Global STREAM at `dunamis:admin-action-log:_all`. XADD with
 *      MAXLEN ~ 10000 so the dashboard's recent-activity feed can read
 *      across every account in one XREVRANGE call without scanning
 *      per-account keys.
 *
 * The stream is a derived feed, not the source of truth. Per-account
 * lists outlive the stream's window. Reading old activity for a
 * specific account always goes through the LIST.
 */

export type AdminActionName =
  | "deactivate_device"
  | "revoke_license"
  | "resend_license_email"
  | "update_account_profile"
  | "delete_account"
  | "trigger_data_export"
  | "refresh_from_stripe"
  | "set_refund_flag";

export interface AdminActionLogEntry {
  timestamp: string;
  admin_email: string;
  action: AdminActionName;
  parameters: Record<string, unknown>;
  result: "success" | "failure";
  error_message?: string;
}

export interface AdminActionLogEntryWithAccount extends AdminActionLogEntry {
  account_id: string;
}

interface LogParams {
  account_id: string;
  admin_email: string;
  action: AdminActionName;
  parameters: Record<string, unknown>;
  result: "success" | "failure";
  error_message?: string;
}

const STREAM_MAXLEN = 10_000;

/**
 * Write one audit entry to both destinations. Errors during logging
 * are swallowed and printed to stderr: the underlying admin action
 * has already succeeded (or failed) and the caller's response should
 * not depend on whether the audit write made it. A dropped audit
 * entry is recoverable from Vercel logs if it ever matters.
 */
export async function logAdminAction(params: LogParams): Promise<void> {
  const entry: AdminActionLogEntry = {
    timestamp: new Date().toISOString(),
    admin_email: params.admin_email,
    action: params.action,
    parameters: params.parameters,
    result: params.result,
    ...(params.error_message ? { error_message: params.error_message } : {}),
  };

  const r = redis();
  try {
    await r.lpush(
      KEY.adminActionLogByAccount(params.account_id),
      JSON.stringify(entry),
    );
  } catch (err) {
    console.error("[audit-log] per-account LPUSH failed", err);
  }

  try {
    await r.xadd(
      KEY.adminActionLogStream,
      "*",
      {
        payload: JSON.stringify({ ...entry, account_id: params.account_id }),
      },
      {
        trim: {
          type: "MAXLEN",
          threshold: STREAM_MAXLEN,
          comparison: "~",
        },
      },
    );
  } catch (err) {
    console.error("[audit-log] stream XADD failed", err);
  }
}

/**
 * Read the most recent N entries for one customer account. Returns
 * an empty array when no entries exist or when the LRANGE response
 * is malformed.
 *
 * Cursor-based pagination uses the 0-based start index across calls:
 * the customer detail page initially loads `start=0, count=20`, the
 * Load More button advances `start += count`.
 */
export async function readAccountAuditLog(
  account_id: string,
  start = 0,
  count = 20,
): Promise<AdminActionLogEntry[]> {
  const r = redis();
  const raw = await r.lrange<string>(
    KEY.adminActionLogByAccount(account_id),
    start,
    start + count - 1,
  );
  if (!raw || raw.length === 0) return [];
  return raw
    .map(parseEntry)
    .filter((e): e is AdminActionLogEntry => e !== null);
}

/**
 * Total count of audit entries on this account. Used by the Activity
 * Log section to decide whether to render the Load More button.
 */
export async function countAccountAuditLog(
  account_id: string,
): Promise<number> {
  const r = redis();
  return r.llen(KEY.adminActionLogByAccount(account_id));
}

/**
 * Read the global stream's most recent N entries for the dashboard
 * activity feed. Returns newest-first. Entries beyond the 10K MAXLEN
 * threshold are no longer present; the caller should not assume the
 * stream represents the full history.
 */
export async function readGlobalAuditFeed(
  count = 20,
): Promise<AdminActionLogEntryWithAccount[]> {
  const r = redis();
  let response: Record<string, Record<string, unknown>> | null = null;
  try {
    response = await r.xrevrange<Record<string, unknown>>(
      KEY.adminActionLogStream,
      "+",
      "-",
      count,
    );
  } catch (err) {
    console.error("[audit-log] stream XREVRANGE failed", err);
    return [];
  }

  return parseStreamResponse(response);
}

function parseEntry(raw: unknown): AdminActionLogEntry | null {
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.timestamp === "string" &&
      typeof parsed.admin_email === "string" &&
      typeof parsed.action === "string" &&
      typeof parsed.result === "string"
    ) {
      return parsed as AdminActionLogEntry;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse the Upstash XREVRANGE response into entries. The SDK types
 * the return as `Record<streamId, Record<fieldName, unknown>>`.
 * Iteration order on Object.values follows insertion order in modern
 * V8, which for XREVRANGE means newest-first. The feed is non-critical;
 * malformed records drop silently.
 */
function parseStreamResponse(
  response: Record<string, Record<string, unknown>> | null,
): AdminActionLogEntryWithAccount[] {
  if (!response) return [];
  const out: AdminActionLogEntryWithAccount[] = [];
  for (const fields of Object.values(response)) {
    const payload = fields.payload;
    if (typeof payload !== "string") continue;
    try {
      const parsed = JSON.parse(payload);
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof parsed.account_id === "string" &&
        typeof parsed.timestamp === "string"
      ) {
        out.push(parsed as AdminActionLogEntryWithAccount);
      }
    } catch {
      // Malformed JSON entry; skip silently. The audit log is the
      // source of truth via the per-account LIST, not this feed.
    }
  }
  return out;
}
