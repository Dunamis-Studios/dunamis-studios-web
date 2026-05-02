/**
 * Pure scoring logic for /tools/hubspot-team-onboarding-checklist.
 * No side effects, no I/O. Imported by the client component (live
 * preview) and the API route (canonical score persisted to Redis and
 * mailed in the report).
 *
 * Role-aware checklist scoring readiness for a new team member
 * onboarding into an existing HubSpot portal. Eight phases with a
 * fixed weight distribution (access 15%, concepts 20%, role-specific
 * 20%, tools 15%, process 15%, integrations 5%, reporting 5%,
 * adoption 5%). Phase 3 swaps its question set based on the selected
 * role; the other phases share the same items across all roles.
 *
 * Phase weights and the four-tier outcome banding (Ready / Mostly
 * Ready / Gaps / Critical Gaps) are Dunamis model assumptions,
 * labelled as such in the methodology copy. The underlying property
 * and feature knowledge (lifecycle vs lead status, buying roles as
 * association labels, lifecycle stage customizability since March
 * 2022, sequences as adoption signal) is sourced to HubSpot KB,
 * Hublead, LeadCRM, Default.com, and OnTheFuze 2026.
 */

export type Role =
  | "sdr_bdr"
  | "ae"
  | "marketing_ops"
  | "cs_am"
  | "revops_admin";

// ----------------------------------------------------------------- answer types

export type SeatTypeAnswer = "yes" | "not_sure" | "no";
export type PermSetAnswer = "yes" | "individual" | "no";
export type PropertyPermsAnswer = "yes" | "no" | "unsure";
export type TeamAssignAnswer = "yes" | "na" | "no";
export type YesNoAnswer = "yes" | "no";
export type NotifPrefAnswer = "yes" | "defaults" | "no";
export type TriStateAnswer = "yes" | "partial" | "no";
export type YesNoUnsureAnswer = "yes" | "no" | "unsure";
export type ToolFullAnswer = "yes" | "partial" | "no" | "na";
export type ToolBinaryAnswer = "yes" | "no" | "na";
export type ActivityLogAnswer = "yes" | "verbal" | "no";
export type IntegrationAnswer = "yes" | "not_applicable" | "not_yet";
export type GoalsAnswer = "yes" | "not_applicable" | "no";
export type DailyActiveAnswer = "yes" | "mostly" | "no";
export type FirstDealAnswer = "yes" | "not_applicable" | "no";

// ----------------------------------------------------------------- answers shape

export interface OnboardingAnswers {
  role: Role;

  // Phase 1: Access & Permissions (7 items)
  seatType: SeatTypeAnswer;
  permissionSet: PermSetAnswer;
  propertyPermissions: PropertyPermsAnswer;
  teamAssignment: TeamAssignAnswer;
  emailConnected: YesNoAnswer;
  calendarConnected: YesNoAnswer;
  notificationPrefs: NotifPrefAnswer;

  // Phase 2: Core Concepts (5 items)
  lifecycleVsLeadStatus: TriStateAnswer;
  portalLifecycleStages: TriStateAnswer;
  dealStagesPipelines: TriStateAnswer;
  requiredPropertiesAtStages: TriStateAnswer;
  autoProgressionRules: YesNoUnsureAnswer;

  // Phase 3: Role-specific (5 items, only the slots for the selected role
  // are populated; the others should be omitted).
  // SDR/BDR
  leadStatusValues?: TriStateAnswer;
  disqualReasons?: TriStateAnswer;
  leadsObject?: TriStateAnswer;
  leadToDealConversion?: TriStateAnswer;
  meetingHandoff?: TriStateAnswer;
  // AE
  dealStageProgression?: TriStateAnswer;
  requiredDealProperties?: TriStateAnswer;
  buyingRoles?: TriStateAnswer;
  lossReasons?: TriStateAnswer;
  associationRules?: TriStateAnswer;
  // Marketing Ops
  lifecycleAutomation?: TriStateAnswer;
  leadScoringFields?: TriStateAnswer;
  sourceAttribution?: TriStateAnswer;
  campaignMembership?: TriStateAnswer;
  subscriptionPrefs?: TriStateAnswer;
  // CS/AM
  customerHealthScore?: TriStateAnswer;
  renewalExpansion?: TriStateAnswer;
  churnRiskIndicators?: TriStateAnswer;
  npsCsat?: TriStateAnswer;
  escalationPaths?: TriStateAnswer;
  // RevOps Admin
  crossFunctionalKnowledge?: TriStateAnswer;
  workflowAuditCadence?: TriStateAnswer;
  propertyCreationGovernance?: TriStateAnswer;
  permissionSetManagement?: TriStateAnswer;
  dataModelSchema?: TriStateAnswer;

  // Phase 4: Tool Enablement (5 items)
  meetingLinks: ToolFullAnswer;
  templatesSnippets: ToolBinaryAnswer;
  sequences: ToolFullAnswer;
  tasksQueues: ToolBinaryAnswer;
  salesWorkspace: ToolBinaryAnswer;

  // Phase 5: Process Discipline (3 items)
  activityLogging: ActivityLogAnswer;
  associationRulesClear: YesNoAnswer;
  thingsToWatchOut: YesNoAnswer;

  // Phase 6: Integrations (3 items)
  linkedin: IntegrationAnswer;
  slackTeams: IntegrationAnswer;
  phoneDialer: IntegrationAnswer;

  // Phase 7: Reporting & Goals (3 items)
  dashboards: YesNoAnswer;
  savedViews: YesNoAnswer;
  goals: GoalsAnswer;

