import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { redis, KEY } from "@/lib/redis";
import {
  scoreOnboarding,
  type OnboardingAnswers,
  type OnboardingResults,
} from "@/lib/team-onboarding-checklist-logic";
import { sendTeamOnboardingChecklistEmail } from "@/lib/email-team-onboarding-checklist-report";
import { submitFreeToolLead } from "@/lib/hubspot-free-tools-form";

/**
 * POST /api/tools/team-onboarding-checklist-report
 *
 * Lead capture for /tools/hubspot-team-onboarding-checklist. Same
 * three-side-effect shape as the other /tools routes:
 *
 *   1. Redis write to dunamis:tools:team-onboarding-checklist:{hash}
 *      as source of truth. Failure here returns 500.
 *   2. HubSpot Forms mirror via the Free Tools form, with
 *      free_tool_used = "HubSpot Team Member Onboarding Checklist".
 *      Best-effort.
 *   3. Resend transactional email with the canonical score.
 *      Best-effort.
 *
 * Server recomputes from the same scoring lib the client uses for
 * live preview, so the email and Redis row hold canonical values
 * regardless of any client-side tampering.
 */

const TOOL_SLUG = "team-onboarding-checklist";
const TOOL_DISPLAY_NAME = "HubSpot Team Member Onboarding Checklist";
const PUBLIC_PAGE_BASE = "https://www.dunamisstudios.net";

const TriState = z.enum(["yes", "partial", "no"]);

const AnswersSchema: z.ZodType<OnboardingAnswers> = z.object({
  role: z.enum([
    "sdr_bdr",
    "ae",
    "marketing_ops",
    "cs_am",
    "revops_admin",
  ]),

  // Phase 1
  seatType: z.enum(["yes", "not_sure", "no"]),
  permissionSet: z.enum(["yes", "individual", "no"]),
  propertyPermissions: z.enum(["yes", "no", "unsure"]),
  teamAssignment: z.enum(["yes", "na", "no"]),
  emailConnected: z.enum(["yes", "no"]),
  calendarConnected: z.enum(["yes", "no"]),
  notificationPrefs: z.enum(["yes", "defaults", "no"]),

  // Phase 2
  lifecycleVsLeadStatus: TriState,
  portalLifecycleStages: TriState,
  dealStagesPipelines: TriState,
  requiredPropertiesAtStages: TriState,
  autoProgressionRules: z.enum(["yes", "no", "unsure"]),

  // Phase 3 (all optional; per-role check below)
  leadStatusValues: TriState.optional(),
  disqualReasons: TriState.optional(),
  leadsObject: TriState.optional(),
  leadToDealConversion: TriState.optional(),
  meetingHandoff: TriState.optional(),
  dealStageProgression: TriState.optional(),
  requiredDealProperties: TriState.optional(),
  buyingRoles: TriState.optional(),
  lossReasons: TriState.optional(),
  associationRules: TriState.optional(),
  lifecycleAutomation: TriState.optional(),
  leadScoringFields: TriState.optional(),
  sourceAttribution: TriState.optional(),
  campaignMembership: TriState.optional(),
  subscriptionPrefs: TriState.optional(),
  customerHealthScore: TriState.optional(),
  renewalExpansion: TriState.optional(),
  churnRiskIndicators: TriState.optional(),
  npsCsat: TriState.optional(),
  escalationPaths: TriState.optional(),
  crossFunctionalKnowledge: TriState.optional(),
  workflowAuditCadence: TriState.optional(),
  propertyCreationGovernance: TriState.optional(),
  permissionSetManagement: TriState.optional(),
  dataModelSchema: TriState.optional(),

  // Phase 4
  meetingLinks: z.enum(["yes", "partial", "no", "na"]),
  templatesSnippets: z.enum(["yes", "no", "na"]),
  sequences: z.enum(["yes", "partial", "no", "na"]),
  tasksQueues: z.enum(["yes", "no", "na"]),
  salesWorkspace: z.enum(["yes", "no", "na"]),

  // Phase 5
  activityLogging: z.enum(["yes", "verbal", "no"]),
  associationRulesClear: z.enum(["yes", "no"]),
  thingsToWatchOut: z.enum(["yes", "no"]),

  // Phase 6
  linkedin: z.enum(["yes", "not_applicable", "not_yet"]),
  slackTeams: z.enum(["yes", "not_applicable", "not_yet"]),
  phoneDialer: z.enum(["yes", "not_applicable", "not_yet"]),

  // Phase 7
  dashboards: z.enum(["yes", "no"]),
  savedViews: z.enum(["yes", "no"]),
  goals: z.enum(["yes", "not_applicable", "no"]),

  // Phase 8
  dailyActive: z.enum(["yes", "mostly", "no"]),
  activitiesLogging: TriState,
  firstDealLead: z.enum(["yes", "not_applicable", "no"]),
});

const BodySchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email().max(254),
  answers: AnswersSchema,
  hubspotutk: z.string().max(200).optional(),
});

const ROLE_REQUIRED_FIELDS: Record<
  OnboardingAnswers["role"],
  Array<keyof OnboardingAnswers>
> = {
  sdr_bdr: [
    "leadStatusValues",
    "disqualReasons",
    "leadsObject",
    "leadToDealConversion",
    "meetingHandoff",
  ],
  ae: [
    "dealStageProgression",
    "requiredDealProperties",
    "buyingRoles",
    "lossReasons",
    "associationRules",
  ],
  marketing_ops: [
    "lifecycleAutomation",
    "leadScoringFields",
    "sourceAttribution",
    "campaignMembership",
    "subscriptionPrefs",
  ],
  cs_am: [
    "customerHealthScore",
    "renewalExpansion",
    "churnRiskIndicators",
    "npsCsat",
    "escalationPaths",
  ],
  revops_admin: [
    "crossFunctionalKnowledge",
    "workflowAuditCadence",
    "propertyCreationGovernance",
    "permissionSetManagement",
    "dataModelSchema",
  ],
};

interface ToolReportRecord {
  email: string;
  firstName: string;
  lastName: string;
  toolSlug: string;
  answers: OnboardingAnswers;
  results: OnboardingResults;
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

  // Per-role required-field validation
  const required = ROLE_REQUIRED_FIELDS[answers.role];
  for (const field of required) {
    if (answers[field] === undefined) {
      return NextResponse.json(
        {
          error:
            "Answer all role-specific questions before requesting the report.",
        },
        { status: 400 },
      );
    }
  }

  const cleanEmail = email.trim();
  const cleanFirstName = firstName.trim();
  const cleanLastName = lastName.trim();
  if (!cleanFirstName || !cleanLastName) {
    return NextResponse.json(
      { error: "Please check your inputs and try again." },
      { status: 400 },
    );
  }
  const results = scoreOnboarding(answers);
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
    console.error(
      "[tools/team-onboarding-checklist] redis write failed",
      err,
    );
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
    pageUri: `${PUBLIC_PAGE_BASE}/tools/hubspot-team-onboarding-checklist`,
    pageName: "HubSpot Team Member Onboarding Checklist report request",
  });

  try {
    await sendTeamOnboardingChecklistEmail({
      to: cleanEmail,
      answers,
      results,
    });
  } catch (err) {
    console.error(
      "[tools/team-onboarding-checklist] email send failed",
      err,
    );
  }

  return NextResponse.json({ ok: true, results });
}
