"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  scoreAudit_,
  type AuditAnswers,
  type AuditResults,
  type Tier,
} from "@/lib/property-audit-scoring";

/**
 * Free Tools / HubSpot Property Audit Checklist.
 *
 * Ten questions scored 0 to 10 each, totaling 0 to 100. Tier label and
 * top-three actions derive from the same pure scoring lib the API
 * route uses for the canonical version. The client preview and the
 * server's stored value match by construction.
 *
 * Score panel is hidden until every question is answered so the
 * visitor does not see a misleading partial score that would scale up
 * as they fill in more inputs.
 */

type PartialAnswers = {
  [K in keyof AuditAnswers]: AuditAnswers[K] | null;
};

const INITIAL: PartialAnswers = {
  customPropertyCount: null,
  portalAge: null,
  namingConvention: null,
  descriptionsFilled: null,
  lastAudit: null,
  lowFillRateCount: null,
  duplicates: null,
  ownersAssigned: null,
  reviewCadence: null,
  pastIncidents: null,
};

function isComplete(p: PartialAnswers): p is AuditAnswers {
  return (
    p.customPropertyCount !== null &&
    p.portalAge !== null &&
    p.namingConvention !== null &&
    p.descriptionsFilled !== null &&
    p.lastAudit !== null &&
    p.lowFillRateCount !== null &&
    p.duplicates !== null &&
    p.ownersAssigned !== null &&
    p.reviewCadence !== null &&
    p.pastIncidents !== null
  );
}

function readHubspotUtk(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function PropertyAuditChecklist() {
  const [answers, setAnswers] = React.useState<PartialAnswers>(INITIAL);

  const results = React.useMemo<AuditResults | null>(() => {
    if (!isComplete(answers)) return null;
    return scoreAudit_(answers);
  }, [answers]);

  const answeredCount = Object.values(answers).filter((v) => v !== null).length;

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <Questions answers={answers} setAnswers={setAnswers} />
      </div>
      <div className="lg:col-span-2 flex flex-col gap-6 lg:sticky lg:top-24 lg:h-fit">
        <ResultsPanel results={results} answeredCount={answeredCount} />
        <Methodology />
        <p className="text-xs leading-relaxed text-[var(--fg-subtle)]">
          Scoring is calibrated against published HubSpot benchmarks and our
          own model assumptions, both detailed in &quot;How we scored
          this&quot; above.
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
        Your portal
      </div>
      <div className="mt-5 flex flex-col gap-7">
        <NumberQuestion
          number={1}
          id="q1"
          question="How many total custom contact properties does your portal have?"
          value={answers.customPropertyCount}
          onChange={(v) => set("customPropertyCount", v)}
        />
        <RadioQuestion
          number={2}
          id="q2"
          question="How long has your HubSpot portal been active?"
          value={answers.portalAge}
          onChange={(v) => set("portalAge", v)}
          options={[
            { value: "under_1", label: "Under 1 year" },
            { value: "1_3", label: "1 to 3 years" },
            { value: "3_5", label: "3 to 5 years" },
            { value: "5_plus", label: "5+ years" },
          ]}
        />
        <RadioQuestion
          number={3}
          id="q3"
          question="Do you have a documented naming convention for custom properties?"
          value={answers.namingConvention}
          onChange={(v) => set("namingConvention", v)}
          options={[
            { value: "yes", label: "Yes" },
            { value: "partial", label: "Partial" },
            { value: "no", label: "No" },
          ]}
        />
        <RadioQuestion
          number={4}
          id="q4"
          question="Do all custom properties have the description field filled out?"
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
          number={5}
          id="q5"
          question="When was your last full property audit?"
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
          number={6}
          id="q6"
          question="How many custom properties have less than 5% fill rate?"
          value={answers.lowFillRateCount}
          onChange={(v) => set("lowFillRateCount", v)}
          options={[
            { value: "dont_know", label: "Don't know" },
            { value: "under_10", label: "Under 10" },
            { value: "10_50", label: "10 to 50" },
            { value: "50_plus", label: "50+" },
          ]}
        />
        <RadioQuestion
          number={7}
          id="q7"
          question="Do you have duplicate properties capturing the same concept?"
          value={answers.duplicates}
          onChange={(v) => set("duplicates", v)}
          options={[
            { value: "no", label: "No" },
            { value: "suspect", label: "Suspect we do" },
            { value: "yes", label: "Yes" },
            { value: "many", label: "Many" },
          ]}
        />
        <RadioQuestion
          number={8}
          id="q8"
          question="Are owners assigned per property or property group?"
          value={answers.ownersAssigned}
          onChange={(v) => set("ownersAssigned", v)}
          options={[
            { value: "yes", label: "Yes" },
            { value: "partial", label: "Partial" },
            { value: "no", label: "No" },
          ]}
        />
        <RadioQuestion
          number={9}
          id="q9"
          question="How often are new properties created without review?"
          value={answers.reviewCadence}
          onChange={(v) => set("reviewCadence", v)}
          options={[
            { value: "never", label: "Never" },
            { value: "rarely", label: "Rarely" },
            { value: "often", label: "Often" },
            { value: "no_process", label: "No process" },
          ]}
        />
        <RadioQuestion
          number={10}
          id="q10"
          question="Have you ever had a report break or workflow misfire because of a property change?"
          value={answers.pastIncidents}
          onChange={(v) => set("pastIncidents", v)}
          options={[
            { value: "no", label: "No" },
            { value: "once", label: "Once" },
            { value: "multiple", label: "Multiple times" },
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
          options.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
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
  results: AuditResults | null;
  answeredCount: number;
}) {
  if (!results) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7 text-center">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          Your cleanliness score
        </div>
        <div className="mt-3 font-[var(--font-display)] text-4xl font-medium tracking-tight text-[var(--fg-subtle)] sm:text-5xl">
          --<span className="text-2xl text-[var(--fg-subtle)]">/100</span>
        </div>
        <p className="mt-3 text-sm text-[var(--fg-muted)]">
          Answer all 10 questions to see your score and priority actions.
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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Your cleanliness score
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
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  const styles: Record<Tier, string> = {
    Clean:
      "border-[color-mix(in_oklch,var(--color-success)_50%,transparent)] bg-[color-mix(in_oklch,var(--color-success)_15%,transparent)] text-[var(--color-success)]",
    Drift:
      "border-[color-mix(in_oklch,var(--color-warning,var(--accent))_50%,transparent)] bg-[color-mix(in_oklch,var(--color-warning,var(--accent))_15%,transparent)] text-[var(--fg)]",
    Bloat:
      "border-[color-mix(in_oklch,var(--color-danger)_40%,transparent)] bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] text-[var(--fg)]",
    Crisis:
      "border-[var(--color-danger)] bg-[color-mix(in_oklch,var(--color-danger)_20%,transparent)] text-[var(--color-danger)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider",
        styles[tier],
      )}
    >
      {tier}
    </span>
  );
}

