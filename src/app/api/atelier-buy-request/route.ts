import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { redis, KEY } from "@/lib/redis";
import { atelierBuyRequestSchema } from "@/lib/validation";
import {
  sendAtelierBuyRequestAdminEmail,
  sendAtelierBuyRequestCustomerConfirmation,
} from "@/lib/email-atelier-buy";

/**
 * POST /api/atelier-buy-request
 *
 * Lead capture for the Atelier marketing page's #buy-atelier form.
 * Three side effects, in order, with the same failure-isolation
 * shape /api/notify uses:
 *
 *   1. Redis SET dunamis:atelier-buy-request:{hash(email)}:{ts}.
 *      The timestamp suffix means a buyer who submits twice
 *      generates two distinct records rather than overwriting the
 *      prior one. If this write fails, the request fails with 500 —
 *      the studio cannot follow up on a lead it never recorded.
 *   2. Best-effort admin notification email (Josh). Resend hiccups
 *      are logged but do not surface to the visitor; their lead is
 *      already captured.
 *   3. Best-effort customer confirmation email. Same isolation —
 *      a Resend failure here does not roll back step 1 or 2.
 *
 * No HubSpot mirror because Atelier is a Software Projects prebuilt
 * product, not a HubSpot product. Nothing here writes to the
 * HubSpot Forms API and nothing reads the hubspotutk cookie.
 *
 * Atelier is a single-tier $149 product — there is no `tier` field
 * on the payload or the persisted record. Customization is a
 * post-purchase service engagement, not a pre-pay tier.
 */

interface BuyRequestRecord {
  firstName: string;
  lastName: string;
  email: string;
  businessName?: string;
  notes?: string;
  signedUpAt: string;
  ip: string;
  userAgent: string;
}

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

  const parsed = atelierBuyRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: firstIssue?.message ?? "Invalid submission.",
        field: firstIssue?.path?.[0],
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const ipAddress = clientIp(req);
  const userAgent = req.headers.get("user-agent") ?? "unknown";
  const signedUpAt = new Date().toISOString();

  const record: BuyRequestRecord = {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    businessName: input.businessName,
    notes: input.notes,
    signedUpAt,
    ip: ipAddress,
    userAgent,
  };

  // Source-of-truth Redis write. The key is multi-write per email
  // because the timestamp suffix is unique per request — a buyer who
  // re-submits creates a new record rather than overwriting the
  // first one. The studio's follow-up workflow needs both, since the
  // second submission is meaningful information.
  try {
    const r = redis();
    // Compact ISO-ish timestamp safe for use as a Redis key segment.
    // Strip colons and fractional seconds so the key stays terse but
    // remains chronologically sortable when listed.
    const tsKey = signedUpAt.replace(/[:.]/g, "-");
    const key = KEY.atelierBuyRequest(hashEmail(input.email), tsKey);
    await r.set(key, record);
  } catch (err) {
    console.error("[atelier-buy] redis write failed", err);
    return NextResponse.json(
      { error: "Could not record your request. Please try again." },
      { status: 500 },
    );
  }

  const emailPayload = {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    businessName: input.businessName,
    notes: input.notes,
    ip: ipAddress !== "unknown" ? ipAddress : undefined,
    userAgent: userAgent !== "unknown" ? userAgent : undefined,
  };

  // Best-effort admin notification. Logged on failure; the lead is
  // already in Redis so the studio still has the data even if email
  // does not land.
  try {
    await sendAtelierBuyRequestAdminEmail(emailPayload);
  } catch (err) {
    console.error("[atelier-buy] admin email threw", err);
  }

  // Best-effort customer confirmation. Same shape — failure is logged,
  // not surfaced. The visitor sees a successful submission state.
  try {
    await sendAtelierBuyRequestCustomerConfirmation(emailPayload);
  } catch (err) {
    console.error("[atelier-buy] customer email threw", err);
  }

  return NextResponse.json({ ok: true });
}
