import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { redis, KEY } from "@/lib/redis";
import {
  buildLeadScoringModel,
  type LeadScoringInputs,
  type LeadScoringResults,
} from "@/lib/lead-scoring-logic";
import { sendLeadScoringReportEmail } from "@/lib/email-lead-scoring-report";
import { submitFreeToolLead } from "@/lib/hubspot-free-tools-form";

/**
 * POST /api/tools/lead-scoring-report
 *
 * Lead capture for /tools/lead-scoring-builder. Three side effects:
 *
 *   1. Redis write to dunamis:tools:lead-scoring:{hash} as source of
 *      truth. Failure here returns 500.
 *   2. HubSpot Forms mirror via the Free Tools form, with
 *      free_tool_used = "Lead Scoring Builder". Best-effort.
 *   3. Resend transactional email with the model. Best-effort.
 *
 * Server rebuilds the model from the same logic the client uses for
 * live preview, so the email and Redis row hold canonical values
 * regardless of any client-side tampering.
 */

const TOOL_SLUG = "lead-scoring";
const TOOL_DISPLAY_NAME = "Lead Scoring Builder";
const PUBLIC_PAGE_BASE = "https://www.dunamisstudios.net";

const InputsSchema: z.ZodType<LeadScoringInputs> = z.object({
  buyerRole: z.enum(["vp_c", "director_manager", "ic", "mixed"]),
  companySize: z.enum(["under_50", "50_250", "250_1000", "1000_plus"]),
  cycleLength: z.enum(["under_30", "30_90", "90_180", "180_plus"]),
  highIntentActions: z
    .array(
      z.enum([
        "pricing_visit",
        "demo_request",
        "contact_form",
        "free_trial",
        "content_download",
        "multi_page_session",
        "return_visit_7d",
      ]),
    )
    .max(7),
  disqualifiers: z
    .array(
      z.enum([
        "free_email",
        "role_mismatch",
        "size_mismatch",
        "competitor_domain",
        "geo_mismatch",
      ]),
    )
    .max(5),
  tier: z.enum(["pro", "enterprise"]),
});

const BodySchema = z.object({
  email: z.string().email().max(254),
  inputs: InputsSchema,
  hubspotutk: z.string().max(200).optional(),
});

interface ToolReportRecord {
  email: string;
  toolSlug: string;
  inputs: LeadScoringInputs;
  results: LeadScoringResults;
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
  const results = buildLeadScoringModel(inputs);
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
    console.error("[tools/lead-scoring] redis write failed", err);
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
    pageUri: `${PUBLIC_PAGE_BASE}/tools/lead-scoring-builder`,
    pageName: "Lead Scoring Builder report request",
  });

  try {
    await sendLeadScoringReportEmail({
      to: cleanEmail,
      inputs,
      results,
    });
  } catch (err) {
    console.error("[tools/lead-scoring] email send failed", err);
  }

  return NextResponse.json({ ok: true, results });
}
