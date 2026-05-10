import { createPrivateKey, randomUUID, sign } from "node:crypto";

import { redis, KEY } from "./redis";
import { hashEmail } from "./email-hash";

/**
 * Ed25519 license signing for Atelier.
 *
 * Mirrors the byte-for-byte format produced by
 * Software Projects/atelier/scripts/generate-license.py and verified
 * by Software Projects/atelier/src-tauri/src/services/licensing/verify.rs:
 *
 *     ATLR-{base64url(payload)}.{base64url(signature)}
 *
 * where `payload` is the UTF-8 JSON encoding of:
 *
 *     { v, lid, email, product, major, tier, issued }
 *
 * with insertion-order key emission (which matches both Python's
 * `json.dumps(..., separators=(",",":"))` and Node's
 * `JSON.stringify(obj)` with no space argument), and `signature`
 * is the Ed25519 signature of the payload bytes against the
 * private key in env var ATELIER_LICENSE_SIGNING_PRIVATE_KEY.
 *
 * The Rust verifier in atelier/src-tauri/.../verify.rs performs
 * signature-first verification (signature checked before payload
 * is deserialized), so any tampering with the payload bytes after
 * issuance produces a cryptographic InvalidSignature failure
 * rather than a structured-content error.
 *
 * lid is a UUIDv4 string from Node's crypto.randomUUID(). Python's
 * generator uses uuid4 — same shape.
 *
 * issued is an ISO-8601 UTC timestamp at second precision, matching
 * the Python generator's "%Y-%m-%dT%H:%M:%SZ" format.
 */

const SCHEMA_VERSION = 1;
export const ATELIER_PRODUCT_NAME = "atelier" as const;
const LICENSE_PREFIX = "ATLR-";

export const VALID_TIERS = ["self-serve"] as const;
export type AtelierLicenseTier = (typeof VALID_TIERS)[number];

/**
 * Tagged error thrown by the signing path when
 * ATELIER_LICENSE_SIGNING_PRIVATE_KEY is not set in the runtime
 * environment. Production and Preview always have the key
 * provisioned in Vercel; Development intentionally does not, so a
 * developer running `npm run dev` against this codebase can build
 * and serve the site without configuring license signing locally.
 *
 * Routes catch this and convert it to a structured 503 response
 * (see LICENSE_SIGNING_UNAVAILABLE_BODY below) so consumers see a
 * clean machine-readable error rather than a 500-with-stack-trace.
 *
 * Same lazy-init shape as the KB_RATING_SALT fix from earlier in
 * src/lib/kb-rating.ts: env var is checked at call time, not module
 * load, so route modules can be imported in any environment.
 */
export class LicenseSigningUnavailableError extends Error {
  readonly code = "license_signing_unavailable_in_dev";
  constructor() {
    super(
      "License signing requires production/preview env vars (ATELIER_LICENSE_SIGNING_PRIVATE_KEY).",
    );
    this.name = "LicenseSigningUnavailableError";
  }
}

/**
 * Canonical response body for the license-signing-unavailable case.
 * Pulled into a constant so every route returns the exact same
 * shape — easier to test and easier for clients to branch on.
 */
export const LICENSE_SIGNING_UNAVAILABLE_BODY = {
  error: "license_signing_unavailable_in_dev",
  message:
    "License signing requires production/preview env vars (ATELIER_LICENSE_SIGNING_PRIVATE_KEY).",
} as const;

export interface SignedLicense {
  /** The full license string in the ATLR-{payload}.{signature} format. */
  licenseString: string;
  /** The unique license ID — a UUIDv4 generated at signing time. */
  lid: string;
  /** ISO-8601 UTC timestamp at second precision, baked into the
   *  signed payload so re-verification can confirm the issuance moment. */
  issued: string;
}

export interface SignLicenseInput {
  email: string;
  product: "atelier";
  versionMajor: number;
  tier: AtelierLicenseTier;
}

/**
 * Encode bytes as URL-safe base64 with no padding. Mirrors the
 * Rust verifier's URL_SAFE_NO_PAD and the Python generator's
 * `base64.urlsafe_b64encode(...).rstrip(b"=")`.
 */
