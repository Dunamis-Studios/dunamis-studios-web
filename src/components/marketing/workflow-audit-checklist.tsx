"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LeadNameFields,
  RequiredMark,
} from "@/components/marketing/lead-form-fields";
import { cn } from "@/lib/utils";
import {
  capStatusLabel,
  scoreWorkflowAudit_,
  type CapUtilization,
  type Tier,
  type WorkflowAuditAnswers,
  type WorkflowAuditResults,
} from "@/lib/workflow-audit-scoring";

/**
 * Free Tools / Workflow Audit Checklist.
 *
 * Eight scored questions plus two unscored inputs (workflow count and
 * HubSpot tier) feed a 0 to 100 health score and a cap-utilization
 * comparison against the published per-tier active-workflow limit.
 * Mirrored on the server via the same scoring lib so the email and
 * Redis row hold canonical values.
 */

type PartialAnswers = {
  [K in keyof WorkflowAuditAnswers]: WorkflowAuditAnswers[K] | null;
};

const INITIAL: PartialAnswers = {
  totalActiveWorkflows: null,
  tier: null,
  lastAudit: null,
  namingConvention: null,
  teamsAssigned: null,
  descriptionsFilled: null,
  duplicatePropertyWriters: null,
  archivedReferences: null,
  reenrollmentIntent: null,
  recentIncidents: null,
};

function isComplete(p: PartialAnswers): p is WorkflowAuditAnswers {
  return (
    p.totalActiveWorkflows !== null &&
    p.tier !== null &&
    p.lastAudit !== null &&
    p.namingConvention !== null &&
    p.teamsAssigned !== null &&
    p.descriptionsFilled !== null &&
    p.duplicatePropertyWriters !== null &&
    p.archivedReferences !== null &&
    p.reenrollmentIntent !== null &&
    p.recentIncidents !== null
  );
}

