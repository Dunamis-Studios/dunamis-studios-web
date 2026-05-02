import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { redis, KEY } from "@/lib/redis";
import {
  scoreAudit_,
  type AuditAnswers,
  type AuditResults,
} from "@/lib/property-audit-scoring";
import { sendPropertyAuditReportEmail } from "@/lib/email-property-audit-report";
import { submitFreeToolLead } from "@/lib/hubspot-free-tools-form";

/**
 * POST /api/tools/property-audit-report
 *
 * Lead capture for the /tools/property-audit-checklist surface. The
 * frontend submits the visitor's email plus the ten answers. Three
 * side effects, in order:
 *
 *   1. Redis write to dunamis:tools:property-audit:{hash} as source
 *      of truth. If this fails, the request fails with 500.
 *   2. HubSpot Forms mirror via the dedicated "Free Tools - Lead
 *      Capture" form (HUBSPOT_FREE_TOOLS_FORM_GUID), with
 *      free_tool_used = "Property Audit Checklist". Best-effort.
 *   3. Resend transactional email delivering the score, tier, and
 *      top 3 actions to the visitor. Best-effort.
 *
 * The server recomputes the score from the same scoring lib the
 * client uses for live preview, so the email and the Redis row hold
 * canonical values regardless of any client-side tampering.
 */

const TOOL_SLUG = "property-audit";
const TOOL_DISPLAY_NAME = "Property Audit Checklist";
const PUBLIC_PAGE_BASE = "https://www.dunamisstudios.net";

const AnswersSchema: z.ZodType<AuditAnswers> = z.object({
  customPropertyCount: z.number().int().min(0).max(100000),
  portalAge: z.enum(["under_1", "1_3", "3_5", "5_plus"]),
  namingConvention: z.enum(["yes", "partial", "no"]),
  descriptionsFilled: z.enum(["all", "most", "some", "none"]),
  lastAudit: z.enum(["90_days", "1_year", "over_year", "never"]),
  lowFillRateCount: z.enum(["dont_know", "under_10", "10_50", "50_plus"]),
  duplicates: z.enum(["no", "suspect", "yes", "many"]),
  ownersAssigned: z.enum(["yes", "partial", "no"]),
  reviewCadence: z.enum(["never", "rarely", "often", "no_process"]),
  pastIncidents: z.enum(["no", "once", "multiple"]),
});

const BodySchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email().max(254),
  answers: AnswersSchema,
  hubspotutk: z.string().max(200).optional(),
});

interface ToolReportRecord {
  email: string;
  firstName: string;
  lastName: string;
  toolSlug: string;
  answers: AuditAnswers;
  results: AuditResults;
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
      { error: "Please check your answers and try again." },
      { status: 400 },
    );
  }

  const { firstName, lastName, email, answers, hubspotutk } = parsed.data;
  const cleanEmail = email.trim();
  const cleanFirstName = firstName.trim();
  const cleanLastName = lastName.trim();
  if (!cleanFirstName || !cleanLastName) {
    return NextResponse.json(
      { error: "Please check your inputs and try again." },
      { status: 400 },
    );
  }
  const results = scoreAudit_(answers);
  const ipAddress = clientIp(req);

  const record: ToolReportRecord = {
    email: cleanEmail,
    firstName: cleanFirstName,
    lastName: cleanLastName,
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
    console.error("[tools/property-audit] redis write failed", err);
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
    pageUri: `${PUBLIC_PAGE_BASE}/tools/property-audit-checklist`,
    pageName: "Property Audit Checklist report request",
  });

  try {
    await sendPropertyAuditReportEmail({
      to: cleanEmail,
      answers,
      results,
    });
  } catch (err) {
    console.error("[tools/property-audit] email send failed", err);
  }

  return NextResponse.json({ ok: true, results });
}
