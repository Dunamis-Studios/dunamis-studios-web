import { NextResponse } from "next/server";
import { redis, KEY } from "@/lib/redis";
import { signupSchema, parseClaimToken } from "@/lib/validation";
import { apiError, fieldsFromZod } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { uuid, randomToken } from "@/lib/tokens";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  getAccountByEmail,
  saveAccount,
  getAccountIdByEmail,
  getEntitlement,
  linkEntitlementToAccount,
  saveEntitlement,
} from "@/lib/accounts";
import { createSession, setSessionCookie } from "@/lib/session";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { verifyClaimState } from "@/lib/claim-state";
import { PRODUCT_META, type Account, type Entitlement } from "@/lib/types";
import {
  buildInstallContactPatch,
  trackEvents,
  type EventSpec,
  type ProductAppName,
} from "@/lib/hubspot";
import { LEGAL_METADATA } from "@/content/legal/metadata";

type ClaimAttempt =
  | { ok: true; entitlement: Entitlement; redirectTo: string }
  | { ok: false; error: string };

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = await rateLimit("signup", ip, 10, 60 * 15);
  if (!rl.ok) {
    return apiError(429, "rate_limited", "Too many attempts — try again later.");
  }

  // Parse the body once — we need both the signup fields AND the
  // optional { claim, state } install-handoff context. The
  // signupSchema is a ZodEffects (after .refine()), so we can't
  // `.extend()` it; read the extra fields off the raw object with
  // light runtime validation.
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError(400, "invalid_json", "Request body must be JSON");
  }
  if (!raw || typeof raw !== "object") {
    return apiError(400, "invalid_json", "Request body must be a JSON object");
  }
  const rawObj = raw as Record<string, unknown>;

  const signupParsed = signupSchema.safeParse(rawObj);
  if (!signupParsed.success) {
    return apiError(
      422,
      "validation_error",
      "One or more fields are invalid",
      fieldsFromZod(signupParsed.error),
    );
  }
  const { email, firstName, lastName, password } = signupParsed.data;

  const rawClaim =
    typeof rawObj.claim === "string" ? rawObj.claim.trim() : "";
  const rawState =
    typeof rawObj.state === "string" ? rawObj.state.trim() : "";

  const existing = await getAccountByEmail(email);
  if (existing) {
    return apiError(
      409,
      "account_exists",
      "An account with that email already exists.",
    );
  }
  const idxHit = await getAccountIdByEmail(email);
  if (idxHit) {
    return apiError(
      409,
      "account_exists",
      "An account with that email already exists.",
    );
  }

  const now = new Date().toISOString();
  const account: Account = {
    accountId: uuid(),
    email,
    emailVerified: false,
    passwordHash: await hashPassword(password),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await saveAccount(account);

  // HubSpot tracking: signup + ToS + Privacy acceptance. Batched through
  // trackEvents so the three events share a single contact upsert —
  // parallel upserts on a not-yet-existing contact race on POST-create
  // and only one wins, dropping the other two events' property patches.
  // Event sends still run in parallel inside trackEvents; only the
  // contact upsert is coordinated. Skips entirely when
  // HUBSPOT_ACCESS_TOKEN is unset (dev/preview).
  const parsedSignupClaim = rawClaim ? parseClaimToken(rawClaim) : null;
  const signupAppName: ProductAppName | "none" = parsedSignupClaim
    ? parsedSignupClaim.product
    : "none";
  const userAgent = req.headers.get("user-agent") ?? "unknown";
  const signupEvents: EventSpec[] = [
    {
      type: "account_created",
      properties: {
        app_name: signupAppName,
        portal_id: parsedSignupClaim?.portalId,
        dunamis_account_id: account.accountId,
        signup_source: parsedSignupClaim ? "hubspot_oauth_install" : "website",
      },
    },
    {
      type: "terms_accepted",
      properties: {
        dunamis_account_id: account.accountId,
        document_type: "tos",
        document_version: LEGAL_METADATA.termsMaster.version,
        accepted_via: "signup_checkbox",
        ip_address: ip,
        user_agent: userAgent,
      },
    },
    {
      type: "terms_accepted",
      properties: {
        dunamis_account_id: account.accountId,
        document_type: "privacy",
        document_version: LEGAL_METADATA.privacy.version,
        accepted_via: "signup_checkbox",
        ip_address: ip,
        user_agent: userAgent,
      },
    },
  ];
  await trackEvents(account.email, signupEvents);

  const token = randomToken(32);
  await redis().set(
    KEY.verifyEmail(token),
    {
      accountId: account.accountId,
      email: account.email,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    },
    { ex: 60 * 60 * 24 },
  );

  const { jwt, lifetimeSec } = await createSession(account.accountId, {
    userAgent: req.headers.get("user-agent") ?? "unknown",
    ip,
  });
  await setSessionCookie(jwt, lifetimeSec);

  // Best-effort email sends — don't fail signup if email provider is down.
  try {
    await Promise.all([
      sendVerificationEmail(account.email, account.firstName, token),
      sendWelcomeEmail(account.email, account.firstName),
    ]);
  } catch (err) {
    console.error("[signup] email send failed", err);
  }

  // Additive claim attempt — a claim failure does NOT roll back
  // account creation. The account exists and the caller can retry
  // the claim from the app's CRM card later.
  let claim: ClaimAttempt | undefined;
  if (rawClaim && rawState) {
    claim = await tryLinkClaim(rawClaim, rawState, account);
  }

  // Response shape:
  //   { ok: true }                                   — no claim attempted
  //   { ok: true, claim: { ok: true, ...}}          — linked
  //   { ok: true, claim: { ok: false, error: "..."}}— account created, link failed
  return NextResponse.json({
    ok: true,
    ...(claim ? { claim } : {}),
  });
}