  // Phase 8: Adoption Check (3 items)
  dailyActive: DailyActiveAnswer;
  activitiesLogging: TriStateAnswer;
  firstDealLead: FirstDealAnswer;
}

// ----------------------------------------------------------------- output types

export type Tier = "Ready" | "Mostly Ready" | "Gaps" | "Critical Gaps";

export type PhaseId =
  | "access"
  | "concepts"
  | "role"
  | "tools"
  | "process"
  | "integrations"
  | "reporting"
  | "adoption";

export interface PhaseScore {
  id: PhaseId;
  label: string;
  /** Phase weight in the 0-100 score, e.g. 0.15 for Access. */
  weight: number;
  /** 0 to 1 fraction of credit earned across applicable items. */
  fraction: number;
  /** Points contributed to the 0-100 total (weight * fraction * 100). */
  points: number;
  /** Maximum points the phase can contribute (weight * 100). */
  maxPoints: number;
  /** Items in the phase that count (excludes N/A). */
  applicableCount: number;
  /** Items in the phase that scored full credit. */
  fullCreditCount: number;
  /** Items in the phase whose answer was N/A. */
  naCount: number;
  /** Plain-English status: complete, partial, or incomplete. */
  status: "complete" | "partial" | "incomplete";
}

export interface ItemLoss {
  /** Stable identifier; routes into the action map. */
  id: keyof OnboardingAnswers;
  phaseId: PhaseId;
  label: string;
  /** Points lost on this single item (phase weight share * (1 - itemFraction) * 100). */
  loss: number;
  /** itemFraction: 0 = no credit, 1 = full credit. */
  fraction: number;
}

export interface RiskFlag {
  /** Item id that triggered the flag. */
  id: keyof OnboardingAnswers;
  /** Headline shown in the UI flag list. */
  title: string;
  /** Body text describing why this matters for the role. */
  body: string;
}

export interface OnboardingAction {
  itemId: keyof OnboardingAnswers;
  title: string;
  body: string;
}

export interface OnboardingResults {
  totalScore: number;
  tier: Tier;
  tierBlurb: string;
  phases: PhaseScore[];
  topActions: OnboardingAction[];
  riskFlags: RiskFlag[];
}

// ----------------------------------------------------------------- score helpers

/**
 * itemFraction returns the credit ratio (0 to 1) for a single answer.
 * "na" / "not_applicable" returns null, which signals the item should
 * be excluded from the phase denominator entirely.
 */
function itemFraction(answer: string | undefined): number | null {
  if (answer === undefined) return 0;
  switch (answer) {
    case "yes":
      return 1;
    case "partial":
      return 0.5;
    case "mostly":
      return 0.7;
    case "defaults":
      return 0.5;
    case "verbal":
      return 0.4;
    case "individual":
      return 0.5;
    case "na":
    case "not_applicable":
      return null;
    case "not_sure":
    case "unsure":
    case "no":
    case "not_yet":
      return 0;
    default:
      return 0;
  }
}

// ----------------------------------------------------------------- phase definitions

const PHASE_WEIGHTS: Record<PhaseId, number> = {
  access: 0.15,
  concepts: 0.20,
  role: 0.20,
  tools: 0.15,
  process: 0.15,
  integrations: 0.05,
  reporting: 0.05,
  adoption: 0.05,
};

const PHASE_LABELS: Record<PhaseId, string> = {
  access: "Access & Permissions",
  concepts: "Core Concepts Training",
  role: "Role-Specific Property Knowledge",
  tools: "Tool Enablement",
  process: "Process Discipline",
  integrations: "Integrations",
  reporting: "Reporting & Goals",
  adoption: "Adoption Check (Day 30)",
};

interface PhaseItemDef {
  id: keyof OnboardingAnswers;
  label: string;
}

const COMMON_PHASE_ITEMS: Record<
  Exclude<PhaseId, "role">,
  PhaseItemDef[]
> = {
  access: [
    { id: "seatType", label: "Seat type assigned correctly" },
    { id: "permissionSet", label: "Permission set assigned" },
    { id: "propertyPermissions", label: "Property-level edit permissions" },
    { id: "teamAssignment", label: "Team assignment configured" },
    { id: "emailConnected", label: "Email connected" },
    { id: "calendarConnected", label: "Calendar connected" },
    { id: "notificationPrefs", label: "Notification preferences" },
  ],
  concepts: [
    {
      id: "lifecycleVsLeadStatus",
      label: "Lifecycle Stage vs Lead Status",
    },
    {
      id: "portalLifecycleStages",
      label: "Portal-specific Lifecycle Stages",
    },
    { id: "dealStagesPipelines", label: "Deal Stages and pipelines" },
    {
      id: "requiredPropertiesAtStages",
      label: "Required properties at deal stages",
    },
    { id: "autoProgressionRules", label: "Auto-progression rules" },
  ],
  tools: [
    { id: "meetingLinks", label: "Meeting links" },
    { id: "templatesSnippets", label: "Templates and snippets" },
    { id: "sequences", label: "Sequences" },
    { id: "tasksQueues", label: "Tasks and task queues" },
    { id: "salesWorkspace", label: "Sales Workspace walkthrough" },
  ],
  process: [
    { id: "activityLogging", label: "Activity logging standards" },
    { id: "associationRulesClear", label: "Association rules clear" },
    { id: "thingsToWatchOut", label: "Things-to-watch-out walkthrough" },
  ],
  integrations: [
    { id: "linkedin", label: "LinkedIn integration" },
    { id: "slackTeams", label: "Slack / Teams notifications" },
    { id: "phoneDialer", label: "Phone / dialer integration" },
  ],
  reporting: [
    { id: "dashboards", label: "Default dashboards reviewed" },
    { id: "savedViews", label: "Daily-use saved views" },
    { id: "goals", label: "Goals assigned" },
  ],
  adoption: [
    { id: "dailyActive", label: "Daily active in past 7 days" },
    { id: "activitiesLogging", label: "Activities logged consistently" },
    { id: "firstDealLead", label: "First deal or lead worked end-to-end" },
  ],
};