function b64urlNoPad(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Extract the lid (license id) from a signed license string without
 * verifying the signature. The bytes-on-the-wire are
 * `ATLR-{base64url(payload)}.{base64url(signature)}`; we base64-decode
 * the payload portion, parse it as JSON, and read the lid field.
 *
 * Server-side authentication does not depend on Ed25519 verification
 * (the Rust client already verifies before sending), but it does rely
 * on a byte-for-byte equality check against the canonical key_string
 * stored in Redis. parseLicenseId is the lookup hint that lets us find
 * the canonical record before doing the comparison; tampering with
 * the payload bytes either breaks the JSON parse here or breaks the
 * key_string equality check downstream — either way the request is
 * rejected without reaching the activation slot logic.
 *
 * Returns null on any malformed input. Throws nothing — callers treat
 * a null return as "license_not_found".
 */
export function parseLicenseId(licenseString: string): string | null {
  if (!licenseString.startsWith(LICENSE_PREFIX)) return null;
  const trimmed = licenseString.slice(LICENSE_PREFIX.length);
  const dot = trimmed.indexOf(".");
  if (dot < 0) return null;
  const payloadB64 = trimmed.slice(0, dot);
  // Base64-url to base64 standard, with padding for Buffer.from.
  const padded = payloadB64
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(payloadB64.length + ((4 - (payloadB64.length % 4)) % 4), "=");
  let payloadJson: string;
  try {
    payloadJson = Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return null;
  }
  try {
    const obj = JSON.parse(payloadJson) as { lid?: unknown };
    return typeof obj.lid === "string" && obj.lid.length > 0 ? obj.lid : null;
  } catch {
    return null;
  }
}

function loadPrivateKey() {
  const pem = process.env.ATELIER_LICENSE_SIGNING_PRIVATE_KEY;
  if (!pem) {
    throw new LicenseSigningUnavailableError();
  }
  // The env value may have literal "\n" sequences instead of real
  // newlines (typical of Vercel's UI). Normalize before passing to
  // the crypto subsystem.
  const normalized = pem.replace(/\\n/g, "\n");
  return createPrivateKey({ key: normalized, format: "pem" });
}

/**
 * Pure signing — no Redis writes, no email side effects. Produces
 * the license string + metadata. Suitable for callers that want to
 * persist the result themselves (e.g. a future Stripe webhook handler
 * that signs in response to a successful purchase event).
 */
export function signLicense(input: SignLicenseInput): SignedLicense {
  const lid = randomUUID();
  const issued = nowIso();

  // The payload object must be constructed in the exact field order
  // emitted by the Python generator. Node's JSON.stringify follows
  // insertion order for string keys (ES2015+ spec), so as long as
  // properties are listed here in the same order, the resulting
  // bytes match the Python output byte-for-byte and verify against
  // the Rust verifier identically.
  const payload = {
    v: SCHEMA_VERSION,
    lid,
    email: input.email,
    product: input.product,
    major: input.versionMajor,
    tier: input.tier,
    issued,
  };
  const payloadBytes = Buffer.from(JSON.stringify(payload), "utf8");

  const privateKey = loadPrivateKey();
  // Node's crypto.sign with algorithm=null and an Ed25519 key
  // produces the raw 64-byte signature, exactly what the Rust
  // ed25519-dalek verifier expects.
  const signatureBytes = sign(null, payloadBytes, privateKey);

  const licenseString = `${LICENSE_PREFIX}${b64urlNoPad(payloadBytes)}.${b64urlNoPad(signatureBytes)}`;

  return {
    licenseString,
    lid,
    issued,
  };
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export type AtelierLicenseStatus = "active" | "refunded" | "revoked";

/**
 * Revocation enforcement mode. Admins choose this per revocation in
 * the admin UI:
 *   - "immediate": the next activate/heartbeat returns a hard "revoked"
 *     response and the client locks instantly.
 *   - "grace_14d": the next activate/heartbeat returns a soft warning,
 *     and the client lockdown only triggers if the heartbeat is still
 *     hitting a revoked license 14 days after `revoked_at`. Default
 *     for refund-driven revocations where a courtesy window is
 *     expected.
 *   - undefined / null: license is not revoked.
 */
export type AtelierRevocationMode = "immediate" | "grace_14d";

export interface AtelierLicenseRecord {
  lid: string;
  key_string: string;
  email: string;
  /**
   * Dunamis Studios account id of the paying / owning customer. Every
   * license issued after the site-purchase-gate slice carries an
   * account_id; pre-existing records carry null until the backfill
   * script (scripts/backfill-license-account-id.ts) resolves them.
   *
   * The account_id binding is the canonical owner of the license. The
   * email field is preserved for back-compat with the lost-license
   * lookup, the issuance email, and pre-account-bound records — but
   * customer-portal reads, account-bound activation, and admin
   * tooling all key off account_id.
   */
  account_id?: string | null;
  product: "atelier";
  version_major: number;
  tier: AtelierLicenseTier;
  issued_at: string;
  status: AtelierLicenseStatus;
  stripe_customer_id?: string | null;
  stripe_payment_intent_id?: string | null;
  issued_by_admin_email?: string | null;
  /**
   * Revocation metadata. Populated when status transitions to
   * "revoked"; left null otherwise. The mode field controls whether
   * the client locks immediately or after the 14-day grace window.
   * Reason is free-text admin commentary visible only in the admin UI
   * and audit logs.
   */
  revocation_mode?: AtelierRevocationMode | null;
  revoked_at?: string | null;
  revoked_by_admin_email?: string | null;
  revocation_reason?: string | null;
}

export interface PersistLicenseInput {
  signed: SignedLicense;
  email: string;
  /**
   * Dunamis Studios account id binding. Required for net-new
   * issuance once the site purchase gate is in force; nullable so
   * the type permits the historical no-account-bound shape during
   * the migration window. Backfill resolves remaining nulls.
   */
  accountId?: string | null;
  product: "atelier";
  versionMajor: number;
  tier: AtelierLicenseTier;
  issuedByAdminEmail?: string | null;
  stripeCustomerId?: string | null;
  stripePaymentIntentId?: string | null;
}

/**
 * Sign and persist a license atomically across the three Redis
 * key patterns: the canonical license record, the email index, and
 * the product index. If any of the three writes fails, the function
 * throws and the caller is expected to surface the error — the
 * lookup indexes can drift in a partial-write scenario, but the
 * canonical record is the source of truth and the indexes are
 * rebuildable from a scan if the drift becomes load-bearing.
 *
 * Atomicity is best-effort. Upstash supports MULTI/EXEC for true
 * atomicity, but the SDK pattern reads more cleanly as three
 * sequential awaits. For a v1 administrative pipeline (Josh hand-
 * issuing licenses), the failure mode is "I see an error, I check
 * Upstash, I clean up by hand if needed" — acceptable.
 */
export async function persistLicense(
  input: PersistLicenseInput,
): Promise<AtelierLicenseRecord> {
  const accountId = input.accountId ?? null;
  const record: AtelierLicenseRecord = {
    lid: input.signed.lid,
    key_string: input.signed.licenseString,
    email: input.email,
    account_id: accountId,
    product: input.product,
    version_major: input.versionMajor,
    tier: input.tier,
    issued_at: input.signed.issued,
    status: "active",
    stripe_customer_id: input.stripeCustomerId ?? null,
    stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
    issued_by_admin_email: input.issuedByAdminEmail ?? null,
  };
  const r = redis();
  const emailHashed = hashEmail(input.email);
  await r.set(KEY.atelierLicense(record.lid), record);
  await r.sadd(KEY.atelierLicensesByEmail(emailHashed), record.lid);
  await r.sadd(KEY.atelierLicensesByProduct(record.product), record.lid);
  if (accountId) {
    await r.sadd(KEY.atelierLicensesByAccount(accountId), record.lid);
  }
  return record;
}

/** Convenience wrapper combining sign + persist. */
export async function signAndPersistLicense(
  input: SignLicenseInput & {
    accountId?: string | null;
    issuedByAdminEmail?: string | null;
    stripeCustomerId?: string | null;
    stripePaymentIntentId?: string | null;
  },
): Promise<{ signed: SignedLicense; record: AtelierLicenseRecord }> {
  const signed = signLicense(input);
  const record = await persistLicense({
    signed,
    email: input.email,
    accountId: input.accountId ?? null,
    product: input.product,
    versionMajor: input.versionMajor,
    tier: input.tier,
    issuedByAdminEmail: input.issuedByAdminEmail ?? null,
    stripeCustomerId: input.stripeCustomerId ?? null,
    stripePaymentIntentId: input.stripePaymentIntentId ?? null,
  });
  return { signed, record };
}

// ---------------------------------------------------------------------------
// Reads + status mutations
// ---------------------------------------------------------------------------

export async function getLicense(lid: string): Promise<AtelierLicenseRecord | null> {
  const r = redis();
  return (await r.get<AtelierLicenseRecord>(KEY.atelierLicense(lid))) ?? null;
}

export async function listLicensesByEmail(
  email: string,
): Promise<AtelierLicenseRecord[]> {
  const r = redis();
  const lids = await r.smembers(KEY.atelierLicensesByEmail(hashEmail(email)));
  if (lids.length === 0) return [];
  const records = await Promise.all(
    lids.map((lid) => r.get<AtelierLicenseRecord>(KEY.atelierLicense(lid))),
  );
  return records.filter((r): r is AtelierLicenseRecord => r != null);
}

export async function listLicensesByProduct(
  product: string,
): Promise<AtelierLicenseRecord[]> {
  const r = redis();
  const lids = await r.smembers(KEY.atelierLicensesByProduct(product));
  if (lids.length === 0) return [];
  const records = await Promise.all(
    lids.map((lid) => r.get<AtelierLicenseRecord>(KEY.atelierLicense(lid))),
  );
  return records.filter((r): r is AtelierLicenseRecord => r != null);
}

/**
 * Read every license belonging to a Dunamis Studios account, by
 * account_id index. Returns active + refunded + revoked records — the
 * caller filters as needed (the customer portal hides refunded
 * licenses, the admin tooling shows them all).
 *
 * Returns [] for an account with no licenses or one whose licenses
 * pre-date the account_id binding and haven't been backfilled yet.
 * Callers that must support the migration window should use
 * listLicensesForAccountWithFallback (below) instead.
 */
export async function listLicensesByAccount(
  accountId: string,
): Promise<AtelierLicenseRecord[]> {
  const r = redis();
  const lids = await r.smembers(KEY.atelierLicensesByAccount(accountId));
  if (lids.length === 0) return [];
  const records = await Promise.all(
    lids.map((lid) => r.get<AtelierLicenseRecord>(KEY.atelierLicense(lid))),
  );
  return records.filter((r): r is AtelierLicenseRecord => r != null);
}

/**
 * Account-bound license list with email-index fallback for the
 * migration window. Reads the account-id index first; if it returns
 * nothing AND an email is provided, falls back to the email index
 * and filters to records whose account_id is null OR equal to the
 * passed accountId (so a stale email-index entry from a different
 * account doesn't leak across).
 *
 * Once the backfill script has run across all Atelier licenses and
 * confirmed zero account_id:null records remain, callers should
 * collapse to listLicensesByAccount and the email-index code path
 * can be deleted. Until then, this is the function customer-facing
 * surfaces should call so the portal stays correct mid-migration.
 */
export async function listLicensesForAccountWithFallback(
  accountId: string,
  email: string | null | undefined,
): Promise<AtelierLicenseRecord[]> {
  const byAccount = await listLicensesByAccount(accountId);
  if (byAccount.length > 0 || !email) return byAccount;
  const byEmail = await listLicensesByEmail(email);
  return byEmail.filter(
    (l) => l.account_id == null || l.account_id === accountId,
  );
}

/**
 * Optional revocation metadata bundled with a "revoked" status flip.
 * The mode field maps to the atelier-activation grace window:
 * "immediate" causes activate/heartbeat to hard-lock instantly;
 * "grace_14d" gives the customer the 14-day window before lockdown.
 * Reason is admin commentary visible only in the admin UI.
 */
export interface SetLicenseStatusOptions {
  revocation_mode?: AtelierRevocationMode;
  revocation_reason?: string;
  revoked_by_admin_email?: string;
}

export async function setLicenseStatus(
  lid: string,
  status: AtelierLicenseStatus,
  options: SetLicenseStatusOptions = {},
): Promise<AtelierLicenseRecord | null> {
  const existing = await getLicense(lid);
  if (!existing) return null;
  const updated: AtelierLicenseRecord = { ...existing, status };
  if (status === "revoked") {
    updated.revocation_mode = options.revocation_mode ?? "grace_14d";
    updated.revoked_at =
      existing.revoked_at ??
      new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    updated.revoked_by_admin_email = options.revoked_by_admin_email ?? null;
    updated.revocation_reason = options.revocation_reason ?? null;
  } else {
    // Status reverted away from revoked (or set to refunded): clear
    // the revocation metadata so a future "revoked" flip starts
    // fresh rather than reusing stale fields.
    updated.revocation_mode = null;
    updated.revoked_at = null;
    updated.revoked_by_admin_email = null;
    updated.revocation_reason = null;
  }
  const r = redis();
  await r.set(KEY.atelierLicense(lid), updated);
  return updated;
}
