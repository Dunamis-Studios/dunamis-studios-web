/**
 * Pure logic for /tools/custom-object-decision-tree.
 * No side effects, no I/O. Imported by the client component (live
 * traversal) and the API route (canonical evaluation persisted to
 * Redis and mailed in the report).
 *
 * Branching tree that asks at most seven questions and terminates
 * at one of five recommendations: Custom Object, Custom Property,
 * Repurposed Standard Object, HubDB, or Custom Event. Tier
 * eligibility text and red-flag patterns reference HubSpot's KB,
 * Hyphadev, Set2Close, ProfitPad, and RevBlack as cited in the
 * methodology copy.
 */

export type YesNo = "yes" | "no";
export type EventsOrRecords = "events" | "records";
export type YesNoUnsure = "yes" | "no" | "unsure";

export interface DecisionTreeAnswers {
  oneToOne?: YesNo;
  changesFrequently?: YesNo;
  referencedByMultiple?: YesNo;
  multipleInstances?: YesNo;
  ownProperties?: YesNo;
  eventsOrRecords?: EventsOrRecords;
  standardObjectExists?: YesNoUnsure;
  needReportsOrWorkflows?: YesNo;
}

export type QuestionId = "q1" | "q2" | "q2b" | "q3" | "q4" | "q5" | "q6" | "q7";

export type RecommendationKind =
  | "custom_object"
  | "custom_property"
  | "repurposed_standard_object"
  | "hubdb"
  | "custom_event";

export type RecommendationPathTag =
  | "custom_property_volatile"
  | "custom_property_stable_unique"
  | "custom_property_list"
  | "custom_property_fallback"
  | "hubdb"
  | "custom_event"
  | "repurposed_standard_object"
  | "custom_object";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionDef {
  id: QuestionId;
  /** Field on DecisionTreeAnswers this question writes to. */
  field: keyof DecisionTreeAnswers;
  /** Short label for the path-history display. */
  label: string;
  /** Full question text. */
  question: string;
  /** Optional clarifier shown below the question. */
  hint?: string;
  options: QuestionOption[];
}

export interface PathStep {
  questionId: QuestionId;
  questionLabel: string;
  answerValue: string;
  answerLabel: string;
}

export interface Recommendation {
  kind: RecommendationKind;
  pathTag: RecommendationPathTag;
  title: string;
  explanation: string;
  tradeoffs: string[];
  examples: string[];
  implementationPointers: string;
}

export type Evaluation =
  | { status: "asking"; path: PathStep[]; nextQuestion: QuestionDef }
  | { status: "done"; path: PathStep[]; recommendation: Recommendation };

// ----------------------------------------------------------------- questions

export const QUESTIONS: Record<QuestionId, QuestionDef> = {
  q1: {
    id: "q1",
    field: "oneToOne",
    label: "1:1 with parent record",
    question:
      "Does the data exist as a one-to-one relationship with the parent record?",
    hint: "One value per contact, or one row per company. If each parent record holds exactly one of these, answer Yes.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  q2: {
    id: "q2",
    field: "changesFrequently",
    label: "Changes frequently",
    question: "Does the value change frequently?",
    hint: "Dunamis model assumption: frequently = updated more than once per quarter on average.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  q2b: {
    id: "q2b",
    field: "referencedByMultiple",
    label: "Referenced by multiple records",
    question: "Is it referenced by multiple records?",
    hint: "Used in CMS pages, lookup tables, or shared across forms and modules.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  q3: {
    id: "q3",
    field: "multipleInstances",
    label: "Multiple instances per parent",
    question: "Do you need to track multiple instances per parent record?",
    hint: "Dunamis model assumption: multiple = expecting 3+ instances per parent record on average. Patterns like facility_1_address, facility_2_address are the red flag (per Set2Close).",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  q4: {
    id: "q4",
    field: "ownProperties",
    label: "Each instance has own properties",
    question:
      "Does each instance need its own set of properties (dates, status, score, etc.)?",
    hint: "If each instance has its own status, owner, or dates, you need real records, not just a list of values.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  q5: {
    id: "q5",
    field: "eventsOrRecords",
    label: "Events or records",
    question:
      "Are these instances historical events that do not change, or ongoing records that update over time?",
    hint: "Events are immutable once sent (page views, product activations). Records can be edited later (subscriptions, projects, licenses).",
    options: [
      { value: "events", label: "Events (immutable)" },
      { value: "records", label: "Records (ongoing)" },
    ],
  },
  q6: {
    id: "q6",
    field: "standardObjectExists",
    label: "Standard HubSpot object fits",
    question:
      "Does this concept already exist as a standard HubSpot object you could repurpose (Deals, Tickets, Companies)?",
    hint: "Standard objects can be renamed, recolored, and have their property set customized. Repurposing is the Pro-tier workaround for not having Custom Objects.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Unsure" },
    ],
  },
  q7: {
    id: "q7",
    field: "needReportsOrWorkflows",
    label: "Reports or workflows on instances",
    question:
      "Will you need to build reports across many instances, or run workflows on individual instances?",
    hint: "Aggregate views, list filtering by instance properties, or automation triggered by an instance changing.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
};

