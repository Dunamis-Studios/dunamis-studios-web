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

  return { ok: true, entitlement, redirectTo };
}
