import { runAdminAction } from "@/lib/admin/action-runner";
import { service_admin_set_refund_flag } from "@/lib/admin/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/customers/[account_id]/licenses/[lid]/refund
 *
 * No request body. Marks the license as "refunded" via setLicenseStatus.
 * Distinct from revoke: refunded clears any revocation metadata and
 * signals the license was retired due to customer refund rather than
 * policy enforcement. The Stripe refund itself is a separate operation
 * performed in the Stripe dashboard; this endpoint only flips the
 * Dunamis-side flag and writes the audit log entry.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ account_id: string; lid: string }> },
) {
  const { account_id, lid } = await context.params;

  return runAdminAction(
    request,
    account_id,
    "set_refund_flag",
    async (ctx) => {
      const result = await service_admin_set_refund_flag({
        accountId: ctx.accountId,
        lid,
        adminEmail: ctx.adminEmail,
      });
      return {
        action: "set_refund_flag",
        parameters: {
          lid: result.lid,
          previous_status: result.previous_status,
          new_status: result.new_status,
        },
        result,
      };
    },
  );
}
