/**
 * Admin-driven data export for a customer account. Builds the same
 * export the self-serve /api/account/data-export endpoint returns
 * and ships it inline so the admin can download it directly. The
 * customer is not notified; the audit log records the action with
 * the filename and timestamp.
 */
import { runAdminAction } from "@/lib/admin/action-runner";
import { service_admin_trigger_data_export } from "@/lib/admin/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/customers/[account_id]/data-export
 *
 * No request body. Builds the same data export the customer would
 * receive from the self-serve route and returns it inline. The admin
 * downloads the JSON in the browser; the customer is not notified.
 * The audit log records the action with the generated filename and
 * timestamp.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ account_id: string }> },
) {
  const { account_id } = await context.params;

  return runAdminAction(
    request,
    account_id,
    "trigger_data_export",
    async (ctx) => {
      const result = await service_admin_trigger_data_export({
        accountId: ctx.accountId,
        adminEmail: ctx.adminEmail,
      });
      return {
        action: "trigger_data_export",
        parameters: {
          filename: result.filename,
          generated_at: result.generatedAt,
        },
        result,
      };
    },
  );
}
