import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import {
  getEntitlement,
  linkEntitlementToAccount,
  saveEntitlement,
} from "@/lib/accounts";
import { portalIdSchema, productSlugSchema } from "@/lib/validation";
import { verifyClaimState } from "@/lib/claim-state";

export const dynamic = "force-dynamic";

/**
 * /api/entitlements/claim
 *
 * GET  — entry-point for the Debrief OAuth handoff. Verifies the
 *        signed state token, then routes the browser:
 *          - invalid / expired state      → 400 HTML error page
 *          - no session                   → 302 /signup?claim=debrief:{portalId}&email=...&state=...
 *          - session + not-yet-linked     → 302 /account/debrief/{portalId}/claim?state=...
 *          - session + already linked to  → 302 /account/debrief/{portalId}
 *            current account
 *          - session + linked elsewhere   → 302 /account/debrief/{portalId}/claim?state=...
 *            (page renders the "linked to another account" UI)
 *
 * POST — confirmation action from the /account/.../claim page. Body
 *        { portalId, product, state }. Requires auth. Links the
 *        entitlement stub to the session account after a strict
 *        email-match check against the state token's
 *        installerEmail. Idempotent if already linked to the caller.
 *
 * The GET path exists here (not as a page route) because the
 * /account tree's layout.tsx unconditionally redirects
 * unauthenticated visitors to /login, preventing a page component at
 * /account/debrief/{portalId}/claim from doing the "redirect to
 * /signup instead of /login" branching the install handoff needs.
 * API routes are outside the account layout's reach.
 */

// ---- GET (handoff router) ------------------------------------------------

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawPortalId = url.searchParams.get("portalId");
  // The `email` query param Debrief passes is informational-only —
  // we always take installerEmail from the verified state token
  // (signed, trusted) rather than the URL (spoofable). No need to
  // read it here.
  const state = url.searchParams.get("state");

  const portalIdParsed = portalIdSchema.safeParse(rawPortalId ?? "");
  if (!portalIdParsed.success) {
    return expiredLinkResponse("Missing or invalid portal id.");
  }
  const portalId = portalIdParsed.data;

  const payload = verifyClaimState(state);
  if (!payload) {
    return expiredLinkResponse(
      "This claim link has expired or is invalid.",
    );
  }
  if (payload.portalId !== portalId) {
    // Defense in depth: if the signed token's portalId doesn't match
    // the URL's portalId, reject. An attacker replaying someone
    // else's state with their own portalId in the URL shouldn't get
    // past here.
    return expiredLinkResponse(
      "This claim link's signed state does not match the portal.",
    );
  }

  const baseUrl = new URL("/", url);
  const session = await safeGetSession();

  // Email the signup form should pre-fill comes from the signed
  // token — trust the signature over the URL query param in case a
  // naive attacker strips/changes it.
  const emailForSignup = payload.installerEmail;

  if (!session) {
    const signupUrl = new URL("/signup", baseUrl);
    signupUrl.searchParams.set("claim", `debrief:${portalId}`);
    signupUrl.searchParams.set("email", emailForSignup);
    signupUrl.searchParams.set("state", state!);
    return NextResponse.redirect(signupUrl, 302);
  }

  // Authenticated path — let the page handle all the nuance
  // (entitlement missing, email mismatch, already linked to me,
  // already linked to someone else). Pass the raw state through so
  // the page can re-verify without trusting the URL.
  const claimPageUrl = new URL(
    `/account/debrief/${encodeURIComponent(portalId)}/claim`,
    baseUrl,
  );
  claimPageUrl.searchParams.set("state", state!);
  // Also forward email so a help-desk operator reading the URL in
  // logs can tell which installer the token claims.
  claimPageUrl.searchParams.set("email", emailForSignup);
  return NextResponse.redirect(claimPageUrl, 302);
}

// ---- POST (link action) --------------------------------------------------

const claimBodySchema = z.object({
  portalId: portalIdSchema,
  product: productSlugSchema,
  state: z.string().min(1).max(4096),
});

