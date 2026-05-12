import { NextResponse } from "next/server";

import {
  requireAdmin,
  isAdminAllowlistConfigured,
  ADMIN_ALLOWLIST_UNCONFIGURED_BODY,
} from "@/lib/session";
import { rateLimitBy } from "@/lib/ratelimit";
import {
  readAccountAuditLog,
  countAccountAuditLog,
} from "@/lib/admin/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/customers/[account_id]/audit-log?start=N&count=N
 *
 * Cursor-paginated reads of the per-account audit log LIST. The
 * customer detail page initial-loads start=0 count=20 server-side;
 * the Load More button posts subsequent client-side requests with
 * start advancing by count. Returns { entries, total, nextStart }
 * so the button can hide itself when the next page would be empty.
 *
 * Stays a read-only endpoint outside the runAdminAction envelope: a
 * read of someone else's audit log does not itself need an audit
 * entry, and rate-limiting at the admin-email bucket level is
 * enough to discourage scraping.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ account_id: string }> },
) {
  if (!isAdminAllowlistConfigured()) {
    return NextResponse.json(ADMIN_ALLOWLIST_UNCONFIGURED_BODY, {
      status: 503,
    });
  }

  let admin;
  try {
    admin = await requireAdmin();
  } catch (err) {
    if (err instanceof Response) {
      return new NextResponse(err.body, {
        status: err.status,
        headers: err.headers,
      });
    }
    throw err;
  }

  const limited = await rateLimitBy(admin.account.email, "admin");
  if (!limited.ok) return limited.response;

  const { account_id } = await context.params;
  const url = new URL(request.url);
  const start = clampInt(url.searchParams.get("start"), 0, 0, 100_000);
  const count = clampInt(url.searchParams.get("count"), 20, 1, 100);

  const [entries, total] = await Promise.all([
    readAccountAuditLog(account_id, start, count),
    countAccountAuditLog(account_id),
  ]);

  const nextStart = start + entries.length;
  const hasMore = nextStart < total;

  return NextResponse.json({
    ok: true,
    entries,
    total,
    nextStart,
    hasMore,
  });
}

function clampInt(
  raw: string | null,
  defaultValue: number,
  min: number,
  max: number,
): number {
  if (raw == null) return defaultValue;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return defaultValue;
  return Math.max(min, Math.min(max, n));
}
