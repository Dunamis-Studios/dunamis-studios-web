import { NextResponse } from "next/server";

import {
  requireAdmin,
  isAdminAllowlistConfigured,
  ADMIN_ALLOWLIST_UNCONFIGURED_BODY,
} from "@/lib/session";
import { rateLimitBy } from "@/lib/ratelimit";
import {
  logAdminAction,
  type AdminActionName,
} from "@/lib/admin/audit-log";

/**
 * Shared envelope for admin read-write action routes.
 *
 * Every admin action follows the same shape:
 *   1. 503 if ADMIN_EMAILS isn't configured (dev mode).
 *   2. requireAdmin() gate. 401 / 403 on failure.
 *   3. rateLimitBy(admin.email, "admin"). 429 on failure.
 *   4. Parse and validate the request body.
 *   5. Call the service function.
 *   6. Write an audit log entry with success/failure result.
 *   7. Return the service's result, or a 500 with the error message.
 *
 * runAdminAction unifies steps 1-3 and 6-7. The handler supplies a
 * function that produces { parameters, result } so step 6 can record
 * exactly what the action did (the IDs touched, the values changed).
 *
 * The parameters block is what shows up in the customer detail page's
 * activity log expand-on-click panel. Keep it small + grep-friendly:
 * resource IDs, not full record contents.
 */

export interface AdminActionContext {
  adminEmail: string;
  accountId: string;
}

export interface AdminActionEnvelope<TResult> {
  /** Action name written to the audit log. */
  action: AdminActionName;
  /** Audit parameters block. Should include any resource IDs touched. */
  parameters: Record<string, unknown>;
  /** Service result returned to the caller. */
  result: TResult;
}

export type AdminActionHandler<TResult> = (
  ctx: AdminActionContext,
) => Promise<AdminActionEnvelope<TResult>>;

export class AdminActionError extends Error {
  status: number;
  /**
   * Optional audit-log parameters block to record alongside the
   * failure. Useful when an action partially identifies its target
   * (we know the license id we tried to revoke, even though the
   * revoke failed). Defaults to an empty object when unset.
   */
  auditParameters: Record<string, unknown>;
  constructor(
    status: number,
    message: string,
    auditParameters: Record<string, unknown> = {},
  ) {
    super(message);
    this.status = status;
    this.auditParameters = auditParameters;
  }
}

/**
 * Run the supplied admin-action handler with the standard envelope.
 * The action argument is the AdminActionName written to the audit
 * log on failure (when the handler never gets to return its own
 * action name in the envelope).
 */
export async function runAdminAction<TResult>(
  request: Request,
  accountId: string,
  fallbackAction: AdminActionName,
  handler: AdminActionHandler<TResult>,
): Promise<NextResponse> {
  if (!isAdminAllowlistConfigured()) {
    return NextResponse.json(ADMIN_ALLOWLIST_UNCONFIGURED_BODY, {
      status: 503,
    });
  }

  let admin;
  try {
    admin = await requireAdmin();
  } catch (err) {
    // requireAdmin throws a bare Response for 401/403. Re-wrap as a
    // NextResponse so the route handler's return type stays uniform.
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

  const ctx: AdminActionContext = {
    adminEmail: admin.account.email,
    accountId,
  };

  // Suppress the unused-parameter lint via referencing the binding.
  void request;

  try {
    const envelope = await handler(ctx);
    await logAdminAction({
      account_id: accountId,
      admin_email: admin.account.email,
      action: envelope.action,
      parameters: envelope.parameters,
      result: "success",
    });
    return NextResponse.json({ ok: true, ...envelope.result });
  } catch (err) {
    const status = err instanceof AdminActionError ? err.status : 500;
    const message =
      err instanceof Error ? err.message : "Internal error";
    const auditParameters =
      err instanceof AdminActionError ? err.auditParameters : {};
    await logAdminAction({
      account_id: accountId,
      admin_email: admin.account.email,
      action: fallbackAction,
      parameters: auditParameters,
      result: "failure",
      error_message: message,
    });
    return NextResponse.json(
      { ok: false, error: message },
      { status },
    );
  }
}
