import { z } from "zod";

import { runAdminAction, AdminActionError } from "@/lib/admin/action-runner";
import { service_admin_delete_account } from "@/lib/admin/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  reason: z.string().trim().min(1, "Reason is required").max(1000),
});

/**
 * POST /api/admin/customers/[account_id]/delete
 *
 * Body: { reason: string }. Soft-deletes the account (sets deletedAt,
 * frees the email index) with a 30-day recovery window. Reason lands in
 * the audit log. Related licenses, sessions, and entitlements stay in
 * place during the recovery window; a future hard-delete pass will
 * purge them after expiry.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ account_id: string }> },
) {
  const { account_id } = await context.params;

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AdminActionError(
        400,
        issue?.message ?? "Invalid request body",
        { account_id },
      );
    }
    body = parsed.data;
  } catch (err) {
    if (err instanceof AdminActionError) throw err;
    throw new AdminActionError(400, "Invalid JSON body", { account_id });
  }

  return runAdminAction(
    request,
    account_id,
    "delete_account",
    async (ctx) => {
      const result = await service_admin_delete_account({
        accountId: ctx.accountId,
        adminEmail: ctx.adminEmail,
        reason: body.reason,
      });
      return {
        action: "delete_account",
        parameters: {
          email: result.email,
          deleted_at: result.deletedAt,
          recovery_window_days: result.recoveryWindowDays,
          reason: body.reason,
        },
        result,
      };
    },
  );
}
