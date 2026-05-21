/**
 * POST /api/admin/customers/[account_id]/refresh-stripe: read-only
 * Stripe drift report. For every entitlement on the account, pulls
 * the live Customer, active subscriptions, and recent PaymentIntents
 * and diffs them against the local entitlement record. No writes
 * happen here; auto-reconciliation is intentionally deferred until
 * the drift surface is well understood.
 */
import { runAdminAction } from "@/lib/admin/action-runner";
import { service_admin_refresh_from_stripe } from "@/lib/admin/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/customers/[account_id]/refresh-stripe
 *
 * No request body. Read-only diagnostic: for every entitlement on the
 * account, queries Stripe for the current customer record + active
 * subscriptions + recent payment intents. Returns a consolidated drift
 * report. No local writes happen yet; auto-reconciliation is a follow-
 * up once the drift shape is well understood.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ account_id: string }> },
) {
  const { account_id } = await context.params;

  return runAdminAction(
    request,
    account_id,
    "refresh_from_stripe",
    async (ctx) => {
      const result = await service_admin_refresh_from_stripe({
        accountId: ctx.accountId,
        adminEmail: ctx.adminEmail,
      });
      return {
        action: "refresh_from_stripe",
        parameters: {
          entitlement_count: result.entitlementCount,
          stripe_errors: result.errors.length,
        },
        result,
      };
    },
  );
}