const ROLE_PHASE_ITEMS: Record<Role, PhaseItemDef[]> = {
  sdr_bdr: [
    { id: "leadStatusValues", label: "Lead Status values and when to use each" },
    { id: "disqualReasons", label: "Disqualification reasons" },
    { id: "leadsObject", label: "Leads object for pre-qualification" },
    { id: "leadToDealConversion", label: "When to convert Lead to Deal" },
    { id: "meetingHandoff", label: "Meeting handoff fields and notes" },
  ],
  ae: [
    { id: "dealStageProgression", label: "Deal Stage progression criteria" },
    { id: "requiredDealProperties", label: "Required deal properties" },
    {
      id: "buyingRoles",
      label: "Buying Roles via association labels (not contact properties)",
    },
    { id: "lossReasons", label: "Loss Reasons taxonomy" },
    {
      id: "associationRules",
      label: "Contact, company, and deal association rules",
    },
  ],
  marketing_ops: [
    {
      id: "lifecycleAutomation",
      label: "Lifecycle Stage transitions and workflow automation",
    },
    {
      id: "leadScoringFields",
      label: "Lead scoring fields and triggers",
    },
    { id: "sourceAttribution", label: "Source attribution properties" },
    { id: "campaignMembership", label: "Campaign membership rules" },
    {
      id: "subscriptionPrefs",
      label: "Subscription preferences and unsubscribe flows",
    },
  ],
  cs_am: [
    { id: "customerHealthScore", label: "Customer health score" },
    {
      id: "renewalExpansion",
      label: "Renewal date and expansion tracking",
    },
    { id: "churnRiskIndicators", label: "Churn risk indicators" },
    { id: "npsCsat", label: "NPS / CSAT properties and survey workflows" },
    { id: "escalationPaths", label: "Case escalation paths" },
  ],
  revops_admin: [
    {
      id: "crossFunctionalKnowledge",
      label:
        "Cross-role property knowledge (sales lead status, marketing scoring, CS health metrics)",
    },
    { id: "workflowAuditCadence", label: "Workflow audit cadence" },
    {
      id: "propertyCreationGovernance",
      label: "Property creation governance",
    },
    {
      id: "permissionSetManagement",
      label: "Permission set management",
    },
    {
      id: "dataModelSchema",
      label: "Portal data model and association schema",
    },
  ],
};

// ----------------------------------------------------------------- actions

const ACTION_MAP: Partial<
  Record<keyof OnboardingAnswers, OnboardingAction>