// ----------------------------------------------------------------- recommendations

const IMPL = {
  custom_object:
    "Requires an Enterprise subscription on any hub: Marketing, Sales, Service, Data, Content, Commerce, or Smart CRM Enterprise. Not available on Pro tiers (HubSpot KB, updated April 28, 2026). If you are on Pro, look at the Repurposed Standard Object recommendation below for the practical workaround.",
  custom_property:
    "Available on all tiers. Free portals are capped at 10 total custom properties; Starter, Pro, and Enterprise are capped at 1,000 per object type.",
  repurposed_standard_object:
    "Available on all tiers. Pro users without Enterprise access can repurpose Companies, Deals, or Tickets (rename, recolor, customize the property set) instead of creating a true custom object. The HubSpot Community has surfaced this as the ongoing Pro-tier workaround across 2025 and 2026; HubSpot has not added Custom Objects to Pro.",
  hubdb:
    "Requires Content Hub Professional or higher. Use for reference and lookup data referenced across CMS pages or rendered in modules. Not relational and not a substitute for a CRM object (per ProfitPad).",
  custom_event:
    "Behavioral events require Marketing Hub Enterprise or Data Hub Enterprise. Custom events are immutable once sent and support multi-occurrence on a single contact (per ProfitPad).",
};

const RECOMMENDATIONS: Record<RecommendationPathTag, Recommendation> = {
  custom_property_volatile: {
    kind: "custom_property",
    pathTag: "custom_property_volatile",
    title: "Use a Custom Property",
    explanation:
      "The data lives one-to-one with the parent record and changes more than once per quarter on average. A custom property is the right home: HubSpot writes are cheap, the value is queryable in lists and reports, and workflows can react to changes immediately. Putting volatile data in HubDB or another lookup table would create extra maintenance every time the value moves.",
    tradeoffs: [
      "Free, simple to set up, easy to filter and report on.",
      "Limited to a single value per record (or a list via multi-checkbox).",
      "No per-record metadata; the value lives directly on the parent.",
    ],
    examples: [
      "Lifecycle stage",
      "Last contact date",
      "Current MRR or ARR",
      "Health score",
    ],
    implementationPointers: IMPL.custom_property,
  },
  custom_property_stable_unique: {
    kind: "custom_property",
    pathTag: "custom_property_stable_unique",
    title: "Use a Custom Property",
    explanation:
      "The data lives one-to-one with the parent record, does not change often, and is not referenced by other records. A custom property is the simplest thing that works. Anything more (HubDB, custom object) would add infrastructure for no payoff.",
    tradeoffs: [
      "Free, simple, fast to set up.",
      "Limited to a single value per record.",
      "If multiple records ever start needing to share or look up the value, revisit the decision (HubDB becomes the better fit).",
    ],
    examples: [
      "Internal account ID",
      "Billing email",
      "License key",
      "Contract end date",
    ],
    implementationPointers: IMPL.custom_property,
  },
  hubdb: {
    kind: "hubdb",
    pathTag: "hubdb",
    title: "Use HubDB",
    explanation:
      "The data lives one-to-one with its source, does not change often, and is referenced across multiple records or CMS pages. HubDB is HubSpot's purpose-built lookup table: a single source of truth that pages and modules can read from, with a clean editing surface in the HubSpot UI. ProfitPad calls this the right pattern for reference and lookup data; it is not a substitute for a CRM object.",
    tradeoffs: [
      "Centralized lookup with a single source of truth.",
      "Requires Content Hub Professional or higher.",
      "Not relational. Not a substitute for a CRM object. Not a good fit for data that needs workflow automation.",
      "Read-friendly from CMS pages and modules; harder to feed from CRM workflows.",
    ],
    examples: [
      "Country and state lookup tables",
      "Product catalog rendered in CMS modules",
      "Office or location finder data",
      "Translated copy keyed by locale",
    ],
    implementationPointers: IMPL.hubdb,
  },
  custom_property_list: {
    kind: "custom_property",
    pathTag: "custom_property_list",
    title: "Use a Custom Property (multi-checkbox or comma-separated)",
    explanation:
      "You have multiple instances per parent record, but the instances do not need their own metadata. A multi-checkbox or comma-separated property captures the list without the overhead of a custom object. This is the most common case where teams over-build: if all you need is a list of tags, a list property is the right tool.",
    tradeoffs: [
      "Free, simple, easy to filter on with list-membership operators.",
      "No per-instance metadata. If you ever need a status or owner per instance, you have to migrate to a custom object.",
      "Reports cannot break down by instance count; only by presence/absence of values in the list.",
    ],
    examples: [
      "Tags or topic interests",
      "Certifications held",
      "Product interests across a catalog",
      "Languages spoken",
    ],
    implementationPointers: IMPL.custom_property,
  },
  custom_event: {
    kind: "custom_event",
    pathTag: "custom_event",
    title: "Use a Custom Event",
    explanation:
      "Each instance is a historical event that should not change after it happens, and you need many of them per contact. Custom events are HubSpot's purpose-built primitive for behavioral analytics: immutable, multi-occurrence on a single contact, and feed reports and segmentation. Per ProfitPad, the right red flag is that you are talking about something that happened (a page view, a product activation, an in-app action), not something that is.",
    tradeoffs: [
      "Behavioral analytics, immutable timeline, scales to millions of events per contact.",
      "Requires Marketing Hub Enterprise or Data Hub Enterprise.",
      "Immutable once sent. No edits. No workflows on individual events.",
      "Not designed for ongoing record management (status changes, owner reassignment).",
    ],
    examples: [
      "Page views and form views",
      "Product activations or feature first-use",
      "In-app actions (button clicks, page navigations)",
      "Marketing-side touchpoints not captured by HubSpot natively",
    ],
    implementationPointers: IMPL.custom_event,
  },
  repurposed_standard_object: {
    kind: "repurposed_standard_object",
    pathTag: "repurposed_standard_object",
    title: "Repurpose a Standard Object",
    explanation:
      "You need real records with their own properties, but the concept overlaps closely with a standard HubSpot object (Deals, Tickets, or Companies). Repurposing reuses HubSpot's full reporting, automation, and association infrastructure without requiring an Enterprise subscription. This is the Pro-tier path: rename the object, recolor it, customize the property set. The HubSpot Community has surfaced this as the standard workaround across 2025 and 2026.",
    tradeoffs: [
      "Available on all tiers, including Pro.",
      "Reuses standard reporting, automation, and association infrastructure.",
      "Object name and semantics may feel forced to non-CRM users.",
      "Limited to renaming and property customization; you cannot change the core object behavior.",
      "If you need genuinely novel object behavior, Custom Object on Enterprise is still the better fit.",
    ],
    examples: [
      "Track service contracts using Tickets",
      "Manage subscriptions using Deals",
      "Treat partners as a renamed Company type",
      "Use Tickets as a unified inquiry log",
    ],
    implementationPointers: IMPL.repurposed_standard_object,
  },
  custom_object: {
    kind: "custom_object",
    pathTag: "custom_object",
    title: "Use a Custom Object",
    explanation:
      "You need real records with their own properties, no standard HubSpot object cleanly fits the concept, and you need cross-instance reporting or per-instance workflow automation. A custom object is the right primitive: full schema flexibility, real reporting, workflow triggers on individual records, and association with standard objects. RevBlack lists Licenses, Shipments, Partners, and Projects as well-designed examples.",
    tradeoffs: [
      "Full flexibility on schema, properties, and associations.",
      "Real reporting across instances and workflow triggers per record.",
      "Requires Enterprise on any hub. Not available on Pro tiers.",
      "Schema design matters; harder to migrate later. Get the property set right at the start.",
      "Hyphadev notes custom objects are also the right answer for many-to-many relationships that custom properties cannot support.",
    ],
    examples: [
      "Licenses (per RevBlack)",
      "Shipments",
      "Partners",
      "Projects",
      "Subscriptions",
      "Vehicles, Equipment, Properties (real estate)",
    ],
    implementationPointers: IMPL.custom_object,
  },
  custom_property_fallback: {
    kind: "custom_property",
    pathTag: "custom_property_fallback",
    title: "Use a Custom Property (lightweight)",
    explanation:
      "You have multiple instances per parent record, each with its own metadata, and they are records (not events). But no standard object cleanly fits, and you do not need cross-instance reporting or per-instance workflow automation. A custom property capturing a structured note (or a small set of properties on the parent) is the lightest path. If you find later that you need real reporting or workflows on individual instances, the answer becomes Custom Object (Enterprise) or Repurposed Standard Object (Pro).",
    tradeoffs: [
      "Free, simple, no Enterprise tier required.",
      "No per-instance reporting. No per-instance workflows.",
      "Tends to drift toward the facility_1_address red flag (per Set2Close) if the count grows. Re-evaluate once instances exceed 3 to 5 per parent.",
    ],
    examples: [
      "A small notes field summarizing a few attached items",
      "A single most-recent-instance property when full history is not needed",
    ],
    implementationPointers: IMPL.custom_property,
  },
};