function readHubspotUtk(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function WorkflowAuditChecklist() {
  const [answers, setAnswers] = React.useState<PartialAnswers>(INITIAL);

  const results = React.useMemo<WorkflowAuditResults | null>(() => {
    if (!isComplete(answers)) return null;
    return scoreWorkflowAudit_(answers);
  }, [answers]);

  const answeredCount = Object.values(answers).filter(
    (v) => v !== null,
  ).length;

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <Questions answers={answers} setAnswers={setAnswers} />
      </div>
      <div className="lg:col-span-2 flex flex-col gap-6 lg:sticky lg:top-24 lg:h-fit">
        <ResultsPanel results={results} answeredCount={answeredCount} />
        <Methodology />
        <p className="text-xs leading-relaxed text-[var(--fg-subtle)]">
          Tier limits and conflict patterns are pulled from HubSpot&apos;s
          published documentation and HubSpot agency sources, both detailed
          in &quot;Where the benchmarks come from&quot; above.
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
  const set = <K extends keyof PartialAnswers>(
    key: K,
    value: PartialAnswers[K],
  ) => setAnswers((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Your workflows
      </div>
      <div className="mt-5 flex flex-col gap-7">
        <NumberQuestion
          number={1}
          id="wq1"
          question="How many total active workflows does your portal have?"
          value={answers.totalActiveWorkflows}
          onChange={(v) => set("totalActiveWorkflows", v)}
        />
        <RadioQuestion
          number={2}
          id="wq2"
          question="Which HubSpot tier are you on?"
          value={answers.tier}
          onChange={(v) => set("tier", v)}
          options={[
            { value: "marketing_pro", label: "Marketing Pro" },
            { value: "marketing_enterprise", label: "Marketing Enterprise" },
            { value: "ops_starter", label: "Operations Hub Starter" },
            { value: "ops_pro", label: "Operations Hub Pro" },
            { value: "ops_enterprise", label: "Operations Hub Enterprise" },
          ]}
        />
        <RadioQuestion
          number={3}
          id="wq3"
          question="When was your last full workflow audit?"
          value={answers.lastAudit}
          onChange={(v) => set("lastAudit", v)}
          options={[
            { value: "90_days", label: "Within 90 days" },
            { value: "1_year", label: "Within a year" },
            { value: "over_year", label: "Over a year ago" },
            { value: "never", label: "Never" },
          ]}
        />
        <RadioQuestion
          number={4}
          id="wq4"
          question="Do you have a documented naming convention for workflows?"
          value={answers.namingConvention}
          onChange={(v) => set("namingConvention", v)}
          options={[
            { value: "yes", label: "Yes" },
            { value: "partial", label: "Partial" },
            { value: "no", label: "No" },
          ]}
        />
        <RadioQuestion
          number={5}
          id="wq5"
          question="Are workflows assigned to teams (HubSpot's asset-level ownership)?"
          value={answers.teamsAssigned}
          onChange={(v) => set("teamsAssigned", v)}
          options={[
            { value: "yes", label: "Yes" },
            { value: "partial", label: "Partial" },
            { value: "no", label: "No" },
          ]}
        />
        <RadioQuestion
          number={6}
          id="wq6"
          question="How many active workflows have the description field filled out?"
          value={answers.descriptionsFilled}
          onChange={(v) => set("descriptionsFilled", v)}
          options={[
            { value: "all", label: "All" },
            { value: "most", label: "Most" },
            { value: "some", label: "Some" },
            { value: "none", label: "None" },
          ]}
        />
        <RadioQuestion
          number={7}
          id="wq7"
          question="Do you have multiple workflows updating the same property?"
          value={answers.duplicatePropertyWriters}
          onChange={(v) => set("duplicatePropertyWriters", v)}
          options={[
            { value: "no", label: "No" },
            { value: "suspect", label: "Suspect we do" },
            { value: "yes", label: "Yes" },
            { value: "many", label: "Many" },
          ]}
        />
        <RadioQuestion
          number={8}
          id="wq8"
          question="Do you have workflows referencing archived lists or properties?"
          value={answers.archivedReferences}
          onChange={(v) => set("archivedReferences", v)}
          options={[
            { value: "no", label: "No" },
            { value: "suspect", label: "Suspect we do" },
            { value: "yes", label: "Yes" },
            { value: "many", label: "Many" },
          ]}
        />
        <RadioQuestion
          number={9}
          id="wq9"
          question="Is re-enrollment configured intentionally on every active workflow?"
          value={answers.reenrollmentIntent}
          onChange={(v) => set("reenrollmentIntent", v)}
          options={[
            { value: "yes", label: "Yes" },
            { value: "partial", label: "Partial" },
            { value: "no", label: "No" },
            { value: "unsure", label: "Unsure" },
          ]}
        />
        <RadioQuestion
          number={10}
          id="wq10"
          question="Have you had recent incidents (duplicate emails, lead misroutes, broken reports)?"
          value={answers.recentIncidents}
          onChange={(v) => set("recentIncidents", v)}
          options={[
            { value: "none", label: "None" },
            { value: "once", label: "Once" },
            { value: "multiple", label: "Multiple" },
          ]}
        />
      </div>
    </div>
  );
}

function QuestionHeader({
  number,
  id,
  question,
}: {
  number: number;
  id: string;
  question: string;
}) {
  return (
    <Label htmlFor={id} className="flex items-start gap-3">
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] font-mono text-[10px] text-[var(--fg-muted)]"
      >
        {number}
      </span>
      <span className="font-normal leading-relaxed">{question}</span>
    </Label>
  );
}

function NumberQuestion({
  number,
  id,
  question,
  value,
  onChange,
}: {
  number: number;
  id: string;
  question: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <QuestionHeader number={number} id={id} question={question} />
      <div className="mt-3 max-w-[200px]">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder="e.g. 240"
          value={value === null ? "" : value}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onChange(null);
              return;
            }
            const parsed = Number(raw);
            if (Number.isNaN(parsed) || parsed < 0) return;
            onChange(Math.floor(parsed));
          }}
        />
      </div>
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
  value,
  onChange,
  options,
}: {
  number: number;
  id: string;
  question: string;
  value: T | null;
  onChange: (v: T) => void;
  options: RadioOption<T>[];
}) {
  return (
    <div>
      <QuestionHeader number={number} id={id} question={question} />
      <div
        role="radiogroup"
        aria-labelledby={id}
        className={cn(
          "mt-3 grid gap-2",
          options.length === 3
            ? "sm:grid-cols-3"
            : options.length === 5
              ? "sm:grid-cols-2"
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
}: {
  results: WorkflowAuditResults | null;
  answeredCount: number;
}) {
  if (!results) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7 text-center">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          Your workflow health score
        </div>
        <div className="mt-3 font-[var(--font-display)] text-4xl font-medium tracking-tight text-[var(--fg-subtle)] sm:text-5xl">
          --<span className="text-2xl text-[var(--fg-subtle)]">/100</span>
        </div>
        <p className="mt-3 text-sm text-[var(--fg-muted)]">
          Answer all 10 questions to see your score, cap utilization, and
          priority actions.
        </p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
            style={{ width: `${(answeredCount / 10) * 100}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-xs text-[var(--fg-subtle)]">
          {answeredCount} of 10 answered
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          Your workflow health score
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
              <li key={action.questionId} className="flex gap-3">
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

      <CapPanel cap={results.capUtilization} />
    </div>
  );
}

function CapPanel({ cap }: { cap: CapUtilization }) {
  const statusColor =
    cap.status === "critical"
      ? "text-[var(--color-danger)]"
      : cap.status === "approaching"
        ? "text-[#e0a060]"
        : cap.status === "lean"
          ? "text-[var(--color-success)]"
          : "text-[var(--fg)]";
  const fillColor =
    cap.status === "critical"
      ? "var(--color-danger)"
      : cap.status === "approaching"
        ? "#e0a060"
        : "var(--accent)";
  const pct = Math.min(100, cap.utilizationPct);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Active workflow utilization
      </div>
      <p className="mt-1 text-xs text-[var(--fg-muted)]">
        Compared to HubSpot&apos;s published limit for {cap.tierLabel}.
      </p>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <div>
          <span className="font-[var(--font-display)] text-2xl font-medium tracking-tight text-[var(--fg)]">
            {cap.totalActiveWorkflows.toLocaleString("en-US")}
          </span>
          <span className="text-sm text-[var(--fg-muted)]">
            {" "}
            / {cap.activeWorkflowLimit.toLocaleString("en-US")}
          </span>
        </div>
        <div className={cn("text-sm font-medium", statusColor)}>
          {cap.utilizationPct}%
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${pct}%`,
            backgroundColor: fillColor,
          }}
        />
      </div>

      <div className={cn("mt-3 text-sm font-medium", statusColor)}>
        {capStatusLabel(cap.status)}
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  const styles: Record<Tier, string> = {
    Healthy:
      "border-[color-mix(in_oklch,var(--color-success)_50%,transparent)] bg-[color-mix(in_oklch,var(--color-success)_15%,transparent)] text-[var(--color-success)]",
    Drift:
      "border-[var(--border-strong)] bg-[var(--bg)] text-[var(--fg)]",
    Bloat:
      "border-[#b07840] bg-[color-mix(in_oklch,#e0a060_15%,transparent)] text-[#e0a060]",
    Crisis:
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
            <span className="font-medium text-[var(--fg)]">Tier limits.</span>{" "}
            HubSpot&apos;s published product-limits documentation: 300 active
            workflows on Marketing Hub Professional, 1,000 on Marketing Hub
            Enterprise, 400 on Operations Hub Starter, and 1,100 on
            Operations Hub Enterprise. Operations Hub Professional is set to
            1,000 to match the standard mid-tier cap.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Audit cadence.
            </span>{" "}
            Quarterly audit cadence is the consensus across HubSpot agency
            operators (Daeda, JetStack AI, and others). Portals that audit
            annually accumulate drift faster than they can ship new
            automation.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Conflict patterns.
            </span>{" "}
            Lifecycle stage overwrites, re-enrollment loops, conflicting
            delays, and archived list references are documented in
            Daeda&apos;s HubSpot workflow conflict guide and JetStack
            AI&apos;s audit checklist as the top causes of silently-broken
            automation.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Dunamis model assumptions.
            </span>{" "}
            Approaching cap at 80% of tier limit, critical at 95%. Scoring
            weights: ownership and documentation 30% (naming, team
            assignment, descriptions), conflict signals 30% (duplicate
            property writers, archived references, re-enrollment intent),
            audit cadence 20%, recent incidents 20%. Cadence and incidents
            are double-weighted because they correlate with downstream
            impact more reliably than any single hygiene signal. HubSpot
            supports team-level (asset-level) assignment for workflows, not
            per-workflow individual owners, so the team-assignment question
            is what stands in for ownership in the assessment.
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
      const res = await fetch("/api/tools/workflow-audit-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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
            One email with the audit. No newsletter, no sharing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--fg)]">
        <Mail className="h-4 w-4" aria-hidden />
        Email me this audit
      </div>
      <p className="mt-1 text-xs text-[var(--fg-muted)]">
        We&apos;ll send a clean breakdown of your score, cap utilization,
        per-question grade, and prioritized actions. Optional.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        <LeadNameFields
          idPrefix="wac"
          firstName={firstName}
          lastName={lastName}
          setFirstName={setFirstName}
          setLastName={setLastName}
          disabled={status === "submitting" || disabled}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="wac-email">
              Email
              <RequiredMark />
            </Label>
            <Input
              id="wac-email"
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
          Answer all 10 questions to enable the report.
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