> = {
  // Phase 1
  seatType: {
    itemId: "seatType",
    title: "Confirm the right HubSpot seat type",
    body: "Core, Sales, and Service seats expose different feature sets and bill differently. The wrong seat means the rep either cannot access the tools they need (under-seated) or the team is paying for capabilities they will never use (over-seated). Verify in Settings > Account & Billing > Users & Seats before day one.",
  },
  permissionSet: {
    itemId: "permissionSet",
    title: "Assign a permission set, not individual permissions",
    body: "Permission sets enforce consistent access across role peers and survive personnel changes. Individual permissions drift, accumulate exceptions, and become impossible to audit. Build a permission set per role (SDR, AE, CS, RevOps) and assign reps to the set, never to bespoke permissions.",
  },
  propertyPermissions: {
    itemId: "propertyPermissions",
    title: "Lock down property-level edit permissions",
    body: "Lifecycle Stage edits should be ops-only. Deal Probability is usually manager-only. Without property-level permissions configured, the rep can stomp on values that workflows are responsible for, and reports start showing flapping data. Configure under Settings > Users & Teams > Permissions per the HubSpot KB.",
  },
  teamAssignment: {
    itemId: "teamAssignment",
    title: "Assign the rep to the right team",
    body: "Team assignment drives default views, ownership filters, and reporting roll-ups. Without it, the rep falls into the global pool and dashboards either show too much or too little. Set under Settings > Users & Teams > Teams.",
  },
  emailConnected: {
    itemId: "emailConnected",
    title: "Connect the rep's email inbox to HubSpot",
    body: "Without email connected, sequences cannot send, sent emails are not logged to records, and the rep ends up working out of two systems. Connect via Settings > General > Email Integrations on day one.",
  },
  calendarConnected: {
    itemId: "calendarConnected",
    title: "Connect the calendar for meeting links and logging",
    body: "Meeting links require a connected calendar. Meetings booked outside HubSpot also fail to log without it. Connect under Settings > General > Calendar.",
  },
  notificationPrefs: {
    itemId: "notificationPrefs",
    title: "Tune notification preferences for the role",
    body: "HubSpot's defaults send too many notifications for new reps and too few for managers. Walk the rep through Settings > Notifications and turn on the ones their role uses (assigned tasks, mentions, deal stage changes), turn off the rest. Defaults are noise; tuned notifications drive habit.",
  },

  // Phase 2
  lifecycleVsLeadStatus: {
    itemId: "lifecycleVsLeadStatus",
    title: "Train the rep on Lifecycle Stage vs Lead Status",
    body: "Per Default.com: Lifecycle Stage tracks the broad customer journey (Subscriber > Lead > MQL > SQL > Opportunity > Customer); Lead Status tracks the operational sub-detail within MQL or SQL (New, In Progress, Connected, etc.). Lifecycle Stage rarely moves manually; Lead Status updates after every touchpoint. Reps that conflate them either pollute Lifecycle Stage with operational noise or never update Lead Status at all.",
  },
  portalLifecycleStages: {
    itemId: "portalLifecycleStages",
    title: "Document this portal's specific Lifecycle Stages",
    body: "HubSpot's Lifecycle Stages have been fully customizable since March 2022. Every portal configures them differently. New reps need a written list of YOUR stages with the entry and exit criteria for each, not the generic HubSpot defaults. Without it, the rep guesses, and the data corrupts.",
  },
  dealStagesPipelines: {
    itemId: "dealStagesPipelines",
    title: "Walk the rep through your Deal Stages and pipelines",
    body: "Deal Stages are the operational sub-detail of the Opportunity lifecycle stage. Pipelines are distinct sales processes; multiple pipelines exist only when the processes are fundamentally different (e.g., new business vs renewals). Show the rep each pipeline, when to use it, and what each stage means in your business.",
  },
  requiredPropertiesAtStages: {
    itemId: "requiredPropertiesAtStages",
    title: "Document required properties per deal stage",
    body: "Per LeadCRM, pipeline stage rules can require specific properties before a deal advances (Amount, Close Date, Probability, MEDDIC fields). New reps need this list explicitly. Tribal knowledge fails: the rep advances a deal, the workflow blocks it, and they spend a day debugging.",
  },
  autoProgressionRules: {
    itemId: "autoProgressionRules",
    title: "Train on auto-progression rules in the portal",
    body: "Most portals auto-set Lifecycle Stage when a contact is created, when a deal is created, and when a deal closes won. Reps that do not know which transitions are automatic will manually advance Lifecycle Stage and break workflow contracts. Document the auto-progression behavior for the rep before they touch a real deal.",
  },

  // Phase 3 (sample - same structural pattern repeats per role)
  leadStatusValues: {
    itemId: "leadStatusValues",
    title: "Train SDR on Lead Status values",
    body: "New, In Progress, Attempted to Contact, Connected, Bad Timing, Unqualified, etc. The rep needs to know each value and when to use it. Lead Status updates after every touchpoint per Default.com; without trained values, the rep either picks one and stops, or never updates Lead Status at all.",
  },
  disqualReasons: {
    itemId: "disqualReasons",
    title: "Document the disqualification reason taxonomy",
    body: "Without a documented disqualification reason taxonomy, the rep either does not disqualify (and the contact lingers) or picks a free-text reason (and reporting fails). A standard set of reasons (No Budget, Wrong ICP, Not Now, No Authority, Competitor) keeps disqualifications loggable and reportable. Per HubSpot Community, adding a 'Disqualified' or 'Nurture' lifecycle stage is a common addition to keep the CRM clean.",
  },
  leadsObject: {
    itemId: "leadsObject",
    title: "Train the SDR on the Leads object",
    body: "HubSpot's Leads object is separate from contacts and deals. It is the right place for pre-qualification work, before the rep is confident enough to push the record into the SQL pipeline. Without training on the Leads object, SDRs use Contacts as a kanban and pollute the contact database.",
  },
  leadToDealConversion: {
    itemId: "leadToDealConversion",
    title: "Define Lead-to-Deal conversion criteria",
    body: "Document the criteria and threshold for converting a Lead into a Deal: minimum qualifying questions answered, BANT signals confirmed, AE handoff complete. Without explicit criteria, deals get created prematurely (pipeline bloat) or too late (deals stuck in Lead status forever).",
  },
  meetingHandoff: {
    itemId: "meetingHandoff",
    title: "Build a meeting handoff template",
    body: "AE handoff requires structured notes: discovery answers, pain confirmed, decision criteria, next steps. Without a templated handoff (notes property or note template), the AE walks into the meeting cold and has to re-run discovery. Document what fields the SDR fills in before the meeting books.",
  },

  dealStageProgression: {
    itemId: "dealStageProgression",
    title: "Train the AE on Deal Stage progression criteria",
    body: "Per LeadCRM: each stage has objective entry criteria and required properties. The AE needs to know what advances a deal from each stage to the next, in writing. Tribal knowledge here results in deals that sit in the wrong stage, blowing up forecasting accuracy.",
  },
  requiredDealProperties: {
    itemId: "requiredDealProperties",
    title: "Walk the AE through required deal properties",
    body: "Amount, Close Date, Probability, MRR or ACV, Contract Term (if SaaS). For each, walk through where the data comes from, when it gets updated, and which stage requires it. Without this, the AE leaves fields blank and forecasting is impossible.",
  },
  buyingRoles: {
    itemId: "buyingRoles",
    title: "Train the AE on Buying Roles via association labels",
    body: "This is the highest-impact AE training item. Per HubSpot Community consensus, Buying Roles (Decision Maker, Champion, Influencer, etc.) are association labels assigned per deal, not contact properties. AEs that store buying roles as contact properties get stale data on every deal: the role gets overwritten on the next deal because contact properties are scoped to the contact, not the deal. The fix is association labels, scoped per deal.",
  },
  lossReasons: {
    itemId: "lossReasons",
    title: "Document the Loss Reasons taxonomy",
    body: "A standard taxonomy of Loss Reasons (No Budget, Lost to Competitor X, Timing, No Decision, etc.) makes win-loss reporting possible. Free-text loss reasons make it impossible. Document the taxonomy and require it on Closed Lost.",
  },
  associationRules: {
    itemId: "associationRules",
    title: "Drill association rules: contact, company, deal",
    body: "Every deal needs an associated contact AND associated company. Contacts need to be associated to companies. Without these associations, reports break, workflows do not fire, and the AE ends up logging activity to the wrong record. Drill the rule: deals always link to both, every time.",
  },

  lifecycleAutomation: {
    itemId: "lifecycleAutomation",
    title: "Train Marketing Ops on Lifecycle automation",
    body: "Marketing Ops owns Lifecycle Stage transitions, which are usually automated via workflows. The rep needs to know which workflows manage transitions, what triggers them, and how to debug a stuck contact. Without it, ops folks build conflicting workflows that fight over Lifecycle Stage and break the funnel.",
  },
  leadScoringFields: {
    itemId: "leadScoringFields",
    title: "Walk through lead scoring fields and triggers",
    body: "Marketing Ops owns the lead scoring model. The rep needs to know which fields contribute to the score, what events trigger increments, and what thresholds drive the MQL transition. Without it, scoring drifts and the sales team loses trust in MQLs.",
  },
  sourceAttribution: {
    itemId: "sourceAttribution",
    title: "Train on source attribution properties",
    body: "Original Source, First Touch, Last Touch. Each measures something different and they get conflated easily. Marketing Ops reps need to know which source property answers which question (where did the contact come from originally vs what closed the deal) and which attribution model the team uses for reporting.",
  },
  campaignMembership: {
    itemId: "campaignMembership",
    title: "Document Campaign membership rules",
    body: "Campaigns roll up assets, contacts, and revenue. Without explicit rules for what gets added to which campaign and when, the reporting breaks. Train on how to associate contacts and assets to campaigns and what each campaign represents.",
  },
  subscriptionPrefs: {
    itemId: "subscriptionPrefs",
    title: "Train on subscription preferences and unsubscribe flows",
    body: "Subscription types, opt-in vs opt-out semantics, double opt-in for compliance regions, suppression list behavior. Marketing Ops owns email deliverability; the rep needs to know how subscriptions flow, where unsubscribes land, and how to debug a 'why did this contact get this email' question.",
  },

  customerHealthScore: {
    itemId: "customerHealthScore",
    title: "Train the CSM on customer health score",
    body: "The health score property is the daily-use field. The CSM needs to know what inputs feed it, what each tier means (green / yellow / red), and what the SLA is when an account drops a tier. Without it, CS triage falls back to gut feel and the portfolio is impossible to scale.",
  },
  renewalExpansion: {
    itemId: "renewalExpansion",
    title: "Walk through renewal date and expansion tracking",
    body: "Renewal date drives the renewal motion. Expansion opportunities live in their own pipeline or as deals tagged Expansion. The CSM needs to know how to surface accounts approaching renewal, how to log expansion conversations, and how the handoff to AE works for net-new revenue.",
  },
  churnRiskIndicators: {
    itemId: "churnRiskIndicators",
    title: "Document churn risk indicators",
    body: "Common churn signals: usage drop, reduced ticket volume, sponsor turnover, payment failures, NPS decline. The CSM needs to know which signals trigger an intervention and what the playbook is for each. Without explicit indicators, churn is detected only after the customer has already decided.",
  },
  npsCsat: {
    itemId: "npsCsat",
    title: "Train on NPS / CSAT properties and survey workflows",
    body: "Where the survey data lands, how to interpret a score in context (per-account trend, not absolute), and what the follow-up workflow is for low scores. Without this, NPS becomes a vanity metric with no operational handle.",
  },
  escalationPaths: {
    itemId: "escalationPaths",
    title: "Document case escalation paths",
    body: "When does a ticket escalate? To whom? What is the SLA? Without explicit escalation paths, the CSM either escalates everything (manager fatigue) or nothing (customer churn). Document the matrix per ticket type and severity.",
  },

  crossFunctionalKnowledge: {
    itemId: "crossFunctionalKnowledge",
    title: "Cross-train on the property domains across roles",
    body: "RevOps admins need to recognize the property territories of every role: sales lead status, marketing scoring fields, CS health metrics, association schemas. Without it, admin decisions (consolidating properties, archiving fields, restructuring workflows) silently break a team that the admin did not know depended on the property.",
  },
  workflowAuditCadence: {
    itemId: "workflowAuditCadence",
    title: "Adopt a workflow audit cadence",
    body: "Quarterly is the agency consensus. Without it, conflicting writers, archived references, and re-enrollment loops accumulate faster than they get fixed. Block 90 minutes per quarter to walk every active workflow with its team.",
  },
  propertyCreationGovernance: {
    itemId: "propertyCreationGovernance",
    title: "Establish property creation governance",
    body: "Without a property creation policy, the portal accumulates duplicate properties (lifecycle_stage_v2, sales_owner_new, customer_score_2024) and dies of bloat. RevOps admins need to be the single approver for new properties, with a request form and a naming convention.",
  },
  permissionSetManagement: {
    itemId: "permissionSetManagement",
    title: "Own permission set management as a process",
    body: "Permission sets are the durable unit of access control; individual permissions drift and become unauditable. RevOps admins need to manage permission sets per role, refresh them when feature usage changes, and audit them quarterly.",
  },
  dataModelSchema: {
    itemId: "dataModelSchema",
    title: "Map the portal's data model and association schema",
    body: "Object types, association labels, primary keys, and integration data flow are the admin's atlas. Without a documented data model, every change is a guess about what depends on what. Build the map once and update it when the schema changes.",
  },

  // Phase 4
  meetingLinks: {
    itemId: "meetingLinks",
    title: "Set up and test the rep's meeting links",
    body: "Meeting links are the single highest-leverage adoption item for sales-facing roles. Without working links, prospects get no booking option and reps fall back to email volleys. Configure the rep's links, embed them in email signatures, and test end-to-end before day one.",
  },
  templatesSnippets: {
    itemId: "templatesSnippets",
    title: "Walk the rep through templates and snippets",
    body: "Templates and snippets cut the rep's email writing time by half once habituated. Show the rep the template library, the snippet shortcuts, and the team's most-used templates. Adoption signal per Hublead: templates used per email sent.",
  },
  sequences: {
    itemId: "sequences",
    title: "Train and enroll the rep in at least one sequence",
    body: "Hublead calls sequences 'the single most powerful sales tool in HubSpot.' Train the rep on sequence enrollment, monitoring, and unenrollment. Make sure they have at least one prospect enrolled in week one; otherwise the muscle never forms.",
  },
  tasksQueues: {
    itemId: "tasksQueues",
    title: "Set up daily task queues",
    body: "Task queues are how reps work HubSpot daily without thinking. A queue for new leads, a queue for follow-ups, a queue for renewals (CS). Without queues, the rep works from inbox guilt and the highest-leverage tasks slip.",
  },
  salesWorkspace: {
    itemId: "salesWorkspace",
    title: "Walk through the Sales Workspace",
    body: "The Sales Workspace consolidates queues, deals, and prospecting into one daily-use surface. Walk the rep through the layout, the filters, and the daily ritual. Adoption tracks here directly: reps that live in Sales Workspace ship, reps that don't drift.",
  },

  // Phase 5
  activityLogging: {
    itemId: "activityLogging",
    title: "Document activity logging standards in writing",
    body: "Verbal standards drift. The rep needs the standard on paper: what activities to log, on what record, with what fields filled. Per Hublead, activities logged per day is one of the three core adoption metrics; without standards, the metric is meaningless.",
  },
  associationRulesClear: {
    itemId: "associationRulesClear",
    title: "Drill the association rule: contact, company, deal",
    body: "Every deal links to both a contact and a company. Every contact links to a company. Without these associations, reports break, workflows do not fire, and the rep logs activity to the wrong record. Drill the rule once on day one and re-drill at week two.",
  },
  thingsToWatchOut: {
    itemId: "thingsToWatchOut",
    title: "Run a things-to-watch-out walkthrough",
    body: "Common rep mistakes: manually advancing Lifecycle Stage when a workflow should handle it, creating deals before SDR qualification (pipeline bloat), setting buying roles as contact properties (gets overwritten), logging activities to the wrong record, treating Lead Status and Lifecycle Stage as the same field. A 30-minute walkthrough on day three catches these before they become habits.",
  },

  // Phase 6
  linkedin: {
    itemId: "linkedin",
    title: "Install LinkedIn integration if applicable",
    body: "For SDR and AE roles, the LinkedIn integration eliminates dual-system tab juggling. If the team uses LinkedIn for prospecting, the integration is non-optional. Skip if not applicable, but install if the rep prospects on LinkedIn at all.",
  },
  slackTeams: {
    itemId: "slackTeams",
    title: "Configure Slack or Teams notifications",
    body: "Channel-routed notifications (deal closed won, MQL routed, ticket escalated) drive cross-team awareness without inbox spam. Configure the rep's notifications to the right channels.",
  },
  phoneDialer: {
    itemId: "phoneDialer",
    title: "Install the phone or dialer integration",
    body: "For roles that dial (SDR, AE), the dialer integration logs calls to records automatically and removes the manual logging tax. Without it, call activity falls off the records and reporting goes blind.",
  },

  // Phase 7
  dashboards: {
    itemId: "dashboards",
    title: "Walk the rep through default dashboards",
    body: "Per-role default dashboards (SDR activity, AE pipeline, CS portfolio health) are the rep's daily KPI surface. Walk through each tile and what it measures so the rep knows what they will be measured on.",
  },
  savedViews: {
    itemId: "savedViews",
    title: "Build daily-use saved views with the rep",
    body: "Saved views are how reps work at speed. My Open Deals, Tasks Due Today, Renewals This Quarter. Build the views with the rep on day one rather than letting them assemble ad-hoc filters every morning.",
  },
  goals: {
    itemId: "goals",
    title: "Assign goals in HubSpot",
    body: "HubSpot's Goals feature ties activity and revenue targets to dashboards. Without assigned goals, the rep has no target inside the tool and falls back to spreadsheets. Assign within the first two weeks once expectations are clear.",
  },

  // Phase 8
  dailyActive: {
    itemId: "dailyActive",
    title: "Confirm daily HubSpot use",
    body: "Per Hublead, daily active use is the foundational adoption metric. If the rep is not in HubSpot daily by week four, the rest of the score does not matter. Check the rep's last login and activity feed; if it is sparse, intervene.",
  },
  activitiesLogging: {
    itemId: "activitiesLogging",
    title: "Confirm activities are logged consistently",
    body: "Logged activities (calls, emails, meetings, notes) are the second core adoption metric per Hublead. Inconsistent logging means leadership cannot see what the rep is doing and reports are unreliable. If logging is partial, retrain on the activity standard from Phase 5.",
  },
  firstDealLead: {
    itemId: "firstDealLead",
    title: "Walk one deal or lead through the full process",
    body: "First end-to-end work product is the third core adoption metric per Hublead. By day 30, the rep should have moved at least one deal or lead through the full lifecycle. If not, find the blocker (process, tooling, or knowledge) and remove it.",
  },
};

