"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LeadNameFields,
  RequiredMark,
} from "@/components/marketing/lead-form-fields";
import { cn } from "@/lib/utils";
import {
  ROLE_LABELS,
  scoreOnboarding,
  type OnboardingAnswers,
  type OnboardingResults,
  type PhaseScore,
  type Role,
  type Tier,
} from "@/lib/team-onboarding-checklist-logic";

/**
 * Free Tools / HubSpot Team Member Onboarding Checklist.
 *
 * Role-aware checklist scoring readiness for a new HubSpot team
 * member. Eight phases. Phase 3 swaps its question set based on the
 * selected role; the other phases share items across roles. Mirrored
 * on the server via the same scoring lib so the email and Redis row
 * hold canonical values.
 */

type PartialAnswers = {
  [K in keyof OnboardingAnswers]?: OnboardingAnswers[K];
};

const ROLES: { value: Role; label: string }[] = [
  { value: "sdr_bdr", label: "SDR / BDR" },
  { value: "ae", label: "Account Executive" },
  { value: "marketing_ops", label: "Marketing Ops" },
  { value: "cs_am", label: "CS / Account Manager" },
  { value: "revops_admin", label: "RevOps Admin" },
];

const ROLE_PHASE_FIELDS: Record<Role, Array<keyof OnboardingAnswers>> = {
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

const COMMON_REQUIRED_FIELDS: Array<keyof OnboardingAnswers> = [
  "seatType",
  "permissionSet",
  "propertyPermissions",
  "teamAssignment",
  "emailConnected",
  "calendarConnected",
  "notificationPrefs",
  "lifecycleVsLeadStatus",
  "portalLifecycleStages",
  "dealStagesPipelines",
  "requiredPropertiesAtStages",
  "autoProgressionRules",
  "meetingLinks",
  "templatesSnippets",
  "sequences",
  "tasksQueues",
  "salesWorkspace",
  "activityLogging",
  "associationRulesClear",
  "thingsToWatchOut",
  "linkedin",
  "slackTeams",
  "phoneDialer",
  "dashboards",
  "savedViews",
  "goals",
  "dailyActive",
  "activitiesLogging",
  "firstDealLead",
];

function isComplete(p: PartialAnswers): p is OnboardingAnswers {
  if (!p.role) return false;
  for (const f of COMMON_REQUIRED_FIELDS) {
    if (p[f] === undefined) return false;
  }
  for (const f of ROLE_PHASE_FIELDS[p.role]) {
    if (p[f] === undefined) return false;
  }
  return true;
}

function readHubspotUtk(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function TeamOnboardingChecklist() {
  const [answers, setAnswers] = React.useState<PartialAnswers>({});

  const results = React.useMemo<OnboardingResults | null>(() => {
    if (!isComplete(answers)) return null;
    return scoreOnboarding(answers);
  }, [answers]);

  const totalRequired = answers.role
    ? COMMON_REQUIRED_FIELDS.length + ROLE_PHASE_FIELDS[answers.role].length
    : COMMON_REQUIRED_FIELDS.length + 5;

  const answeredCount = React.useMemo(() => {
    let n = 0;
    if (answers.role) n += 1;
    for (const f of COMMON_REQUIRED_FIELDS) {
      if (answers[f] !== undefined) n += 1;
    }
    if (answers.role) {
      for (const f of ROLE_PHASE_FIELDS[answers.role]) {
        if (answers[f] !== undefined) n += 1;
      }
    }
    return n;
  }, [answers]);

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <Questions answers={answers} setAnswers={setAnswers} />
      </div>
      <div className="lg:col-span-2 flex flex-col gap-6 lg:sticky lg:top-24 lg:h-fit">
        <ResultsPanel
          results={results}
          answeredCount={answeredCount}
          totalRequired={totalRequired + 1}
          role={answers.role}
        />
        <Methodology />
        <p className="text-xs leading-relaxed text-[var(--fg-subtle)]">
          Benchmarks come from HubSpot&apos;s Knowledge Base, HubSpot
          Community, Hublead, LeadCRM, Default.com, and OnTheFuze 2026,
          all detailed in &quot;Where the benchmarks come from&quot; above.
        </p>
        <EmailCapture answers={answers} disabled={!isComplete(answers)} />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- questions

function Questions({
  answers,
  setAnswers,
}: {
  answers: PartialAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<PartialAnswers>>;
}) {
  const set = <K extends keyof OnboardingAnswers>(
    key: K,
    value: OnboardingAnswers[K],
  ) => {
    setAnswers((prev) => {
      // Changing role should clear any previously-answered role-specific
      // fields so the report only contains answers for the current role.
      if (key === "role" && prev.role && prev.role !== value) {
        const cleared: PartialAnswers = { ...prev };
        for (const f of ROLE_PHASE_FIELDS[prev.role as Role]) {
          delete cleared[f];
        }
        return { ...cleared, [key]: value };
      }
      return { ...prev, [key]: value };
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <RoleSelector role={answers.role} onChange={(r) => set("role", r)} />

      {answers.role ? (
        <>
          <PhaseCard
            number={1}
            title="Access & Permissions"
            description="Foundation. Wrong seat or missing permissions and the rep is blocked from day one."
          >
            <RadioQuestion
              number={1}
              id="onb-q1"
              question="Seat type assigned correctly for role"
              hint="Core, Sales, and Service seats expose different feature sets and bill differently."
              value={answers.seatType ?? null}
              onChange={(v) => set("seatType", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "not_sure", label: "Not sure" },
                { value: "no", label: "No" },
              ]}
            />
            <RadioQuestion
              number={2}
              id="onb-q2"
              question="Permission set assigned matching role"
              hint="Permission sets enforce consistent access; individual permissions drift and become unauditable."
              value={answers.permissionSet ?? null}
              onChange={(v) => set("permissionSet", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "individual", label: "Using individual permissions" },
                { value: "no", label: "No" },
              ]}
            />
            <RadioQuestion
              number={3}
              id="onb-q3"
              question="Property-level edit permissions configured"
              hint="Lifecycle Stage usually locked to ops; Deal Probability locked to managers."
              value={answers.propertyPermissions ?? null}
              onChange={(v) => set("propertyPermissions", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "unsure", label: "Unsure" },
              ]}
            />
            <RadioQuestion
              number={4}
              id="onb-q4"
              question="Team assignment configured"
              value={answers.teamAssignment ?? null}
              onChange={(v) => set("teamAssignment", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "na", label: "N/A" },
                { value: "no", label: "No" },
              ]}
            />
            <RadioQuestion
              number={5}
              id="onb-q5"
              question="Email connected"
              value={answers.emailConnected ?? null}
              onChange={(v) => set("emailConnected", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
            />
            <RadioQuestion
              number={6}
              id="onb-q6"
              question="Calendar connected"
              value={answers.calendarConnected ?? null}
              onChange={(v) => set("calendarConnected", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
            />
            <RadioQuestion
              number={7}
              id="onb-q7"
              question="Notification preferences set"
              value={answers.notificationPrefs ?? null}
              onChange={(v) => set("notificationPrefs", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "defaults", label: "Using defaults" },
                { value: "no", label: "No" },
              ]}
            />
          </PhaseCard>

          <PhaseCard
            number={2}
            title="Core Concepts Training"
            description="The shared mental model. Skip and the rep will overwrite values that workflows are responsible for."
          >
            <RadioQuestion
              number={8}
              id="onb-q8"
              question="Trained on Lifecycle Stage vs Lead Status difference"
              hint="Lifecycle Stage = where the contact is in the overall journey (Subscriber, Lead, MQL, SQL, Opportunity, Customer). Lead Status = sub-detail within MQL/SQL showing what's happening right now (New, In Progress, Connected). Lifecycle Stage rarely edited manually; Lead Status updated after every touchpoint."
              value={answers.lifecycleVsLeadStatus ?? null}
              onChange={(v) => set("lifecycleVsLeadStatus", v)}
              options={triStateOptions}
            />
            <RadioQuestion
              number={9}
              id="onb-q9"
              question="Trained on this portal's specific Lifecycle Stages and what each means"
              hint="HubSpot lifecycle stages are fully customizable. Every portal configures them differently. Your reps need to know YOUR stages, not the defaults."
              value={answers.portalLifecycleStages ?? null}
              onChange={(v) => set("portalLifecycleStages", v)}
              options={triStateOptions}
            />
            <RadioQuestion
              number={10}
              id="onb-q10"
              question="Trained on Deal Stages and pipelines used"
              hint="Deal Stages are sub-detail of the Opportunity lifecycle stage. Pipelines = sales process. Multiple pipelines only when fundamentally different processes."
              value={answers.dealStagesPipelines ?? null}
              onChange={(v) => set("dealStagesPipelines", v)}
              options={triStateOptions}
            />
            <RadioQuestion
              number={11}
              id="onb-q11"
              question="Trained on which properties are required at which deal stages"
              hint="Pipeline stage rules can require specific properties before a deal advances. New reps need this list, not tribal knowledge."
              value={answers.requiredPropertiesAtStages ?? null}
              onChange={(v) => set("requiredPropertiesAtStages", v)}
              options={triStateOptions}
            />
            <RadioQuestion
              number={12}
              id="onb-q12"
              question="Trained on auto-progression rules in this portal"
              hint="This portal may auto-set Lifecycle Stage when a contact is created, a deal is created, or a deal closes won. Reps should know what's automatic vs manual."
              value={answers.autoProgressionRules ?? null}
              onChange={(v) => set("autoProgressionRules", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "unsure", label: "Unsure" },
              ]}
            />
          </PhaseCard>

          <RolePhase role={answers.role} answers={answers} set={set} />

          <PhaseCard
            number={4}
            title="Tool Enablement"
            description="The daily-use surface. Sales-facing roles ramp faster when these are in place from day one."
          >
            <RadioQuestion
              number={18}
              id="onb-q18"
              question="Meeting links created and tested"
              value={answers.meetingLinks ?? null}
              onChange={(v) => set("meetingLinks", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "partial", label: "Partial" },
                { value: "no", label: "No" },
                { value: "na", label: "N/A" },
              ]}
            />
            <RadioQuestion
              number={19}
              id="onb-q19"
              question="Templates and snippets library access shown"
              value={answers.templatesSnippets ?? null}
              onChange={(v) => set("templatesSnippets", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "na", label: "N/A" },
              ]}
            />
            <RadioQuestion
              number={20}
              id="onb-q20"
              question="Sequences trained and at least one enrolled"
              hint="Per Hublead, sequences are 'the single most powerful sales tool in HubSpot.'"
              value={answers.sequences ?? null}
              onChange={(v) => set("sequences", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "partial", label: "Partial" },
                { value: "no", label: "No" },
                { value: "na", label: "N/A" },
              ]}
            />
            <RadioQuestion
              number={21}
              id="onb-q21"
              question="Tasks and task queues setup"
              value={answers.tasksQueues ?? null}
              onChange={(v) => set("tasksQueues", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "na", label: "N/A" },
              ]}
            />
            <RadioQuestion
              number={22}
              id="onb-q22"
              question="Sales Workspace walkthrough completed"
              value={answers.salesWorkspace ?? null}
              onChange={(v) => set("salesWorkspace", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "na", label: "N/A" },
              ]}
            />
          </PhaseCard>

          <PhaseCard
            number={5}
            title="Process Discipline"
            description="Common rep mistakes (manually advancing Lifecycle Stage, creating deals before qualification, logging to wrong record) prevent themselves only when these standards are documented."
          >
            <RadioQuestion
              number={23}
              id="onb-q23"
              question="Required activity logging standards documented"
              value={answers.activityLogging ?? null}
              onChange={(v) => set("activityLogging", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "verbal", label: "Verbal only" },
                { value: "no", label: "No" },
              ]}
            />
            <RadioQuestion
              number={24}
              id="onb-q24-assoc"
              question="Association rules clear: contact, company, deal must all be linked"
              value={answers.associationRulesClear ?? null}
              onChange={(v) => set("associationRulesClear", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
            />
            <RadioQuestion
              number={25}
              id="onb-q25-watch"
              question="Things-to-watch-out walkthrough completed"
              hint="Manually advancing Lifecycle Stage when a workflow should handle it, creating deals before SDR qualification, setting buying roles as contact properties (gets overwritten next deal), logging activities to the wrong record, treating Lead Status and Lifecycle Stage as the same field."
              value={answers.thingsToWatchOut ?? null}
              onChange={(v) => set("thingsToWatchOut", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
            />
          </PhaseCard>

          <PhaseCard
            number={6}
            title="Integrations"
            description="Role-aware. 'Not applicable' is excluded from the score; 'not yet' counts as missing."
          >
            <RadioQuestion
              number={26}
              id="onb-q26"
              question="LinkedIn integration installed if applicable"
              value={answers.linkedin ?? null}
              onChange={(v) => set("linkedin", v)}
              options={integrationOptions}
            />
            <RadioQuestion
              number={27}
              id="onb-q27-slack"
              question="Slack or Teams notifications configured"
              value={answers.slackTeams ?? null}
              onChange={(v) => set("slackTeams", v)}
              options={integrationOptions}
            />
            <RadioQuestion
              number={28}
              id="onb-q28"
              question="Phone or dialer integration installed"
              value={answers.phoneDialer ?? null}
              onChange={(v) => set("phoneDialer", v)}
              options={integrationOptions}
            />
          </PhaseCard>

          <PhaseCard
            number={7}
            title="Reporting & Goals"
            description="The rep's daily KPI surface. If they don't know what they'll be measured on, they default to inbox guilt."
          >
            <RadioQuestion
              number={29}
              id="onb-q29"
              question="Default dashboards reviewed"
              value={answers.dashboards ?? null}
              onChange={(v) => set("dashboards", v)}
              options={yesNoOptions}
            />
            <RadioQuestion
              number={30}
              id="onb-q30"
              question="Daily-use saved views created"
              value={answers.savedViews ?? null}
              onChange={(v) => set("savedViews", v)}
              options={yesNoOptions}
            />
            <RadioQuestion
              number={31}
              id="onb-q31"
              question="Goals assigned in HubSpot"
              value={answers.goals ?? null}
              onChange={(v) => set("goals", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "not_applicable", label: "Not applicable" },
                { value: "no", label: "No" },
              ]}
            />
          </PhaseCard>

          <PhaseCard
            number={8}
            title="Adoption Check (Day 30)"
            description="Per Hublead, the three core adoption metrics. Missing here trumps everything else above."
          >
            <RadioQuestion
              number={32}
              id="onb-q32"
              question="Daily active in HubSpot for past 7 days"
              value={answers.dailyActive ?? null}
              onChange={(v) => set("dailyActive", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "mostly", label: "Mostly" },
                { value: "no", label: "No" },
              ]}
            />
            <RadioQuestion
              number={33}
              id="onb-q33"
              question="Activities being logged consistently"
              value={answers.activitiesLogging ?? null}
              onChange={(v) => set("activitiesLogging", v)}
              options={triStateOptions}
            />
            <RadioQuestion
              number={34}
              id="onb-q34"
              question="First deal or lead worked end-to-end"
              value={answers.firstDealLead ?? null}
              onChange={(v) => set("firstDealLead", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "not_applicable", label: "Not applicable" },
                { value: "no", label: "No" },
              ]}
            />
          </PhaseCard>
        </>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-sm text-[var(--fg-muted)]">
          Pick the rep&apos;s role above to load the rest of the checklist.
          The role determines which property-knowledge questions appear in
          phase 3.
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------- role-specific phase

function RolePhase({
  role,
  answers,
  set,
}: {
  role: Role;
  answers: PartialAnswers;
  set: <K extends keyof OnboardingAnswers>(
    key: K,
    value: OnboardingAnswers[K],
  ) => void;
}) {
  const description = ROLE_PHASE_DESCRIPTIONS[role];

  return (
    <PhaseCard
      number={3}
      title={`Role-Specific Property Knowledge: ${ROLE_LABELS[role]}`}
      description={description}
    >
      {ROLE_PHASE_QUESTIONS[role].map((q) => (
        <RadioQuestion
          key={q.id}
          number={q.number}
          id={`onb-r-${q.id}`}
          question={q.question}
          hint={q.hint}
          value={(answers[q.id] as "yes" | "partial" | "no" | undefined) ?? null}
          onChange={(v) =>
            set(q.id, v as OnboardingAnswers[typeof q.id])
          }
          options={triStateOptions}
        />
      ))}
    </PhaseCard>
  );
}

interface RoleQuestionDef {
  id: keyof OnboardingAnswers;
  number: number;
  question: string;
  hint?: string;
}

const ROLE_PHASE_DESCRIPTIONS: Record<Role, string> = {
  sdr_bdr:
    "SDR / BDR property territory. Lead Status, disqualification, the Leads object, conversion criteria, and meeting handoff are the daily tools.",
  ae:
    "Account Executive property territory. Buying Roles via association labels (not contact properties) is the highest-impact item; missing it produces stale data on every deal.",
  marketing_ops:
    "Marketing Ops property territory. Lifecycle automation, source attribution, and subscription flows are the failure surfaces.",
  cs_am:
    "CS / Account Manager property territory. Health score, renewal, churn risk, and survey workflows are the daily triage signals.",
  revops_admin:
    "RevOps Admin scope. Cross-functional knowledge plus governance over workflows, properties, permissions, and the data model itself.",
};

const ROLE_PHASE_QUESTIONS: Record<Role, RoleQuestionDef[]> = {
  sdr_bdr: [
    {
      id: "leadStatusValues",
      number: 13,
      question:
        "Trained on Lead Status values used (New, In Progress, Attempted to Contact, Connected, etc.) and when to use each",
    },
    {
      id: "disqualReasons",
      number: 14,
      question: "Trained on disqualification reasons and where to log them",
    },
    {
      id: "leadsObject",
      number: 15,
      question:
        "Trained on the Leads object (separate from contacts and deals) for pre-qualification work",
    },
    {
      id: "leadToDealConversion",
      number: 16,
      question: "Trained on when to convert a Lead to a Deal (criteria, threshold)",
    },
    {
      id: "meetingHandoff",
      number: 17,
      question:
        "Trained on meeting handoff fields and notes for AE handoff",
    },
  ],
  ae: [
    {
      id: "dealStageProgression",
      number: 13,
      question: "Trained on Deal Stage progression criteria",
    },
    {
      id: "requiredDealProperties",
      number: 14,
      question:
        "Trained on required deal properties (Amount, Close Date, Probability, MRR / ACV / Contract Term if SaaS)",
    },
    {
      id: "buyingRoles",
      number: 15,
      question:
        "Trained on Buying Roles via association labels (Decision Maker, Champion, Influencer, etc.)",
      hint: "Critical: these are association labels per deal, NOT contact properties. Setting them as contact properties guarantees stale data on every deal.",
    },
    {
      id: "lossReasons",
      number: 16,
      question: "Trained on Loss Reasons taxonomy",
    },
    {
      id: "associationRules",
      number: 17,
      question:
        "Trained on association rules: contact, company, and deal must all be linked",
    },
  ],
  marketing_ops: [
    {
      id: "lifecycleAutomation",
      number: 13,
      question:
        "Trained on Lifecycle Stage transitions (usually automated via workflows)",
    },
    {
      id: "leadScoringFields",
      number: 14,
      question: "Trained on lead scoring fields and what triggers what",
    },
    {
      id: "sourceAttribution",
      number: 15,
      question:
        "Trained on source attribution properties (Original Source, First Touch, Last Touch)",
    },
    {
      id: "campaignMembership",
      number: 16,
      question: "Trained on Campaign membership rules",
    },
    {
      id: "subscriptionPrefs",
      number: 17,
      question: "Trained on subscription preferences and unsubscribe flows",
    },
  ],
  cs_am: [
    {
      id: "customerHealthScore",
      number: 13,
      question: "Trained on customer health score property",
    },
    {
      id: "renewalExpansion",
      number: 14,
      question: "Trained on renewal date and expansion opportunity tracking",
    },
    {
      id: "churnRiskIndicators",
      number: 15,
      question: "Trained on churn risk indicators",
    },
    {
      id: "npsCsat",
      number: 16,
      question: "Trained on NPS / CSAT properties and survey workflows",
    },
    {
      id: "escalationPaths",
      number: 17,
      question: "Trained on case escalation paths",
    },
  ],
  revops_admin: [
    {
      id: "crossFunctionalKnowledge",
      number: 13,
      question:
        "Trained on cross-role property knowledge (sales lead status, marketing scoring, CS health metrics)",
    },
    {
      id: "workflowAuditCadence",
      number: 14,
      question: "Trained on workflow audit cadence",
    },
    {
      id: "propertyCreationGovernance",
      number: 15,
      question: "Trained on property creation governance",
    },
    {
      id: "permissionSetManagement",
      number: 16,
      question: "Trained on permission set management",
    },
    {
      id: "dataModelSchema",
      number: 17,
      question:
        "Trained on the portal's data model and association schema",
    },
  ],
};

// ----------------------------------------------------------------- shared question components

const triStateOptions: RadioOption<"yes" | "partial" | "no">[] = [
  { value: "yes", label: "Yes" },
  { value: "partial", label: "Partial" },
  { value: "no", label: "No" },
];

const yesNoOptions: RadioOption<"yes" | "no">[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const integrationOptions: RadioOption<
  "yes" | "not_applicable" | "not_yet"
>[] = [
  { value: "yes", label: "Yes" },
  { value: "not_applicable", label: "Not applicable" },
  { value: "not_yet", label: "Not yet" },
];

function RoleSelector({
  role,
  onChange,
}: {
  role: Role | undefined;
  onChange: (r: Role) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Pick the rep&apos;s role
      </div>
      <Label
        htmlFor="onb-role"
        className="mt-2 block font-[var(--font-display)] text-xl font-medium leading-snug tracking-tight text-[var(--fg)] sm:text-2xl"
      >
        What role is the new team member onboarding into?
      </Label>
      <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
        Role determines the property-knowledge questions in phase 3. The
        other phases share questions across roles, with role-aware
        scoring (N/A excluded from each phase&apos;s denominator).
      </p>
      <div
        role="radiogroup"
        aria-labelledby="onb-role"
        className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
      >
        {ROLES.map((opt) => {
          const selected = role === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                selected
                  ? "border-[var(--accent)] bg-[color-mix(in_oklch,var(--color-brand-500)_12%,transparent)] text-[var(--fg)]"
                  : "border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] hover:border-[var(--border-strong)] hover:text-[var(--fg)]",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PhaseCard({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Phase {number} of 8
      </div>
      <h3 className="mt-2 font-[var(--font-display)] text-xl font-medium leading-snug tracking-tight text-[var(--fg)] sm:text-2xl">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
        {description}
      </p>
      <div className="mt-5 flex flex-col gap-7">{children}</div>
    </div>
  );
}

function QuestionHeader({
  number,
  id,
  question,
  hint,
}: {
  number: number;
  id: string;
  question: string;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] px-1 font-mono text-[10px] text-[var(--fg-muted)]"
        >
          {number}
        </span>
        <span className="font-normal leading-relaxed">{question}</span>
      </Label>
      {hint ? (
        <p className="mt-2 ml-8 text-xs leading-relaxed text-[var(--fg-subtle)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface RadioOption<T extends string> {
  value: T;
  label: string;
}

function RadioQuestion<T extends string>({
  number,
  id,
  question,
  hint,
  value,
  onChange,
  options,
}: {
  number: number;
  id: string;
  question: string;
  hint?: string;
  value: T | null;
  onChange: (v: T) => void;
  options: RadioOption<T>[];
}) {
  return (
    <div>
      <QuestionHeader number={number} id={id} question={question} hint={hint} />
      <div
        role="radiogroup"
        aria-labelledby={id}
        className={cn(
          "mt-3 grid gap-2",
          options.length === 4
            ? "sm:grid-cols-2"
            : options.length === 3
              ? "sm:grid-cols-3"
              : "sm:grid-cols-2",
        )}
      >
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                selected
                  ? "border-[var(--accent)] bg-[color-mix(in_oklch,var(--color-brand-500)_12%,transparent)] text-[var(--fg)]"
                  : "border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] hover:border-[var(--border-strong)] hover:text-[var(--fg)]",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- results

function ResultsPanel({
  results,
  answeredCount,
  totalRequired,
  role,
}: {
  results: OnboardingResults | null;
  answeredCount: number;
  totalRequired: number;
  role: Role | undefined;
}) {
  if (!results) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7 text-center">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          Onboarding readiness score
        </div>
        <div className="mt-3 font-[var(--font-display)] text-4xl font-medium tracking-tight text-[var(--fg-subtle)] sm:text-5xl">
          --<span className="text-2xl text-[var(--fg-subtle)]">/100</span>
        </div>
        <p className="mt-3 text-sm text-[var(--fg-muted)]">
          {role
            ? "Answer every question to see the score, phase breakdown, and priority actions."
            : "Pick a role first."}
        </p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
            style={{
              width: `${Math.min(100, (answeredCount / totalRequired) * 100)}%`,
            }}
          />
        </div>
        <p className="mt-2 font-mono text-xs text-[var(--fg-subtle)]">
          {answeredCount} of {totalRequired} answered
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          Onboarding readiness score
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <div className="font-[var(--font-display)] text-5xl font-medium tracking-tight text-[var(--fg)]">
            {results.totalScore}
          </div>
          <div className="text-2xl text-[var(--fg-subtle)]">/100</div>
        </div>
        <div className="mt-3">
          <TierBadge tier={results.tier} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">
          {results.tierBlurb}
        </p>

        <div className="mt-6 border-t border-[var(--border)] pt-5">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Top 3 priority actions
          </div>
          <ol className="mt-4 flex flex-col gap-4">
            {results.topActions.map((action, i) => (
              <li key={action.itemId} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--color-brand-500)_15%,transparent)] font-mono text-xs font-medium text-[var(--color-brand-400)]"
                >
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-medium leading-snug text-[var(--fg)]">
                    {action.title}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--fg-muted)]">
                    {action.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <PhaseBreakdown phases={results.phases} />

      {results.riskFlags.length > 0 ? (
        <RiskFlags flags={results.riskFlags} />
      ) : null}
    </div>
  );
}

function PhaseBreakdown({ phases }: { phases: PhaseScore[] }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Phase-by-phase breakdown
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {phases.map((p) => (
          <li key={p.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-[var(--fg)]">{p.label}</span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-xs",
                    phaseTextColor(p),
                  )}
                >
                  {Math.round(p.points)} / {Math.round(p.maxPoints)} pts
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${Math.round(p.fraction * 100)}%`,
                    backgroundColor: phaseFillColor(p),
                  }}
                />
              </div>
              <div className="mt-1 text-[11px] text-[var(--fg-subtle)]">
                {p.applicableCount === 0
                  ? "All items N/A"
                  : `${p.fullCreditCount} of ${p.applicableCount} complete${p.naCount > 0 ? `, ${p.naCount} N/A` : ""}`}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function phaseTextColor(p: PhaseScore): string {
  if (p.applicableCount === 0) return "text-[var(--fg-subtle)]";
  if (p.fraction >= 0.9) return "text-[var(--color-success)]";
  if (p.fraction >= 0.5) return "text-[var(--fg)]";
  if (p.fraction >= 0.2) return "text-[#e0a060]";
  return "text-[var(--color-danger)]";
}

function phaseFillColor(p: PhaseScore): string {
  if (p.applicableCount === 0) return "var(--border-strong)";
  if (p.fraction >= 0.9) return "var(--color-success)";
  if (p.fraction >= 0.5) return "var(--accent)";
  if (p.fraction >= 0.2) return "#e0a060";
  return "var(--color-danger)";
}

function RiskFlags({
  flags,
}: {
  flags: OnboardingResults["riskFlags"];
}) {
  return (
    <div className="rounded-xl border border-[color-mix(in_oklch,var(--color-danger)_30%,transparent)] bg-[color-mix(in_oklch,var(--color-danger)_5%,transparent)] p-5 sm:p-6">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-danger)]">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        Role-specific risk flags
      </div>
      <ul className="mt-4 flex flex-col gap-4">
        {flags.map((f) => (
          <li key={f.id}>
            <div className="text-sm font-medium leading-snug text-[#e0a060]">
              {f.title}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-[var(--fg-muted)]">
              {f.body}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  const styles: Record<Tier, string> = {
    Ready:
      "border-[color-mix(in_oklch,var(--color-success)_50%,transparent)] bg-[color-mix(in_oklch,var(--color-success)_15%,transparent)] text-[var(--color-success)]",
    "Mostly Ready":
      "border-[var(--border-strong)] bg-[var(--bg)] text-[var(--fg)]",
    Gaps:
      "border-[#b07840] bg-[color-mix(in_oklch,#e0a060_15%,transparent)] text-[#e0a060]",
    "Critical Gaps":
      "border-[color-mix(in_oklch,var(--color-danger)_50%,transparent)] bg-[color-mix(in_oklch,var(--color-danger)_15%,transparent)] text-[var(--color-danger)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em]",
        styles[tier],
      )}
    >
      Tier: {tier}
    </span>
  );
}

// ----------------------------------------------------------------- methodology

function Methodology() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium text-[var(--fg)] [&::-webkit-details-marker]:hidden">
          <span>Where the benchmarks come from</span>
          <span
            aria-hidden
            className="text-xs text-[var(--fg-subtle)] transition-transform duration-150 group-open:rotate-90"
          >
            &#9656;
          </span>
        </summary>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--fg-muted)]">
          <p>
            <span className="font-medium text-[var(--fg)]">HubSpot KB.</span>{" "}
            Lifecycle Stages have been fully customizable since March 2022.
            Auto-progression rules are configurable per portal.
            Property-level edit permissions are configured under Settings
            &gt; Users &amp; Teams &gt; Permissions.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">Hublead.</span>{" "}
            Sequences are &quot;the single most powerful sales tool in
            HubSpot.&quot; Daily active use, activities logged, and deals
            worked are the three core adoption metrics.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">LeadCRM.</span>{" "}
            Pipeline stage rules can require specific properties before a
            deal advances.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">Default.com.</span>{" "}
            Lead Status updates after every sales touchpoint; Lifecycle
            Stage tracks the broader journey.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              HubSpot Community.
            </span>{" "}
            Buying Roles best practice is association labels per deal, not
            contact properties. A common addition is a &quot;Disqualified&quot;
            or &quot;Nurture&quot; lifecycle stage to keep the CRM clean.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">OnTheFuze 2026.</span>{" "}
            An &quot;Other&quot; lifecycle stage at &gt;5% of the database
            signals a structural problem; the same drift surfaces in
            property creation without governance.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Dunamis model assumptions.
            </span>{" "}
            Phase ordering: access first, concepts second, role-specific
            third, tools fourth, process fifth, integrations sixth,
            reporting seventh, adoption check at day 30. Score weights:
            Access 15%, Concepts 20%, Role-Specific 20%, Tools 15%,
            Process 15%, Integrations 5%, Reporting 5%, Adoption 5%. Tiers:
            Ready (80-100), Mostly Ready (50-79), Gaps (20-49), Critical
            Gaps (0-19). N/A answers are excluded from each phase&apos;s
            denominator so the phase weight stays whole. Critical Gaps
            means the rep is at high risk of corrupting data or defaulting
            to spreadsheets.
          </p>
        </div>
      </details>
    </div>
  );
}

// ----------------------------------------------------------------- email

type EmailStatus = "idle" | "submitting" | "success" | "error";

function EmailCapture({
  answers,
  disabled,
}: {
  answers: PartialAnswers;
  disabled: boolean;
}) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<EmailStatus>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting" || disabled) return;
    if (!isComplete(answers)) return;
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const hubspotutk = readHubspotUtk();
      const payload: Record<string, unknown> = {
        firstName,
        lastName,
        email,
        answers,
      };
      if (hubspotutk) payload.hubspotutk = hubspotutk;
      const res = await fetch(
        "/api/tools/team-onboarding-checklist-report",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        let message = "Could not send the report. Please try again.";
        try {
          const data = (await res.json()) as { error?: string };
          if (data?.error) message = data.error;
        } catch {
          // fall through
        }
        setStatus("error");
        setErrorMessage(message);
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Could not reach the server. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]"
          aria-hidden
        />
        <div>
          <div className="text-sm font-medium text-[var(--fg)]">
            Sent. Check your inbox.
          </div>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            One email with the readiness score, phase breakdown, top
            actions, and any role-specific risk flags. No newsletter, no
            sharing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--fg)]">
        <Mail className="h-4 w-4" aria-hidden />
        Email me this onboarding plan
      </div>
      <p className="mt-1 text-xs text-[var(--fg-muted)]">
        We&apos;ll send the score, phase-by-phase breakdown, top three
        prioritized actions, and any role-specific risk flags. Optional.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        <LeadNameFields
          idPrefix="onb"
          firstName={firstName}
          lastName={lastName}
          setFirstName={setFirstName}
          setLastName={setLastName}
          disabled={status === "submitting" || disabled}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="onb-email">
              Email
              <RequiredMark />
            </Label>
            <Input
              id="onb-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              aria-required="true"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "submitting" || disabled}
              className="mt-1.5"
            />
          </div>
          <Button
            type="submit"
            disabled={status === "submitting" || disabled}
            aria-disabled={status === "submitting" || disabled}
          >
            {status === "submitting" ? "Sending..." : "Email it"}
            {status === "submitting" ? null : (
              <ArrowRight className="ml-0.5 h-4 w-4" aria-hidden />
            )}
          </Button>
        </div>
      </form>
      {disabled && status !== "error" ? (
        <p className="mt-2 text-xs text-[var(--fg-subtle)]">
          Pick a role and answer every question to enable the report.
        </p>
      ) : null}
      {status === "error" && errorMessage ? (
        <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
