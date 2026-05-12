import { z } from "zod";

import { runAdminAction, AdminActionError } from "@/lib/admin/action-runner";
import { service_admin_update_account_profile } from "@/lib/admin/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    companyName: z
      .string()
      .trim()
      .max(200)
      .nullable()
      .optional()
      .transform((v) => (v === "" ? null : v)),
    email: z.string().trim().email().max(254).optional(),
  })
  .refine(
    (v) =>
      v.firstName !== undefined ||
      v.lastName !== undefined ||
      v.companyName !== undefined ||
      v.email !== undefined,
    { message: "At least one field must be provided" },
  );

/**
 * PATCH /api/admin/customers/[account_id]/profile
 *
 * Body accepts firstName, lastName, companyName, email. All optional;
 * the request must supply at least one. Email rotation goes through
 * rotateAccountEmail so the email index stays consistent. The audit log
 * records every changed field with before/after values.
 */
export async function PATCH(
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
    "update_account_profile",
    async (ctx) => {
      const result = await service_admin_update_account_profile({
        accountId: ctx.accountId,
        adminEmail: ctx.adminEmail,
        firstName: body.firstName,
        lastName: body.lastName,
        companyName: body.companyName,
        email: body.email,
      });
      return {
        action: "update_account_profile",
        parameters: { changed: result.changed },
        result,
      };
    },
  );
}
