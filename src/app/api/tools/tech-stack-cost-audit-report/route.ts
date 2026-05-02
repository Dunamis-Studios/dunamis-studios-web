import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { redis, KEY } from "@/lib/redis";
import {
  computeTechStackCostAudit,
  type TechStackCostAuditInputs,
  type TechStackCostAuditResults,
  type Tool,
} from "@/lib/tech-stack-cost-audit-logic";
import { sendTechStackCostAuditReportEmail } from "@/lib/email-tech-stack-cost-audit-report";
import { submitFreeToolLead } from "@/lib/hubspot-free-tools-form";

/**
 * POST /api/tools/tech-stack-cost-audit-report
 *
 * Lead capture for /tools/tech-stack-cost-audit. Same three-side-effect
 * shape as the other /tools routes:
 *
 *   1. Redis write to dunamis:tools:tech-stack-cost-audit:{hash} as
 *      source of truth. Failure here returns 500.
 *   2. HubSpot Forms mirror via the Free Tools form, with
 *      free_tool_used = "Tech Stack Cost Audit". Best-effort.
 *   3. Resend transactional email with the canonical analysis.
 *      Best-effort.
 *
 * Server recomputes from the same logic the client uses for live
 * preview, so the email and Redis row hold canonical numbers
 * regardless of any client-side tampering.
 */

const TOOL_SLUG = "tech-stack-cost-audit";
const TOOL_DISPLAY_NAME = "Tech Stack Cost Audit";
const PUBLIC_PAGE_BASE = "https://www.dunamisstudios.net";

const ToolSchema: z.ZodType<Tool> = z.object({
  id: z.string().max(64),
  name: z.string().max(120),
  category: z.enum([
    "crm",
    "marketing_automation",
    "sales_engagement",
    "email",
    "calendar",
    "meeting_tools",
    "call_recording",
    "sales_intelligence",
    "lead_scoring",
    "enrichment",
    "forms_surveys",
    "project_management",
    "communication",
    "analytics",
    "data_warehouse",
    "customer_success",
    "support",
    "documentation",
    "other",
  ]),
  costPerSeat: z.number().nonnegative().max(1_000_000),
  seats: z.number().int().nonnegative().max(1_000_000),
  usageLevel: z.enum(["daily", "weekly", "monthly", "rarely", "unknown"]),
});

const InputsSchema: z.ZodType<TechStackCostAuditInputs> = z.object({
  tools: z.array(ToolSchema).max(200),
  teamSize: z.number().int().positive().max(1_000_000),
  revenueRange: z.enum(["under_1m", "1_10m", "10_50m", "50m_plus"]),
});

const BodySchema = z.object({
  email: z.string().email().max(254),
  inputs: InputsSchema,
  hubspotutk: z.string().max(200).optional(),
});

interface ToolReportRecord {
  email: string;
  toolSlug: string;
  inputs: TechStackCostAuditInputs;
  results: TechStackCostAuditResults;
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

  const { email, inputs, hubspotutk } = parsed.data;
  const cleanEmail = email.trim();
  const results = computeTechStackCostAudit(inputs);
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
    console.error("[tools/tech-stack-cost-audit] redis write failed", err);
    return NextResponse.json(
      { error: "Could not record report. Please try again." },
      { status: 500 },
    );
  }

  await submitFreeToolLead({
    email: cleanEmail,
    toolName: TOOL_DISPLAY_NAME,
    hubspotutk,
    ipAddress: ipAddress !== "unknown" ? ipAddress : undefined,
    pageUri: `${PUBLIC_PAGE_BASE}/tools/tech-stack-cost-audit`,
    pageName: "Tech Stack Cost Audit report request",
  });

  try {
    await sendTechStackCostAuditReportEmail({
      to: cleanEmail,
      inputs,
      results,
    });
  } catch (err) {
    console.error("[tools/tech-stack-cost-audit] email send failed", err);
  }

  return NextResponse.json({ ok: true, results });
}