// ----------------------------------------------------------------- risk flags

interface RiskFlagDef {
  /** Item must score 0 to trigger. */
  triggerItemId: keyof OnboardingAnswers;
  flag: RiskFlag;
}

const ROLE_RISK_FLAG_DEFS: Record<Role, RiskFlagDef[]> = {
  sdr_bdr: [
    {
      triggerItemId: "leadsObject",
      flag: {
        id: "leadsObject",
        title: "SDR will use Contacts as a prospecting kanban",
        body: "Without training on the Leads object, the rep will work pre-qualification in the Contacts database. The contact list pollutes with unverified leads, and downstream workflows (lifecycle automation, lead scoring) misfire. Train before they touch real data.",
      },
    },
    {
      triggerItemId: "disqualReasons",
      flag: {
        id: "disqualReasons",
        title: "Disqualifications will go untracked or untaxonomized",
        body: "Without a documented disqualification taxonomy, the rep either does not disqualify (stale contacts pile up) or uses free text (reporting fails). Per HubSpot Community, adding a 'Disqualified' or 'Nurture' lifecycle stage and locking down a reason taxonomy is the standard fix.",
      },
    },
  ],
  ae: [
    {
      triggerItemId: "buyingRoles",
      flag: {
        id: "buyingRoles",
        title:
          "Buying roles not trained = stale data on every deal",
        body: "AEs that haven't been trained on Buying Roles as association labels almost always store them as contact properties. Per HubSpot Community consensus, this guarantees stale data: contact properties are scoped to the contact, so the role gets overwritten on the next deal. The fix is association labels per deal.",
      },
    },
    {
      triggerItemId: "associationRules",
      flag: {
        id: "associationRules",
        title:
          "Association rule unclear: deals will be missing companies",
        body: "Deals without associated companies break account-based reporting, ABM workflows, and renewal forecasts. Drill the rule on day one: every deal links to both a contact and a company, every time.",
      },
    },
  ],
  marketing_ops: [
    {
      triggerItemId: "lifecycleAutomation",
      flag: {
        id: "lifecycleAutomation",
        title:
          "Marketing Ops will build conflicting Lifecycle workflows",
        body: "Without training on the existing Lifecycle automation, the new rep will build workflows that fight the existing ones. Lifecycle Stage starts flapping, MQL counts go unstable, and the funnel reports stop being trustworthy.",
      },
    },
    {
      triggerItemId: "subscriptionPrefs",
      flag: {
        id: "subscriptionPrefs",
        title: "Email deliverability is at risk",
        body: "Subscription mishandling drives spam complaints, IP reputation drops, and inbox placement issues. Marketing Ops owns deliverability; without training on subscription flows and unsubscribe semantics, every sent email is a risk.",
      },
    },
  ],
  cs_am: [
    {
      triggerItemId: "customerHealthScore",
      flag: {
        id: "customerHealthScore",
        title: "CS triage will fall back to gut feel",
        body: "Without health score training, the CSM cannot triage their portfolio at scale. Accounts get attention by recency or vibes, not by risk. Train on health score inputs, tier semantics, and the SLA when an account drops a tier.",
      },
    },
    {
      triggerItemId: "churnRiskIndicators",
      flag: {
        id: "churnRiskIndicators",
        title:
          "Churn detected only after the customer has decided",
        body: "Without explicit churn risk indicators, intervention is reactive. The CSM needs to know which usage drops, ticket patterns, sponsor changes, and survey scores trigger an outreach. Document the matrix and the playbook per signal.",
      },
    },
  ],
  revops_admin: [
    {
      triggerItemId: "propertyCreationGovernance",
      flag: {
        id: "propertyCreationGovernance",
        title: "Portal will accumulate duplicate properties and bloat",
        body: "Without property creation governance, the portal accumulates duplicates (lifecycle_stage_v2, sales_owner_new, customer_score_2024) and dies of bloat. Per OnTheFuze 2026, an 'Other' lifecycle stage at >5% of the database signals a structural problem; the same pattern surfaces in property fields. Governance is the prevention.",
      },
    },
    {
      triggerItemId: "workflowAuditCadence",
      flag: {
        id: "workflowAuditCadence",
        title: "Workflow drift will compound past the point of recovery",
        body: "Without a workflow audit cadence, conflicts and archived references accumulate faster than they get fixed. The agency consensus is quarterly. RevOps admins that audit annually fall behind by year two.",
      },
    },
  ],
};

