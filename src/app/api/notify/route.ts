import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { redis, KEY } from "@/lib/redis";
import { sendNotifySignupEmail } from "@/lib/email-notify";
import { submitToHubSpotNotifyForm } from "@/lib/hubspot-notify";
import {
  PRODUCT_CATALOG_SLUGS,
  PRODUCT_META,
  type ProductCatalogSlug,
} from "@/lib/types";

/**
 * POST /api/notify
 *
 * Records a "notify me when this ships" signup for one of the unshipped
 * Dunamis Studios products. The frontend on each /products/<slug> page
 * for an unshipped product calls this with the visitor's email and the
 * product slug.
 *
 * Three side effects, in order, all best-effort after the Redis write:
 *
 *   1. Redis is the source of truth. SET dunamis:notify:{slug}:{hash}
 *      to a SignupRecord. If this fails, the request fails with 500.
 *   2. HubSpot Notify Interests form. The visitor's signup is mirrored
 *      into a HubSpot contact (created or upserted) with the product
 *      display name appended to a multi-select notify_interests
 *      property. See src/lib/hubspot-notify.ts for the merge semantics.
 *      Failures are logged but do not affect the user-facing response.
 *   3. Resend confirmation email. Sent when RESEND_API_KEY is set; in
 *      local dev without a key, the signup is still persisted and the
 *      email is logged with a redacted recipient.
 */

interface SignupRecord {
  email: string;
  product: ProductCatalogSlug;
  signedUpAt: string;
  ip: string;
  userAgent: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashEmail(email: string): string {
  return createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex")
    .slice(0, 32);
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, product, hubspotutk } = (body ?? {}) as {
    email?: unknown;
    product?: unknown;
    hubspotutk?: unknown;
  };

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (typeof product !== "string") {
    return NextResponse.json(
      { error: "Missing product slug." },
      { status: 400 },
    );
  }
  if (
    !(PRODUCT_CATALOG_SLUGS as readonly string[]).includes(product)
  ) {
    return NextResponse.json(
      { error: "Unknown product." },
      { status: 400 },
    );
  }

  const slug = product as ProductCatalogSlug;
  const cleanEmail = email.trim();
  const ipAddress = clientIp(req);
  const record: SignupRecord = {
    email: cleanEmail,
    product: slug,
    signedUpAt: new Date().toISOString(),
    ip: ipAddress,
    userAgent: req.headers.get("user-agent") ?? "unknown",
  };

  try {
    const r = redis();
    const key = KEY.notifySignup(slug, hashEmail(cleanEmail));
    // SET with no TTL: notify-list entries persist until we drain them
    // when the product ships. Idempotent on repeat submits because the
    // key is deterministic from (product, email).
    await r.set(key, record);
  } catch (err) {
    console.error("[notify] redis write failed", err);
    return NextResponse.json(
      { error: "Could not record signup. Please try again." },
      { status: 500 },
    );
  }

  const productName = PRODUCT_META[slug].name;
  const hubspotutkValue =
    typeof hubspotutk === "string" && hubspotutk.length > 0
      ? hubspotutk
      : undefined;

  // Best-effort HubSpot mirror. Logs and swallows on any HubSpot
  // failure; the visitor's intent is already captured in Redis. The
  // hubspotutk cookie value (when the visitor has tracking enabled)
  // and the visitor IP are forwarded to HubSpot's form submission
  // context so the contact is linked to the visitor's existing
  // tracking session and source attribution populates correctly.
  try {
    await submitToHubSpotNotifyForm({
      email: cleanEmail,
      slug,
      productName,
      hubspotutk: hubspotutkValue,
      ipAddress: ipAddress !== "unknown" ? ipAddress : undefined,
    });
  } catch (err) {
    console.error("[notify] hubspot submission threw", err);
  }

  // Best-effort confirmation email. We do not fail the signup if Resend
  // errors, since the visitor's intent is already captured in Redis.
  try {
    await sendNotifySignupEmail({
      to: cleanEmail,
      productName,
    });
  } catch (err) {
    console.error("[notify] confirmation email failed", err);
  }

  return NextResponse.json({ ok: true });
}
