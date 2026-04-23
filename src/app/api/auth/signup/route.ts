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
  buildAccountContactPatch,
  trackEvents,
  type EventSpec,
  type ProductAppName,
} from "@/lib/hubspot";
import { LEGAL_METADATA } from "@/content/legal/metadata";
import {
  accountConsentArgs,
  computePendingConsentStamps,
} from "@/lib/account-consent";
import { fireClaimAcceptance } from "@/lib/claim-link";

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
    // ToS + Privacy acceptance is implicit-by-signup per the disclosure
    // line on the signup form. Stamped here so HubSpot sync at any
    // future point can re-read the true acceptance version + date
    // instead of falling back to "now" (which would lie about timing
    // on re-syncs) or LEGAL_METADATA.current (which would lie about
    // version if the docs bump later).
    tosVersionAccepted: LEGAL_METADATA.termsMaster.version,
    tosAcceptedAt: now,
    privacyVersionAccepted: LEGAL_METADATA.privacy.version,
    privacyAcceptedAt: now,
    // DPA + Service Addendum acceptance only if this signup carries a
    // claim that succeeds — stamped below in tryLinkClaim after the
    // entitlement link succeeds so we don't stamp consent for an
    // install we couldn't complete.
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
  // Account-level patch is the same on every event in the batch — the
  // merged patch in trackEvents de-dupes property writes, so putting
  // it on the first spec alone is sufficient.
  const accountPatch = buildAccountContactPatch(accountConsentArgs(account));
  const signupEvents: EventSpec[] = [
    {
      type: "account_created",
      properties: {
        app_name: signupAppName,
        portal_id: parsedSignupClaim?.portalId,
        dunamis_account_id: account.accountId,
        signup_source: parsedSignupClaim ? "hubspot_oauth_install" : "website",
      },
      additionalContactPatch: accountPatch,
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
    claim = await tryLinkClaim(rawClaim, rawState, account, ip, userAgent);
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
  ip: string,
  userAgent: string,
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

  // Compute + persist DPA + addendum consent on the Account now that
  // the link succeeded. For a brand-new-user signup, the account has
  // zero consent for dpa/addendum so both will be pending. For a
  // claim arriving at a pre-existing account (shouldn't happen via
  // signup but defensive), we respect prior acceptances and only
  // stamp versions that are missing or behind current LEGAL_METADATA.
  const claimAcceptedAt = new Date().toISOString();
  const pendingConsent = computePendingConsentStamps(
    account,
    product,
    claimAcceptedAt,
  );
  const needsDpa = pendingConsent.dpaVersionAccepted !== undefined;
  const needsAddendum =
    pendingConsent.debriefAddendumVersionAccepted !== undefined ||
    pendingConsent.propertyPulseAddendumVersionAccepted !== undefined;
  if (needsDpa || needsAddendum) {
    Object.assign(account, pendingConsent, { updatedAt: claimAcceptedAt });
    await saveAccount(account);
  }

  // Fire the consolidated claim-link HubSpot batch (terms_accepted for
  // dpa + addendum when newly stamped, plus app_installed always, all
  // merged into one contact upsert that re-stamps every account-level
  // field from the just-updated Account).
  await fireClaimAcceptance({
    email: account.email,
    account,
    entitlement,
    needsDpa,
    needsAddendum,
    ip,
    userAgent,
  });

  return { ok: true, entitlement, redirectTo };
}
