import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { stripe } from "@/lib/stripe";
import { getCurrentSession } from "@/lib/session";
import { getEntitlement } from "@/lib/accounts";
import { portalIdSchema } from "@/lib/validation";

const bodySchema = z.object({
  product: z.literal("debrief"),
  portalId: portalIdSchema,
});

export async function POST(req: Request) {
  const s = await getCurrentSession();
  if (!s) return apiError(401, "unauthenticated", "Please sign in.");

  const parsed = await parseJson(req, bodySchema);
  if (!parsed.ok) return parsed.response;
  const { product, portalId } = parsed.data;

  const entitlement = await getEntitlement(product, portalId);
  if (!entitlement || entitlement.accountId !== s.account.accountId) {
    return apiError(404, "not_found", "Entitlement not found.");
  }

  const customerId = entitlement.stripeCustomerId;
  if (!customerId) {
    return apiError(
      400,
      "no_customer",
      "No Stripe customer associated with this entitlement yet. Start a subscription or buy credits first.",
    );
  }

  const api = stripe();
  const appUrl = process.env.APP_URL ?? "https://www.dunamisstudios.net";
  const session = await api.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/account/${product}/${portalId}`,
  });

  return NextResponse.json({ url: session.url });
}
