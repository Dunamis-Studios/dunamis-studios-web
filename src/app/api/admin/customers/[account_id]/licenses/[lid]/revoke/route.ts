import { z } from "zod";

import { runAdminAction, AdminActionError } from "@/lib/admin/action-runner";
import { service_admin_revoke_license } from "@/lib/admin/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  reason: z.string().trim().min(1, "Reason is required").max(1000),
  revocation_mode: z.enum(["immediate", "grace_14d"]).optional(),
});

/**
 * POST /api/admin/customers/[account_id]/licenses/[lid]/revoke
 *
 * Body: { reason: string, revocation_mode?: "immediate" | "grace_14d" }.
 * Reason is required; it lands on the license record AND in the
 * audit-log entry's parameters block.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ account_id: string; lid: string }> },
) {
  const { account_id, lid } = await context.params;

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AdminActionError(
        400,
        issue?.message ?? "Invalid request body",
        { lid },
      );
    }
    body = parsed.data;
  } catch (err) {
    if (err instanceof AdminActionError) throw err;
    throw new AdminActionError(400, "Invalid JSON body", { lid });
  }

  return runAdminAction(request, account_id, "revoke_license", async (ctx) => {
    const result = await service_admin_revoke_license({
      accountId: ctx.accountId,
      lid,
      adminEmail: ctx.adminEmail,
      reason: body.reason,
      revocationMode: body.revocation_mode,
    });
    return {
      action: "revoke_license",
      parameters: {
        lid: result.lid,
        previous_status: result.previous_status,
        new_status: result.new_status,
        revocation_mode: body.revocation_mode ?? "grace_14d",
        reason: body.reason,
      },
      result,
    };
  });
}