export async function POST(req: Request) {
  const session = await safeGetSession();
  if (!session) {
    return apiError(401, "unauthenticated", "Please sign in.");
  }

  const parsed = await parseJson(req, claimBodySchema);
  if (!parsed.ok) return parsed.response;
  const { portalId, product, state } = parsed.data;

  // Claim flow is Debrief-only today. Property Pulse will land here
  // when its install flow ships; for now hard-reject with a clear
  // error rather than silently proceeding.
  if (product !== "debrief") {
    return apiError(
      400,
      "unsupported_product",
      "Only Debrief supports claim-style install today.",
    );
  }

  const payload = verifyClaimState(state);
  if (!payload) {
    return apiError(
      400,
      "invalid_state",
      "Claim link has expired or is invalid. Please reinstall Debrief in HubSpot.",
    );
  }
  if (payload.portalId !== portalId) {
    return apiError(
      400,
      "portal_mismatch",
      "Claim link does not match this portal.",
    );
  }

  // Strict email-match: the installer's HubSpot email must equal the
  // authenticated Dunamis account's email. Both sides are already
  // normalized to lowercase (validation.ts emailSchema; signClaimState).
  if (payload.installerEmail !== session.account.email.toLowerCase()) {
    return apiError(
      403,
      "email_mismatch",
      `The HubSpot installer email (${payload.installerEmail}) does not match your Dunamis account (${session.account.email}). Sign in with the HubSpot installer email or contact josh@dunamisstudios.net.`,
    );
  }

  const entitlement = await getEntitlement(product, portalId);
  if (!entitlement) {
    return apiError(
      404,
      "entitlement_missing",
      "No pending entitlement found for this portal. Please reinstall Debrief in HubSpot.",
    );
  }

  const redirectTo = `/account/debrief/${encodeURIComponent(portalId)}`;

  // Idempotency: already linked to the caller → return success so
  // double-clicks or slow retries don't 409 on the user.
  if (entitlement.accountId === session.account.accountId) {
    return NextResponse.json({ ok: true, entitlement, redirectTo });
  }

  if (
    entitlement.accountId &&
    entitlement.accountId !== session.account.accountId
  ) {
    return apiError(
      409,
      "already_claimed",
      "This portal is already linked to another account. Contact josh@dunamisstudios.net if you believe this is wrong.",
    );
  }

  // Unclaimed stub — set accountId then call the existing linker.
  entitlement.accountId = session.account.accountId;
  // Bubble up the current status from "incomplete" only if still the
  // pre-subscribe stub value; don't stomp a status the webhook may
  // have already written (e.g., someone started the Stripe flow
  // before finishing the claim). Defensive; the expected case is
  // status === "incomplete".
  if (!entitlement.status) {
    entitlement.status = "incomplete";
  }
  try {
    await linkEntitlementToAccount(entitlement);
  } catch (err) {
    console.error("[claim] linkEntitlementToAccount failed", err);
    // Roll back our in-memory accountId mutation by persisting the
    // cleared value — if saveEntitlement partially succeeded inside
    // linkEntitlementToAccount, this second write brings the record
    // back to the unclaimed state so the user can retry.
    entitlement.accountId = null;
    await saveEntitlement(entitlement).catch(() => {});
    return apiError(
      500,
      "link_failed",
      "Failed to link this portal to your account. Please try again in a moment.",
    );
  }

  return NextResponse.json({ ok: true, entitlement, redirectTo });
}

// ---- helpers -------------------------------------------------------------

async function safeGetSession() {
  try {
    return await getCurrentSession();
  } catch (err) {
    console.error("[claim] session lookup failed", err);
    return null;
  }
}

function expiredLinkResponse(detail: string): Response {
  // Plain HTML page so unauthenticated visitors (who would otherwise
  // hit the layout's /login redirect if we routed to a page.tsx) see
  // a real, rendered message explaining what to do.
  const body = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<title>Debrief install — link expired</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #0b0b0c; color: #e9e9ea; margin: 0; padding: 2rem; display: flex; min-height: 100vh; align-items: center; justify-content: center; }
  .card { max-width: 32rem; background: #18181b; border: 1px solid #2a2a2e; border-radius: 12px; padding: 2rem; }
  h1 { margin: 0 0 0.75rem; font-size: 1.35rem; font-weight: 600; }
  p { margin: 0.5rem 0; line-height: 1.55; color: #b4b4b8; }
  a { color: #d4a74a; }
  code { background: #24242a; padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.9em; }
</style>
</head><body>
<div class="card" role="alert">
  <h1>This Debrief install link has expired</h1>
  <p>${escapeHtml(detail)}</p>
  <p>Links are valid for 15 minutes after you install Debrief. To generate a fresh link, reinstall Debrief in HubSpot.</p>
  <p><a href="https://ecosystem.hubspot.com/marketplace/apps">Open the HubSpot Marketplace</a> or contact <a href="mailto:josh@dunamisstudios.net">josh@dunamisstudios.net</a> for help.</p>
</div>
</body></html>`;
  return new Response(body, {
    status: 400,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
