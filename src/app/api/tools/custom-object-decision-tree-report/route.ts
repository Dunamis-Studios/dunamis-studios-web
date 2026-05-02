import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { redis, KEY } from "@/lib/redis";
import {
  evaluateTree,
  type DecisionTreeAnswers,
  type Recommendation,
} from "@/lib/custom-object-decision-tree-logic";
import { sendCustomObjectDecisionTreeReportEmail } from "@/lib/email-custom-object-decision-tree-report";
import { submitFreeToolLead } from "@/lib/hubspot-free-tools-form";

/**
 * POST /api/tools/custom-object-decision-tree-report
 *
 * Lead capture for /tools/custom-object-decision-tree. Same three-side
 * effect shape as the other /tools routes:
 *
 *   1. Redis write to dunamis:tools:custom-object-decision-tree:{hash}
 *      as source of truth. Failure here returns 500.
 *   2. HubSpot Forms mirror via the Free Tools form, with
 *      free_tool_used = "Custom Object Decision Tree". Best-effort.
 *   3. Resend transactional email with the canonical recommendation.
 *      Best-effort.
 *
 * Server re-runs the same traversal logic the client uses for live
 * preview. Rejects with 400 if the answers do not reach a terminal
 * recommendation, so the email and Redis row only ever store
 * complete decisions.
 */

const TOOL_SLUG = "custom-object-decision-tree";
const TOOL_DISPLAY_NAME = "Custom Object Decision Tree";
const PUBLIC_PAGE_BASE = "https://www.dunamisstudios.net";

const AnswersSchema: z.ZodType<DecisionTreeAnswers> = z.object({
  oneToOne: z.enum(["yes", "no"]).optional(),
  changesFrequently: z.enum(["yes", "no"]).optional(),
  referencedByMultiple: z.enum(["yes", "no"]).optional(),
  multipleInstances: z.enum(["yes", "no"]).optional(),
  ownProperties: z.enum(["yes", "no"]).optional(),
  eventsOrRecords: z.enum(["events", "records"]).optional(),
  standardObjectExists: z.enum(["yes", "no", "unsure"]).optional(),
  needReportsOrWorkflows: z.enum(["yes", "no"]).optional(),
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
  answers: DecisionTreeAnswers;
  recommendation: Recommendation;
  pathTag: string;
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

  const evaluation = evaluateTree(answers);
  if (evaluation.status !== "done") {
    return NextResponse.json(
      { error: "Answer all required questions before requesting the report." },
      { status: 400 },
    );
  }

  const ipAddress = clientIp(req);

  const record: ToolReportRecord = {
    email: cleanEmail,
    firstName: cleanFirstName,
    lastName: cleanLastName,
    toolSlug: TOOL_SLUG,
    answers,
    recommendation: evaluation.recommendation,
    pathTag: evaluation.recommendation.pathTag,
    submittedAt: new Date().toISOString(),
    ip: ipAddress,
    userAgent: req.headers.get("user-agent") ?? "unknown",
  };

  try {
    const r = redis();
    const key = KEY.toolReport(TOOL_SLUG, hashEmail(cleanEmail));
    await r.set(key, record);
  } catch (err) {
    console.error("[tools/custom-object-decision-tree] redis write failed", err);
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
    pageUri: `${PUBLIC_PAGE_BASE}/tools/custom-object-decision-tree`,
    pageName: "Custom Object Decision Tree report request",
  });

  try {
    await sendCustomObjectDecisionTreeReportEmail({
      to: cleanEmail,
      answers,
      path: evaluation.path,
      recommendation: evaluation.recommendation,
    });
  } catch (err) {
    console.error("[tools/custom-object-decision-tree] email send failed", err);
  }

  return NextResponse.json({
    ok: true,
    recommendation: evaluation.recommendation,
  });
}