// ----------------------------------------------------------------- public

export function scoreOnboarding(
  answers: OnboardingAnswers,
): OnboardingResults {
  const phases: PhaseScore[] = [];

  // Common phases
  for (const id of [
    "access",
    "concepts",
    "tools",
    "process",
    "integrations",
    "reporting",
    "adoption",
  ] as const) {
    phases.push(
      scorePhase(
        id,
        COMMON_PHASE_ITEMS[id],
        answers,
      ),
    );
  }

  // Role-specific phase
  const roleItems = ROLE_PHASE_ITEMS[answers.role];
  phases.push(scorePhase("role", roleItems, answers));

  // Sort phases into canonical display order
  phases.sort((a, b) => phaseOrder(a.id) - phaseOrder(b.id));

  const totalScore = Math.round(
    phases.reduce((acc, p) => acc + p.points, 0),
  );

  const tier = tierFor(totalScore);
  const tierBlurb = TIER_BLURBS[tier];

  // ----- top actions: per-item loss across all phases
  const itemLosses: ItemLoss[] = [];
  for (const phase of phases) {
    const items =
      phase.id === "role"
        ? ROLE_PHASE_ITEMS[answers.role]
        : COMMON_PHASE_ITEMS[
            phase.id as Exclude<PhaseId, "role">
          ];

    // Compute applicable count first to size each item's slice of the
    // phase's total weight share.
    const applicable = items.filter((item) => {
      const f = itemFraction(answers[item.id] as string | undefined);
      return f !== null;
    });
    if (applicable.length === 0) continue;

    const itemPointShare =
      (PHASE_WEIGHTS[phase.id] / applicable.length) * 100;

    for (const item of applicable) {
      const f = itemFraction(answers[item.id] as string | undefined) ?? 0;
      const loss = itemPointShare * (1 - f);
      itemLosses.push({
        id: item.id,
        phaseId: phase.id,
        label: item.label,
        loss,
        fraction: f,
      });
    }
  }

  itemLosses.sort((a, b) => b.loss - a.loss);
  const topActions: OnboardingAction[] = [];
  for (const itemLoss of itemLosses) {
    if (topActions.length >= 3) break;
    if (itemLoss.loss <= 0) break;
    const action = ACTION_MAP[itemLoss.id];
    if (action) topActions.push(action);
  }

  // ----- risk flags: only fire for role-specific items that scored 0
  const riskFlags: RiskFlag[] = [];
  for (const def of ROLE_RISK_FLAG_DEFS[answers.role]) {
    const f = itemFraction(
      answers[def.triggerItemId] as string | undefined,
    );
    if (f === 0) riskFlags.push(def.flag);
  }

  return {
    totalScore,
    tier,
    tierBlurb,
    phases,
    topActions,
    riskFlags,
  };
}

