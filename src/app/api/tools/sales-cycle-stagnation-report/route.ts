import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { redis, KEY } from "@/lib/redis";
import {
  computeSalesCycleStagnation,
  type SalesCycleStagnationInputs,
  type SalesCycleStagnationResults,
} from "@/lib/sales-cycle-stagnation-logic";
import { sendSalesCycleStagnationReportEmail } from "@/lib/email-sales-cycle-stagnation-report";
import { submitFreeToolLead } from "@/lib/hubspot-free-tools-form";

/**
 * POST /api/tools/sales-cycle-stagnation-report
 *
 * Lead capture for /tools/sales-cycle-stagnation-calculator. Same
 * three-side-effect shape as the other /tools routes:
 *
 *   1. Redis write to dunamis:tools:stagnation-calculator:{hash} as
 *      source of truth. Failure here returns 500.
 *   2. HubSpot Forms mirror via the Free Tools form, with
 *      free_tool_used = "Sales Cycle Stagnation Calculator". Best-effort.
 *   3. Resend transactional email with the canonical analysis.
 *      Best-effort.
 *
 * Server recomputes from the same logic the client uses for live
 * preview, so the email and Redis row hold canonical numbers
 * regardless of any client-side tampering.
 */

const TOOL_SLUG = "stagnation-calculator";
const TOOL_DISPLAY_NAME = "Sales Cycle Stagnation Calculator";
const PUBLIC_PAGE_BASE = "https://www.dunamisstudios.net";

const InputsSchema: z.ZodType<SalesCycleStagnationInputs> = z.object({
  avgDealSize: z.number().nonnegative().max(100_000_000),
  avgCycleLength: z.number().int().positive().max(3650),
  numStages: z.number().int().positive().max(50),
  activeDeals: z.number().int().nonnegative().max(1_000_000),
  totalPipelineValueOverride: z
    .number()
    .nonnegative()
    .max(1_000_000_000_000)
    .nullable(),
  winRatePct: z.number().min(0).max(100),
  avgStageTimeOverride: z.number().positive().max(3650).nullable(),
  dealsAtRisk: z.number().int().nonnegative().max(1_000_000),
  dealsCritical: z.number().int().nonnegative().max(1_000_000),
});

const BodySchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email().max(254),
  inputs: InputsSchema,
  hubspotutk: z.string().max(200).optional(),
});

interface ToolReportRecord {
  email: string;
  firstName: string;
  lastName: string;
  toolSlug: string;
  inputs: SalesCycleStagnationInputs;
  results: SalesCycleStagnationResults;
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

  const { firstName, lastName, email, inputs, hubspotutk } = parsed.data;
  const cleanEmail = email.trim();
  const cleanFirstName = firstName.trim();
  const cleanLastName = lastName.trim();
  if (!cleanFirstName || !cleanLastName) {
    return NextResponse.json(
      { error: "Please check your inputs and try again." },
      { status: 400 },
    );
  }
  const results = computeSalesCycleStagnation(inputs);
  const ipAddress = clientIp(req);

  const record: ToolReportRecord = {
    email: cleanEmail,
    firstName: cleanFirstName,
    lastName: cleanLastName,
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
    console.error("[tools/stagnation] redis write failed", err);
    return NextResponse.json(
      { error: "Could not record report. Please try again." },
      { status: 500 },
    );
  }

  await submitFreeToolLead({
    email: cleanEmail,
    firstName: cleanFirstName,
    lastName: cleanLastName,
    toolName: TOOL_DISPLAY_NAME,
    hubspotutk,
    ipAddress: ipAddress !== "unknown" ? ipAddress : undefined,
    pageUri: `${PUBLIC_PAGE_BASE}/tools/sales-cycle-stagnation-calculator`,
    pageName: "Sales Cycle Stagnation Calculator report request",
  });

  try {
    await sendSalesCycleStagnationReportEmail({
      to: cleanEmail,
      inputs,
      results,
    });
  } catch (err) {
    console.error("[tools/stagnation] email send failed", err);
  }

  return NextResponse.json({ ok: true, results });
}