// ----------------------------------------------------------------- traversal

function makeStep(
  questionId: QuestionId,
  answerValue: string,
): PathStep {
  const q = QUESTIONS[questionId];
  const opt = q.options.find((o) => o.value === answerValue);
  return {
    questionId,
    questionLabel: q.label,
    answerValue,
    answerLabel: opt?.label ?? answerValue,
  };
}

export function evaluateTree(answers: DecisionTreeAnswers): Evaluation {
  const path: PathStep[] = [];

  // Q1
  if (!answers.oneToOne) {
    return { status: "asking", path, nextQuestion: QUESTIONS.q1 };
  }
  path.push(makeStep("q1", answers.oneToOne));

  if (answers.oneToOne === "yes") {
    return evaluateQ2Chain(answers, path);
  }

  // Q3
  if (!answers.multipleInstances) {
    return { status: "asking", path, nextQuestion: QUESTIONS.q3 };
  }
  path.push(makeStep("q3", answers.multipleInstances));

  if (answers.multipleInstances === "no") {
    return evaluateQ2Chain(answers, path);
  }

  // Q4
  if (!answers.ownProperties) {
    return { status: "asking", path, nextQuestion: QUESTIONS.q4 };
  }
  path.push(makeStep("q4", answers.ownProperties));

  if (answers.ownProperties === "no") {
    return {
      status: "done",
      path,
      recommendation: RECOMMENDATIONS.custom_property_list,
    };
  }

  // Q5
  if (!answers.eventsOrRecords) {
    return { status: "asking", path, nextQuestion: QUESTIONS.q5 };
  }
  path.push(makeStep("q5", answers.eventsOrRecords));

  if (answers.eventsOrRecords === "events") {
    return {
      status: "done",
      path,
      recommendation: RECOMMENDATIONS.custom_event,
    };
  }

  // Q6
  if (!answers.standardObjectExists) {
    return { status: "asking", path, nextQuestion: QUESTIONS.q6 };
  }
  path.push(makeStep("q6", answers.standardObjectExists));

  if (answers.standardObjectExists === "yes") {
    return {
      status: "done",
      path,
      recommendation: RECOMMENDATIONS.repurposed_standard_object,
    };
  }

  // Q7 (no or unsure on Q6 both lead here)
  if (!answers.needReportsOrWorkflows) {
    return { status: "asking", path, nextQuestion: QUESTIONS.q7 };
  }
  path.push(makeStep("q7", answers.needReportsOrWorkflows));

  if (answers.needReportsOrWorkflows === "yes") {
    return {
      status: "done",
      path,
      recommendation: RECOMMENDATIONS.custom_object,
    };
  }

  return {
    status: "done",
    path,
    recommendation: RECOMMENDATIONS.custom_property_fallback,
  };
}

