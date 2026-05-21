/**
 * Resend the post-purchase Atelier license email scoped to a
 * customer account. Mirrors the global /api/admin/resend-license-
 * email but pulls auth + audit context from the account-scoped
 * admin action runner. Tags the email with isResend:true so the
 * template renders the appropriate copy.
 */
import { runAdminAction } from "@/lib/admin/action-runner";
import { service_admin_resend_license_email } from "@/lib/admin/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/customers/[account_id]/licenses/[lid]/resend-email
 *
 * No request body. Sends the post-purchase Atelier license email
 * template to the account's current email address with isResend:true.
 * Returns { sent_to } so the admin's UI can confirm where the email
 * went without a round-trip back to the customer record.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ account_id: string; lid: string }> },
) {
  const { account_id, lid } = await context.params;

  return runAdminAction(
    request,
    account_id,
    "resend_license_email",
    async (ctx) => {
      const result = await service_admin_resend_license_email({
        accountId: ctx.accountId,
        lid,
        adminEmail: ctx.adminEmail,
      });
      return {
        action: "resend_license_email",
        parameters: { lid: result.lid, sent_to: result.sent_to },
        result,
      };
    },
  );
}
