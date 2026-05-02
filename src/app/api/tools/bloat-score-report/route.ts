import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { redis, KEY } from "@/lib/redis";
import {
  scoreBloat_,
  type BloatInputs,
  type BloatResults,
} from "@/lib/bloat-score-scoring";
import { sendBloatScoreReportEmail } from "@/lib/email-bloat-score-report";
import { submitFreeToolLead } from "@/lib/hubspot-free-tools-form";

/**
 * POST /api/tools/bloat-score-report
 *
 * Lead capture for /tools/hubspot-bloat-score. The frontend submits
 * the visitor's email plus the eight inputs. Three side effects:
 *
 *   1. Redis write to dunamis:tools:bloat-score:{hash} as source of
 *      truth. Failure here returns 500.
 *   2. HubSpot Forms mirror via the Free Tools form, with
 *      free_tool_used = "HubSpot Bloat Score". Best-effort.
 *   3. Resend transactional email with the score and breakdown.
 *      Best-effort.
 *
 * Server recomputes the score from the same scoring lib the client
 * uses for live preview, so the email and Redis row hold canonical
 * values regardless of any client-side tampering.
 */

const TOOL_SLUG = "bloat-score";
const TOOL_DISPLAY_NAME = "HubSpot Bloat Score";
const PUBLIC_PAGE_BASE = "https://www.dunamisstudios.net";

const InputsSchema: z.ZodType<BloatInputs> = z.object({
  contactProperties: z.number().int().min(0).max(100000),
  companyProperties: z.number().int().min(0).max(100000),
  dealProperties: z.number().int().min(0).max(100000),
  activeWorkflows: z.number().int().min(0).max(100000),
  activeLists: z.number().int().min(0).max(100000),
  totalContacts: z.number().int().min(0).max(100000000),
  portalAge: z.enum(["under_1", "1_3", "3_5", "5_plus"]),
  tier: z.enum(["free", "starter", "pro", "enterprise"]),
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
  inputs: BloatInputs;
  results: BloatResults;
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
  const results = scoreBloat_(inputs);
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
    console.error("[tools/bloat-score] redis write failed", err);
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
    pageUri: `${PUBLIC_PAGE_BASE}/tools/hubspot-bloat-score`,
    pageName: "HubSpot Bloat Score report request",
  });

  try {
    await sendBloatScoreReportEmail({
      to: cleanEmail,
      inputs,
      results,
    });
  } catch (err) {
    console.error("[tools/bloat-score] email send failed", err);
  }

  return NextResponse.json({ ok: true, results });
}