// ----------------------------------------------------------------- methodology

function Methodology() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium text-[var(--fg)] [&::-webkit-details-marker]:hidden">
          <span>How we scored this</span>
          <span
            aria-hidden
            className="text-xs text-[var(--fg-subtle)] transition-transform duration-150 group-open:rotate-90"
          >
            &#9656;
          </span>
        </summary>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--fg-muted)]">
          <p>
            Each of the ten questions contributes 0 to 10 points to a 0 to
            100 score. Higher scores reward documented practice (naming
            conventions, descriptions, owners, review cadence) and active
            hygiene (recent audit, visibility into fill rate, fewer
            duplicates and incidents). Lower scores flag drift and bloat.
          </p>
          <p>
            We surface your three lowest-scoring questions as priority
            actions so the punch list is yours, not generic.
          </p>
          <div className="pt-2">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              Industry sourcing and our model
            </div>
            <p className="mt-2">
              HubSpot&apos;s per-tier custom property cap is 100 to 1,000+
              depending on Hub level (HubSpot product limits docs). That is
              the only published benchmark this scoring leans on. The 50,
              150, and 300 thresholds we use to score property count, the
              5 percent fill-rate cutoff, and the four-tier breakpoints
              (80, 50, 20) are all our model assumptions, not industry
              standards. Adjust your read of the score accordingly.
            </p>
          </div>
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
      const res = await fetch("/api/tools/property-audit-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          hubspotutk
            ? { email, answers, hubspotutk }
            : { email, answers },
        ),
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
            One email with the breakdown. No newsletter, no sharing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--fg)]">
        <Mail className="h-4 w-4" aria-hidden />
        Email me this report
      </div>
      <p className="mt-1 text-xs text-[var(--fg-muted)]">
        We&apos;ll send a clean breakdown of your score, tier, answers, and
        priority actions. Optional. The assessment works without it.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="audit-email" className="sr-only">
          Email address
        </label>
        <Input
          id="audit-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting" || disabled}
          className="flex-1"
        />
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
      </form>
      {disabled && status !== "error" ? (
        <p className="mt-2 text-xs text-[var(--fg-subtle)]">
          Finish the questions to enable the report.
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