function evaluateQ2Chain(
  answers: DecisionTreeAnswers,
  path: PathStep[],
): Evaluation {
  if (!answers.changesFrequently) {
    return { status: "asking", path, nextQuestion: QUESTIONS.q2 };
  }
  path.push(makeStep("q2", answers.changesFrequently));

  if (answers.changesFrequently === "yes") {
    return {
      status: "done",
      path,
      recommendation: RECOMMENDATIONS.custom_property_volatile,
    };
  }

  if (!answers.referencedByMultiple) {
    return { status: "asking", path, nextQuestion: QUESTIONS.q2b };
  }
  path.push(makeStep("q2b", answers.referencedByMultiple));

  if (answers.referencedByMultiple === "yes") {
    return {
      status: "done",
      path,
      recommendation: RECOMMENDATIONS.hubdb,
    };
  }

  return {
    status: "done",
    path,
    recommendation: RECOMMENDATIONS.custom_property_stable_unique,
  };
}

export const RECOMMENDATIONS_PUBLIC = RECOMMENDATIONS;

export function recommendationKindLabel(kind: RecommendationKind): string {
  switch (kind) {
    case "custom_object":
      return "Custom Object";
    case "custom_property":
      return "Custom Property";
    case "repurposed_standard_object":
      return "Repurposed Standard Object";
    case "hubdb":
      return "HubDB";
    case "custom_event":
      return "Custom Event";
  }
}
