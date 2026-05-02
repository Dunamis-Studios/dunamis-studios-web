import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { redis, KEY } from "@/lib/redis";
import {
  sendHandoffCalculatorReportEmail,
  type HandoffCalculatorInputs,
  type HandoffCalculatorResults,
} from "@/lib/email-tool-report";
import { submitFreeToolLead } from "@/lib/hubspot-free-tools-form";

/**
 * POST /api/tools/handoff-calculator-report
 *
 * Lead capture for the /tools/handoff-time-calculator surface. The
 * frontend submits the visitor's email plus the inputs they filled in.
 * Three side effects, in order:
 *
 *   1. Redis write to dunamis:tools:handoff-calculator:{hash} as
 *      source of truth. If this fails, the request fails with 500.
 *   2. HubSpot Forms mirror via the dedicated "Free Tools - Lead
 *      Capture" form (HUBSPOT_FREE_TOOLS_FORM_GUID), with the tool's
 *      display name landing in the form's hidden free_tool_used field
 *      so HubSpot segmentation can route by tool. Best-effort.
 *   3. Resend transactional email delivering the report to the
 *      visitor. Best-effort; failure does not fail the lead capture.
 *
 * Inputs are re-validated server side because the client-side
 * computation is untrusted; the server recomputes results from the
 * same formula so the email and Redis row reflect canonical values
 * regardless of any client-side tampering.
 */

const TOOL_SLUG = "handoff-calculator";
const TOOL_DISPLAY_NAME = "Handoff Time Calculator";
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

  // Best-effort HubSpot mirror via the dedicated Free Tools form.
  // submitFreeToolLead handles its own logging and never throws past
  // its own try/catch; the await here is for ordering, not for any
  // failure mode that would bubble up.
  await submitFreeToolLead({
    email: cleanEmail,
    toolName: TOOL_DISPLAY_NAME,
    hubspotutk,
    ipAddress: ipAddress !== "unknown" ? ipAddress : undefined,
    pageUri: `${PUBLIC_PAGE_BASE}/tools/handoff-time-calculator`,
    pageName: "Handoff Time Calculator report request",
  });

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
