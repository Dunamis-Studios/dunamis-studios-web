/**
 * Admin-driven deactivation of a single Atelier activation slot.
 * URL is keyed by activation_id (the canonical Redis key) rather
 * than machine hash so admins can copy ids directly from the
 * Activations table in the customer detail page.
 */
import { runAdminAction } from "@/lib/admin/action-runner";
import { service_admin_deactivate_device } from "@/lib/admin/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/customers/[account_id]/activations/[activation_id]/deactivate
 *
 * URL keyed by activation_id (not machine hash) because activation_id
 * is the canonical Redis key for the record. The customer detail
 * page surfaces the activation_id in the Activations section so an
 * admin can copy it directly into a curl call for debugging.
 */
export async function POST(
  request: Request,
  context: {
    params: Promise<{ account_id: string; activation_id: string }>;
  },
) {
  const { account_id, activation_id } = await context.params;

  return runAdminAction(request, account_id, "deactivate_device", async (ctx) => {
    const result = await service_admin_deactivate_device({
      accountId: ctx.accountId,
      activationId: activation_id,
      adminEmail: ctx.adminEmail,
    });
    return {
      action: "deactivate_device",
      parameters: {
        activation_id: result.activation_id,
        lid: result.lid,
      },
      result,
    };
  });
}
