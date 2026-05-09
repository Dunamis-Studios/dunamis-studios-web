import { NextResponse } from "next/server";
import { put as vercelBlobPut, del as vercelBlobDel } from "@vercel/blob";

import { apiError } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { saveAccount } from "@/lib/accounts";
import { getCurrentSession } from "@/lib/session";
import { toPublicAccount } from "@/lib/types";

// 2 MB hard cap on uploaded logo size. Lifted to a constant so the
// validation message and the runtime check stay in lockstep.
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

// Allowlist of mime types we accept as logos. Aligns with the file
// picker's accept attribute on the Atelier Setup screen and the
// /account/settings logo widget. Vector + raster, no animated formats
// (GIF excluded — animated logos in product chrome are a footgun).
const ALLOWED_MIMES = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

/**
 * POST /api/account/logo — upload (or replace) the customer's logo.
 *
 * Multipart form upload with a single `file` field. Validates mime
 * type + size, uploads to Vercel Blob under
 * `account-logos/{accountId}/logo.{ext}`, updates the account, and
 * returns the new public URL.
 *
 * Replacement semantics: the blob path is stable per accountId so a
 * re-upload overwrites in place when the extension matches. When the
 * extension changes (PNG → SVG), the prior blob is at a different
 * path and would orphan, so we delete the prior URL before saving the
 * new one. Vercel Blob's `addRandomSuffix: false` is what makes the
 * stable-path overwrite work.
 */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = await rateLimit("logo-upload", ip, 20, 60 * 60);
  if (!rl.ok) {
    return apiError(429, "rate_limited", "Too many uploads — try again later.");
  }

  const session = await getCurrentSession();
  if (!session) {
    return apiError(401, "unauthenticated", "Please sign in.");
  }
  const account = session.account;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return apiError(400, "invalid_form", "Request body must be multipart/form-data");
  }
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return apiError(400, "missing_file", "Upload must include a `file` field.");
  }
  const blob = file as File;
  if (!ALLOWED_MIMES.has(blob.type)) {
    return apiError(
      415,
      "unsupported_media_type",
      "Logo must be JPEG, PNG, SVG, or WebP.",
    );
  }
  if (blob.size > MAX_LOGO_BYTES) {
    return apiError(
      413,
      "payload_too_large",
      `Logo must be under ${Math.floor(MAX_LOGO_BYTES / (1024 * 1024))} MB.`,
    );
  }
  if (blob.size === 0) {
    return apiError(400, "empty_file", "Logo file is empty.");
  }

  const ext = EXT_BY_MIME[blob.type];
  const path = `account-logos/${account.accountId}/logo.${ext}`;
  const priorUrl = account.logoUrl ?? null;

  // Upload first, then mutate the account. If the upload fails
  // mid-flight the account stays pointing at the prior logo (or
  // null) — strictly safer than the reverse order.
  let uploaded;
  try {
    uploaded = await vercelBlobPut(path, blob, {
      access: "public",
      addRandomSuffix: false,
      contentType: blob.type,
      // Cache for an hour at the CDN; the URL is stable per accountId+ext
      // so an immediate re-upload under the same key is effectively
      // versioned by the new content.
      cacheControlMaxAge: 60 * 60,
    });
  } catch (err) {
    console.error("[account/logo POST] Vercel Blob put failed", err);
    return apiError(502, "storage_failure", "Couldn't store the logo. Please try again.");
  }

  account.logoUrl = uploaded.url;
  account.updatedAt = new Date().toISOString();
  await saveAccount(account);

  // Best-effort cleanup of the prior blob when the extension changed
  // (so the path differs and the upload didn't overwrite in place).
  // Failure to delete is logged but not surfaced — the account is
  // already pointing at the new URL, the orphan can be reaped later.
  if (priorUrl && priorUrl !== uploaded.url) {
    try {
      await vercelBlobDel(priorUrl);
    } catch (err) {
      console.warn("[account/logo POST] orphaned prior blob", priorUrl, err);
    }
  }

  return NextResponse.json({
    ok: true,
    logoUrl: uploaded.url,
    account: toPublicAccount(account),
  });
}

/**
 * DELETE /api/account/logo — remove the logo.
 *
 * Sets account.logoUrl to null and best-effort deletes the blob.
 * Idempotent — calling on an account without a logo is a no-op
 * success.
 */
export async function DELETE() {
  const session = await getCurrentSession();
  if (!session) {
    return apiError(401, "unauthenticated", "Please sign in.");
  }
  const account = session.account;

  const priorUrl = account.logoUrl ?? null;
  if (!priorUrl) {
    return NextResponse.json({
      ok: true,
      logoUrl: null,
      account: toPublicAccount(account),
    });
  }

  account.logoUrl = null;
  account.updatedAt = new Date().toISOString();
  await saveAccount(account);

  try {
    await vercelBlobDel(priorUrl);
  } catch (err) {
    console.warn("[account/logo DELETE] blob delete failed", priorUrl, err);
  }

  return NextResponse.json({
    ok: true,
    logoUrl: null,
    account: toPublicAccount(account),
  });
}
