"use client";

import * as React from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Mail,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LeadNameFields,
  RequiredMark,
} from "@/components/marketing/lead-form-fields";
import { cn } from "@/lib/utils";
import {
  evaluateTree,
  recommendationKindLabel,
  type DecisionTreeAnswers,
  type PathStep,
  type QuestionDef,
  type Recommendation,
  type RecommendationKind,
} from "@/lib/custom-object-decision-tree-logic";

/**
 * Free Tools / Custom Object Decision Tree.
 *
 * Branching state machine that asks at most seven questions and
 * terminates at one of five recommendations. Path is rendered as the
 * visitor goes; active question or final recommendation card lives
 * below the path. Mirrored on the server via the same shared lib so
 * the email and Redis row hold canonical evaluations.
 */

function readHubspotUtk(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function CustomObjectDecisionTree() {
  const [answers, setAnswers] = React.useState<DecisionTreeAnswers>({});
  const evaluation = React.useMemo(() => evaluateTree(answers), [answers]);

  const answer = React.useCallback(
    (field: keyof DecisionTreeAnswers, value: string) => {
      setAnswers((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const reset = React.useCallback(() => {
    setAnswers({});
  }, []);

  const truncatePathTo = React.useCallback((stepIndex: number) => {
    setAnswers((prev) => {
      const next: DecisionTreeAnswers = {};
      // Re-walk the existing path up to stepIndex, copying those
      // answers; everything past stepIndex is dropped.
      const evalAt = evaluateTree(prev);
      const path = evalAt.path.slice(0, stepIndex);
      for (const step of path) {
        const field = stepIdToField(step.questionId);
        // Reading from prev preserves the current value for steps we keep.
        const existing = prev[field];
        if (existing !== undefined) {
          // @ts-expect-error - field/value type narrowing matches at runtime
          next[field] = existing;
        }
      }
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PathDisplay
        path={evaluation.path}
        showReset={evaluation.path.length > 0}
        onReset={reset}
        onJumpTo={truncatePathTo}
        terminal={evaluation.status === "done"}
      />

      {evaluation.status === "asking" ? (
        <ActiveQuestion question={evaluation.nextQuestion} onAnswer={answer} />
      ) : (
        <RecommendationCard
          recommendation={evaluation.recommendation}
          onReset={reset}
        />
      )}

      <Methodology />

      <EmailCapture
        answers={answers}
        disabled={evaluation.status !== "done"}
      />
    </div>
  );
}

function stepIdToField(
  questionId: PathStep["questionId"],
): keyof DecisionTreeAnswers {
  switch (questionId) {
    case "q1":
      return "oneToOne";
    case "q2":
      return "changesFrequently";
    case "q2b":
      return "referencedByMultiple";
    case "q3":
      return "multipleInstances";
    case "q4":
      return "ownProperties";
    case "q5":
      return "eventsOrRecords";
    case "q6":
      return "standardObjectExists";
    case "q7":
      return "needReportsOrWorkflows";
  }
}

// ----------------------------------------------------------------- path display

function PathDisplay({
  path,
  showReset,
  onReset,
  onJumpTo,
  terminal,
}: {
  path: PathStep[];
  showReset: boolean;
  onReset: () => void;
  onJumpTo: (stepIndex: number) => void;
  terminal: boolean;
}) {
  if (path.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Decision tree
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
          Answer up to seven questions about how the data relates to its
          parent record, how often it changes, and whether you need real
          reporting on it. The tree branches based on each answer and stops
          at one of five recommendations: Custom Object, Custom Property,
          Repurposed Standard Object, HubDB, or Custom Event.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Your path so far
        </div>
        {showReset ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            <RotateCcw className="h-3 w-3" aria-hidden />
            Start over
          </button>
        ) : null}
      </div>

      <ol className="mt-4 flex flex-col divide-y divide-[var(--border)]">
        {path.map((step, i) => {
          const isLast = i === path.length - 1;
          return (
            <li
              key={`${step.questionId}-${i}`}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span
                aria-hidden
                className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--color-success)_20%,transparent)] text-[var(--color-success)]"
              >
                <Check className="h-3 w-3" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-[var(--fg)]">
                  {step.questionLabel}
                </div>
                <div className="text-xs text-[var(--fg-muted)]">
                  {step.answerLabel}
                </div>
              </div>
              {!terminal || !isLast ? (
                <button
                  type="button"
                  onClick={() => onJumpTo(i)}
                  className="text-xs text-[var(--fg-subtle)] hover:text-[var(--fg)]"
                  aria-label={`Change answer for ${step.questionLabel}`}
                >
                  Edit
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ----------------------------------------------------------------- active question

function ActiveQuestion({
  question,
  onAnswer,
}: {
  question: QuestionDef;
  onAnswer: (field: keyof DecisionTreeAnswers, value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
      <Label
        htmlFor={`q-${question.id}`}
        className="font-[var(--font-display)] text-xl font-medium leading-snug tracking-tight text-[var(--fg)] sm:text-2xl"
      >
        {question.question}
      </Label>
      {question.hint ? (
        <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
          {question.hint}
        </p>
      ) : null}

      <div
        role="radiogroup"
        aria-labelledby={`q-${question.id}`}
        className={cn(
          "mt-5 grid gap-2",
          question.options.length === 3
            ? "sm:grid-cols-3"
            : "sm:grid-cols-2",
        )}
      >
        {question.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={false}
            onClick={() => onAnswer(question.field, opt.value)}
            className={cn(
              "rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3.5 text-left text-sm font-medium text-[var(--fg)] transition-colors",
              "hover:border-[var(--accent)] hover:bg-[color-mix(in_oklch,var(--color-brand-500)_8%,transparent)]",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- recommendation

function RecommendationCard({
  recommendation,
  onReset,
}: {
  recommendation: Recommendation;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[color-mix(in_oklch,var(--color-brand-500)_30%,transparent)] bg-[color-mix(in_oklch,var(--color-brand-500)_5%,transparent)] p-6 sm:p-7">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-brand-400)]">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        Recommendation
      </div>
      <KindBadge kind={recommendation.kind} />
      <h2 className="mt-3 font-[var(--font-display)] text-2xl font-medium leading-tight tracking-tight text-[var(--fg)] sm:text-3xl">
        {recommendation.title}
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-[var(--fg-muted)] sm:text-base">
        {recommendation.explanation}
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Bulleted title="Tradeoffs" items={recommendation.tradeoffs} />
        <Bulleted title="Common examples" items={recommendation.examples} />
      </div>

      <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          Implementation pointers
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
          {recommendation.implementationPointers}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onReset}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          Run the tree again
        </Button>
      </div>
    </div>
  );
}

function KindBadge({ kind }: { kind: RecommendationKind }) {
  return (
    <span className="mt-3 inline-flex items-center rounded-md border border-[color-mix(in_oklch,var(--color-brand-500)_50%,transparent)] bg-[color-mix(in_oklch,var(--color-brand-500)_15%,transparent)] px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-brand-400)]">
      {recommendationKindLabel(kind)}
    </span>
  );
}

function Bulleted({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        {title}
      </div>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm leading-relaxed text-[var(--fg-muted)]"
          >
            <span
              aria-hidden
              className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-[var(--fg-subtle)]"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ----------------------------------------------------------------- methodology

function Methodology() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium text-[var(--fg)] [&::-webkit-details-marker]:hidden">
          <span>Where the recommendations come from</span>
          <span
            aria-hidden
            className="text-xs text-[var(--fg-subtle)] transition-transform duration-150 group-open:rotate-90"
          >
            &#9656;
          </span>
        </summary>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--fg-muted)]">
          <p>
            <span className="font-medium text-[var(--fg)]">
              Tier eligibility.
            </span>{" "}
            HubSpot product KB (custom object availability article, updated
            April 28, 2026): Custom Objects require Enterprise on any hub.
            HubDB requires Content Hub Professional or higher. Behavioral
            and custom events require Marketing Hub Enterprise or Data Hub
            Enterprise.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Structural tests.
            </span>{" "}
            Many-to-many relationships that custom properties cannot support
            is the test from Hyphadev&apos;s Custom Objects walkthrough. The
            facility_1_address, facility_2_address red-flag pattern is from
            Set2Close&apos;s lead-data structure guide. HubDB as
            reference/lookup, custom events as immutable and multi-occurrence,
            are both from ProfitPad&apos;s HubSpot data primitives breakdown.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">Examples.</span>{" "}
            RevBlack&apos;s HubSpot custom object case studies (Licenses,
            Shipments, Partners, Projects).
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Pro-tier workaround.
            </span>{" "}
            Repurposing standard objects (Companies, Deals, Tickets) is the
            consensus pattern across HubSpot Community threads from 2025
            and 2026. HubSpot has not added Custom Objects to Pro despite
            repeated requests.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Dunamis model assumptions.
            </span>{" "}
            Frequently changing = updated more than once per quarter on
            average. Multiple instances = expecting 3+ instances per parent
            record on average. Both are heuristics that surface the
            structural decision; calibrate against your actual usage data
            once it is in HubSpot.
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
  answers: DecisionTreeAnswers;
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
        "/api/tools/custom-object-decision-tree-report",
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
            One email with the recommendation, your path, and the
            implementation pointers. No newsletter, no sharing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--fg)]">
        <Mail className="h-4 w-4" aria-hidden />
        Email me this recommendation
      </div>
      <p className="mt-1 text-xs text-[var(--fg-muted)]">
        We&apos;ll send the recommendation, your path, the tradeoffs and
        examples, and the tier-eligibility pointers. Optional.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        <LeadNameFields
          idPrefix="codt"
          firstName={firstName}
          lastName={lastName}
          setFirstName={setFirstName}
          setLastName={setLastName}
          disabled={status === "submitting" || disabled}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="codt-email">
              Email
              <RequiredMark />
            </Label>
            <Input
              id="codt-email"
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
          Reach a recommendation to enable the report.
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
