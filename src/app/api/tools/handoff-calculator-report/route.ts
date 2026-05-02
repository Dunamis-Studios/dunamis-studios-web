import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { redis, KEY } from "@/lib/redis";
import {
  sendHandoffCalculatorReportEmail,
  type HandoffCalculatorInputs,
  type HandoffCalculatorResults,
} from "@/lib/email-tool-report";

/**
 * POST /api/tools/handoff-calculator-report
 *
 * Lead capture for the /tools/handoff-time-calculator surface. The
 * frontend submits the visitor's email plus the inputs they filled in
 * and the computed results. Three side effects, in order:
 *
 *   1. Redis write to dunamis:tools:handoff-calculator:{hash} as
 *      source of truth. If this fails, the request fails with 500.
 *   2. HubSpot Forms mirror via the public form endpoint, tagged
 *      with notify_interests = "Free Tools - Handoff Calculator".
 *      Best-effort; failures are logged but do not bubble up.
 *   3. Resend transactional email delivering the report to the
 *      visitor. Best-effort; failure does not fail the lead capture.
 *
 * Inputs are re-validated server side because the client-side
 * computation is untrusted; the server recomputes results from the
 * same formula so the email and Redis row reflect canonical values
 * regardless of any client-side tampering.
 */

const TOOL_SLUG = "handoff-calculator";
const PRODUCT_NAME = "Free Tools - Handoff Calculator";

const HUBSPOT_API_BASE = "https://api.hubapi.com";
const HUBSPOT_FORMS_BASE = "https://api.hsforms.com";
const PUBLIC_PAGE_BASE = "https://www.dunamisstudios.net";

const InputsSchema = z.object({
  reps: z.number().int().positive().max(10000),
  dealsPerRepPerQuarter: z.number().int().positive().max(10000),
  handoffHours: z.number().positive().max(40),
  hourlyCost: z.number().positive().max(10000),
  turnoverPct: z.number().min(0).max(100),
});

const BodySchema = z.object({
  email: z.string().email().max(254),
  inputs: InputsSchema,
  hubspotutk: z.string().max(200).optional(),
});

interface ToolReportRecord {
  email: string;
  toolSlug: string;
  inputs: HandoffCalculatorInputs;
  results: HandoffCalculatorResults;
  submittedAt: string;
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

/**
 * Canonical formula. Mirrored on the client for live preview but the
 * server's value is the one that ships in the email and the Redis row.
 */
function computeHandoffResults(
  inputs: HandoffCalculatorInputs,
): HandoffCalculatorResults {
  const annualDeals = inputs.reps * inputs.dealsPerRepPerQuarter * 4;
  const routineHours = annualDeals * inputs.handoffHours;
  const routineCost = routineHours * inputs.hourlyCost;
  const turnoverHandoffs = Math.round(
    inputs.reps * (inputs.turnoverPct / 100) * inputs.dealsPerRepPerQuarter,
  );
  // Reassigned deals take roughly twice the time of routine handoffs
  // because the new owner is starting cold without a deal-close trigger
  // or a CS-handoff doc.
  const turnoverHours = turnoverHandoffs * inputs.handoffHours * 2;
  const turnoverCost = turnoverHours * inputs.hourlyCost;
  const totalHours = routineHours + turnoverHours;
  const totalCost = routineCost + turnoverCost;
  return {
    annualDeals,
    routineHours,
    routineCost,
    turnoverHandoffs,
    turnoverHours,
    turnoverCost,
    totalHours,
    totalCost,
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your inputs and try again." },
      { status: 400 },
    );
  }

  const { email, inputs, hubspotutk } = parsed.data;
  const cleanEmail = email.trim();
  const results = computeHandoffResults(inputs);
  const ipAddress = clientIp(req);

  const record: ToolReportRecord = {
    email: cleanEmail,
    toolSlug: TOOL_SLUG,
    inputs,
    results,
    submittedAt: new Date().toISOString(),
    ip: ipAddress,
    userAgent: req.headers.get("user-agent") ?? "unknown",
  };

  try {
    const r = redis();
    const key = KEY.toolReport(TOOL_SLUG, hashEmail(cleanEmail));
    await r.set(key, record);
  } catch (err) {
    console.error("[tools/handoff-calculator] redis write failed", err);
    return NextResponse.json(
      { error: "Could not record report. Please try again." },
      { status: 500 },
    );
  }

  // Best-effort HubSpot mirror. Same Forms endpoint as the notify form
  // so the contact gets created or upserted, with notify_interests
  // appended to indicate a free-tool lead. Reuses the existing form
  // GUID env var; a per-tool form GUID can be added later if the
  // segmentation needs to live entirely inside HubSpot.
  try {
    await mirrorToHubSpot({
      email: cleanEmail,
      hubspotutk,
      ipAddress: ipAddress !== "unknown" ? ipAddress : undefined,
    });
  } catch (err) {
    console.error("[tools/handoff-calculator] hubspot mirror threw", err);
  }

  try {
    await sendHandoffCalculatorReportEmail({
      to: cleanEmail,
      inputs,
      results,
    });
  } catch (err) {
    console.error("[tools/handoff-calculator] email send failed", err);
  }

  return NextResponse.json({ ok: true, results });
}

interface MirrorArgs {
  email: string;
  hubspotutk?: string;
  ipAddress?: string;
}

interface ContactLookupResponse {
  properties?: { notify_interests?: string | null };
}

function mergeInterests(existing: string, addition: string): string {
  const parts = existing
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (!parts.includes(addition)) parts.push(addition);
  return parts.join(";");
}

async function mirrorToHubSpot({
  email,
  hubspotutk,
  ipAddress,
}: MirrorArgs): Promise<void> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const formGuid = process.env.HUBSPOT_NOTIFY_FORM_GUID;
  if (!accessToken || !portalId || !formGuid) {
    console.warn(
      "[tools/handoff-calculator] hubspot env vars missing; skipping mirror",
    );
    return;
  }

  let existingInterests = "";
  try {
    const lookupUrl = `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${encodeURIComponent(
      email,
    )}?idProperty=email&properties=notify_interests`;
    const res = await fetch(lookupUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 200) {
      const data = (await res.json()) as ContactLookupResponse;
      existingInterests = data.properties?.notify_interests ?? "";
    } else if (res.status !== 404) {
      const text = await res.text().catch(() => "");
      console.error("[tools/handoff-calculator] contact lookup failed", {
        status: res.status,
        body: text.slice(0, 500),
      });
      return;
    }
  } catch (err) {
    console.error("[tools/handoff-calculator] contact lookup threw", err);
    return;
  }

  const merged = mergeInterests(existingInterests, PRODUCT_NAME);
  const submitUrl = `${HUBSPOT_FORMS_BASE}/submissions/v3/integration/submit/${portalId}/${formGuid}`;
  const context: Record<string, string> = {
    pageUri: `${PUBLIC_PAGE_BASE}/tools/handoff-time-calculator`,
    pageName: "Handoff Time Calculator report request",
  };
  if (hubspotutk) context.hutk = hubspotutk;
  if (ipAddress) context.ipAddress = ipAddress;
  const res = await fetch(submitUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: [
        { name: "email", value: email },
        { name: "notify_interests", value: merged },
      ],
      context,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[tools/handoff-calculator] hubspot submit failed", {
      status: res.status,
      body: text.slice(0, 500),
    });
  }
}
