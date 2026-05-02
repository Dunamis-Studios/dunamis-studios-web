import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { redis, KEY } from "@/lib/redis";
import {
  scoreWorkflowAudit_,
  type WorkflowAuditAnswers,
  type WorkflowAuditResults,
} from "@/lib/workflow-audit-scoring";
import { sendWorkflowAuditReportEmail } from "@/lib/email-workflow-audit-report";
import { submitFreeToolLead } from "@/lib/hubspot-free-tools-form";

/**
 * POST /api/tools/workflow-audit-report
 *
 * Lead capture for /tools/workflow-audit-checklist. Same three-side-
 * effect shape as the other /tools routes:
 *
 *   1. Redis write to dunamis:tools:workflow-audit:{hash} as source
 *      of truth. Failure here returns 500.
 *   2. HubSpot Forms mirror via the Free Tools form, with
 *      free_tool_used = "Workflow Audit Checklist". Best-effort.
 *   3. Resend transactional email with the canonical score.
 *      Best-effort.
 *
 * Server recomputes from the same scoring lib the client uses for
 * live preview, so the email and Redis row hold canonical values
 * regardless of any client-side tampering.
 */

const TOOL_SLUG = "workflow-audit";
const TOOL_DISPLAY_NAME = "Workflow Audit Checklist";
const PUBLIC_PAGE_BASE = "https://www.dunamisstudios.net";

const AnswersSchema: z.ZodType<WorkflowAuditAnswers> = z.object({
  totalActiveWorkflows: z.number().int().nonnegative().max(100000),
  tier: z.enum([
    "marketing_pro",
    "marketing_enterprise",
    "ops_starter",
    "ops_pro",
    "ops_enterprise",
  ]),
  lastAudit: z.enum(["90_days", "1_year", "over_year", "never"]),
  namingConvention: z.enum(["yes", "partial", "no"]),
  ownersAssigned: z.enum(["yes", "partial", "no"]),
  descriptionsFilled: z.enum(["all", "most", "some", "none"]),
  duplicatePropertyWriters: z.enum(["no", "suspect", "yes", "many"]),
  archivedReferences: z.enum(["no", "suspect", "yes", "many"]),
  reenrollmentIntent: z.enum(["yes", "partial", "no", "unsure"]),
  recentIncidents: z.enum(["none", "once", "multiple"]),
});

const BodySchema = z.object({
  email: z.string().email().max(254),
  answers: AnswersSchema,
  hubspotutk: z.string().max(200).optional(),
});

interface ToolReportRecord {
  email: string;
  toolSlug: string;
  answers: WorkflowAuditAnswers;
  results: WorkflowAuditResults;
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

  const { email, answers, hubspotutk } = parsed.data;
  const cleanEmail = email.trim();
  const results = scoreWorkflowAudit_(answers);
  const ipAddress = clientIp(req);

  const record: ToolReportRecord = {
    email: cleanEmail,
    toolSlug: TOOL_SLUG,
    answers,
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
    console.error("[tools/workflow-audit] redis write failed", err);
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
    pageUri: `${PUBLIC_PAGE_BASE}/tools/workflow-audit-checklist`,
    pageName: "Workflow Audit Checklist report request",
  });

  try {
    await sendWorkflowAuditReportEmail({
      to: cleanEmail,
      answers,
      results,
    });
  } catch (err) {
    console.error("[tools/workflow-audit] email send failed", err);
  }

  return NextResponse.json({ ok: true, results });
}
