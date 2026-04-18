import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getEntitlement } from "@/lib/accounts";
import { portalIdSchema, productSlugSchema } from "@/lib/validation";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ product: string; portalId: string }> },
) {
  const current = await getCurrentSession();
  if (!current) return apiError(401, "unauthenticated", "Please sign in.");

  const raw = await ctx.params;
  const product = productSlugSchema.safeParse(raw.product);
  const portalId = portalIdSchema.safeParse(raw.portalId);
  if (!product.success || !portalId.success) {
    return apiError(400, "invalid_params", "Invalid product or portal id.");
  }

  const entitlement = await getEntitlement(product.data, portalId.data);
  if (!entitlement || entitlement.accountId !== current.account.accountId) {
    return apiError(404, "not_found", "Entitlement not found.");
  }

  return NextResponse.json({ entitlement });
}
