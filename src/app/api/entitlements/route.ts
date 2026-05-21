/**
 * GET /api/entitlements: list every HubSpot-product entitlement
 * (Property Pulse, Debrief, etc.) linked to the signed-in account.
 * Atelier licenses are not surfaced here; see /api/atelier/my-licenses
 * for that index. Drives the /account dashboard's HubSpot section.
 */
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getEntitlementsForAccount } from "@/lib/accounts";

export async function GET() {
  const current = await getCurrentSession();
  if (!current) return apiError(401, "unauthenticated", "Please sign in.");
  const entitlements = await getEntitlementsForAccount(current.account.accountId);
  return NextResponse.json({ entitlements });
}