function scorePhase(
  id: PhaseId,
  items: PhaseItemDef[],
  answers: OnboardingAnswers,
): PhaseScore {
  let creditSum = 0;
  let applicableCount = 0;
  let fullCreditCount = 0;
  let naCount = 0;

  for (const item of items) {
    const raw = answers[item.id] as string | undefined;
    const f = itemFraction(raw);
    if (f === null) {
      naCount += 1;
      continue;
    }
    applicableCount += 1;
    creditSum += f;
    if (f === 1) fullCreditCount += 1;
  }

  const fraction =
    applicableCount === 0 ? 1 : creditSum / applicableCount;
  const weight = PHASE_WEIGHTS[id];
  const points = weight * fraction * 100;
  const maxPoints = weight * 100;

  let status: PhaseScore["status"];
  if (applicableCount === 0 || fraction >= 0.9) status = "complete";
  else if (fraction >= 0.5) status = "partial";
  else status = "incomplete";

  return {
    id,
    label: PHASE_LABELS[id],
    weight,
    fraction,
    points,
    maxPoints,
    applicableCount,
    fullCreditCount,
    naCount,
    status,
  };
}

function phaseOrder(id: PhaseId): number {
  const order: PhaseId[] = [
    "access",
    "concepts",
    "role",
    "tools",
    "process",
    "integrations",
    "reporting",
    "adoption",
  ];
  return order.indexOf(id);
}

