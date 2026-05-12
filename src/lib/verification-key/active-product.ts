import { listLicensesForAccountWithFallback } from "@/lib/atelier-license-signing";

/**
 * "Active product" gate for the verification-key Mode A path. A
 * customer qualifies for the auth-only generate-and-show flow when
 * they hold at least one Atelier (or future prebuilt-product) license
 * with status === "active".
 *
 * Refunded and revoked licenses do NOT count. Refunded customers can
 * still ask for support via Mode B (email verification); the gate
 * here is about skipping the email round-trip, not about denying
 * access to support entirely.
 *
 * HubSpot marketplace customers (Debrief, Property Pulse) and Build
 * Services customers are not represented as Atelier licenses, so they
 * also fall through to Mode B. They have their own portal- or
 * engagement-based identity context that can be re-validated through
 * support email correspondence; carrying a separate active-product
 * heuristic for them is a follow-up if usage data shows the email
 * verification step is a drag for those customer types.
 */
export async function hasActiveProduct(
  accountId: string,
  email: string,
): Promise<boolean> {
  const licenses = await listLicensesForAccountWithFallback(accountId, email);
  return licenses.some((lic) => lic.status === "active");
}