async function tryLinkClaim(
  rawClaim: string,
  rawState: string,
  account: Account,
): Promise<ClaimAttempt> {
  const parsedClaim = parseClaimToken(rawClaim);
  if (!parsedClaim) {
    return {
      ok: false,
      error: "Invalid claim format.",
    };
  }
  const { product, portalId } = parsedClaim;
  const label = PRODUCT_META[product].name;

  const payload = verifyClaimState(rawState);
  if (!payload) {
    return {
      ok: false,
      error: "Claim link expired or invalid.",
    };
  }
  if (payload.portalId !== portalId) {
    return {
      ok: false,
      error: "Claim link does not match the portal id.",
    };
  }

  if (payload.installerEmail !== account.email.toLowerCase()) {
    return {
      ok: false,
      error: `Claim link was issued to ${payload.installerEmail}, but you signed up as ${account.email}. The link will only apply to the installer's account.`,
    };
  }

  const entitlement = await getEntitlement(product, portalId);
  if (!entitlement) {
    return {
      ok: false,
      error: `No pending ${label} install found for this portal.`,
    };
  }

  const redirectTo = `/account/${product}/${encodeURIComponent(portalId)}`;

  // Already linked (e.g. the user signed up twice with the same
  // email somehow, or the Dunamis claim page linked it first).
  // Idempotent success if it's our account; 409-style rejection if
  // it's someone else's.
  if (entitlement.accountId === account.accountId) {
    return { ok: true, entitlement, redirectTo };
  }
  if (entitlement.accountId && entitlement.accountId !== account.accountId) {
    return {
      ok: false,
      error: `This ${label} install is already linked to another account.`,
    };
  }

  entitlement.accountId = account.accountId;
  try {
    await linkEntitlementToAccount(entitlement);
  } catch (err) {
    console.error("[signup/claim] linkEntitlementToAccount failed", err);
    entitlement.accountId = null;
    await saveEntitlement(entitlement).catch(() => {});
    return {
      ok: false,
      error: `Failed to link your ${label} install. You can retry from the app.`,
    };
  }

  // HubSpot app_installed — separate trackEvents call from the main
  // signup batch so it fires only when the claim link succeeds, and
  // independently of account_created / terms_accepted. The claim link
  // establishes "this Dunamis account owns this HubSpot portal
  // install"; that's the moment to stamp debrief_installed /
  // property_pulse_installed and increment the install counter.
  await fireAppInstalledFromEntitlement(account.email, entitlement);

  return { ok: true, entitlement, redirectTo };
}

/**
 * Fire app_installed for a freshly-linked entitlement. Shared pattern
 * between the signup tryLinkClaim path and the /api/entitlements/claim
 * POST path — both land on a linked entitlement and need the same
 * HubSpot event. Inlined rather than extracted to a shared lib because
 * both call sites already live in the Next API layer and the helper
 * is a single file-local function in each route file. Mirror this
 * function byte-for-byte if you add a third link site.
 */
async function fireAppInstalledFromEntitlement(
  email: string,
  entitlement: Entitlement,
): Promise<void> {
  const appName: ProductAppName = entitlement.product;
  if (!entitlement.hubspotUserId || !entitlement.scopesGranted?.length) {
    console.warn(
      `[signup/claim] entitlement ${entitlement.product}:${entitlement.portalId} is missing hubspotUserId or scopesGranted — app_installed will fire with empty fallbacks; user should reinstall to refresh the stub`,
    );
  }
  const additionalContactPatch = await buildInstallContactPatch({
    email,
    appName,
  });
  await trackEvents(email, [
    {
      type: "app_installed",
      properties: {
        app_name: appName,
        portal_id: entitlement.portalId,
        dunamis_account_id: entitlement.accountId ?? "",
        hubspot_user_id: entitlement.hubspotUserId ?? "",
        scopes_granted: entitlement.scopesGranted ?? [],
      },
      additionalContactPatch,
    } satisfies EventSpec<"app_installed">,
  ]);
}