function tierFor(score: number): Tier {
  if (score >= 80) return "Ready";
  if (score >= 50) return "Mostly Ready";
  if (score >= 20) return "Gaps";
  return "Critical Gaps";
}

const TIER_BLURBS: Record<Tier, string> = {
  Ready:
    "Onboarding is in good shape. Keep the day-30 adoption check on the calendar and revisit any partial answers before the rep ships at full velocity.",
  "Mostly Ready":
    "The fundamentals are in place but specific gaps will slow the rep down. Close the top three priority items in the first two weeks before they harden into habits.",
  Gaps:
    "The rep is starting with material gaps. Without focused remediation, expect data integrity issues, slower ramp, and process workarounds that compound. Address the top three actions immediately.",
  "Critical Gaps":
    "The rep is at high risk of corrupting data or defaulting to spreadsheets. Stop ramp activities and close the access, concepts, and role-specific items before assigning live work.",
};

// ----------------------------------------------------------------- labels

export const ROLE_LABELS: Record<Role, string> = {
  sdr_bdr: "SDR / BDR",
  ae: "Account Executive",
  marketing_ops: "Marketing Ops",
  cs_am: "CS / Account Manager",
  revops_admin: "RevOps Admin",
};

export const ANSWER_LABELS = {
  seatType: { yes: "Yes", not_sure: "Not sure", no: "No" },
  permSet: {
    yes: "Yes",
    individual: "Using individual permissions",
    no: "No",
  },
  propertyPerms: { yes: "Yes", no: "No", unsure: "Unsure" },
  teamAssign: { yes: "Yes", na: "N/A", no: "No" },
  yesNo: { yes: "Yes", no: "No" },
  notif: { yes: "Yes", defaults: "Using defaults", no: "No" },
  triState: { yes: "Yes", partial: "Partial", no: "No" },
  yesNoUnsure: { yes: "Yes", no: "No", unsure: "Unsure" },
  toolFull: { yes: "Yes", partial: "Partial", no: "No", na: "N/A" },
  toolBinary: { yes: "Yes", no: "No", na: "N/A" },
  activityLog: { yes: "Yes", verbal: "Verbal only", no: "No" },
  integration: {
    yes: "Yes",
    not_applicable: "Not applicable",
    not_yet: "Not yet",
  },
  goals: {
    yes: "Yes",
    not_applicable: "Not applicable",
    no: "No",
  },
  dailyActive: { yes: "Yes", mostly: "Mostly", no: "No" },
  firstDeal: {
    yes: "Yes",
    not_applicable: "Not applicable",
    no: "No",
  },
} as const;

export const COMMON_PHASE_ITEMS_PUBLIC = COMMON_PHASE_ITEMS;
export const ROLE_PHASE_ITEMS_PUBLIC = ROLE_PHASE_ITEMS;
export const PHASE_WEIGHTS_PUBLIC = PHASE_WEIGHTS;
export const PHASE_LABELS_PUBLIC = PHASE_LABELS;
