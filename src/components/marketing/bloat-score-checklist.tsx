"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  scoreBloat_,
  type BloatInputs,
  type BloatResults,
  type BloatTier,
  type CategoryStatus,
} from "@/lib/bloat-score-scoring";

/**
 * Free Tools / HubSpot Bloat Score.
 *
 * Eight inputs (six numeric, two enum) feed a 0 to 100 bloat score
 * where lower is leaner and higher is more bloated. Mirrors the
 * scoring lib's logic for live preview; the server recomputes from
 * the same lib for the canonical value.
 */

type PartialInputs = {
  [K in keyof BloatInputs]: BloatInputs[K] | null;
};

const INITIAL: PartialInputs = {
  contactProperties: null,
  companyProperties: null,
  dealProperties: null,
  activeWorkflows: null,
  activeLists: null,
  totalContacts: null,
  portalAge: null,
  tier: null,
};

function isComplete(p: PartialInputs): p is BloatInputs {
  return (
    p.contactProperties !== null &&
    p.companyProperties !== null &&
    p.dealProperties !== null &&
    p.activeWorkflows !== null &&
    p.activeLists !== null &&
    p.totalContacts !== null &&
    p.portalAge !== null &&
    p.tier !== null
  );
}

function readHubspotUtk(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function BloatScoreChecklist() {
  const [inputs, setInputs] = React.useState<PartialInputs>(INITIAL);

  const results = React.useMemo<BloatResults | null>(() => {
    if (!isComplete(inputs)) return null;
    return scoreBloat_(inputs);
  }, [inputs]);

  const answeredCount = Object.values(inputs).filter((v) => v !== null).length;

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <Inputs inputs={inputs} setInputs={setInputs} />
      </div>
      <div className="lg:col-span-2 flex flex-col gap-6 lg:sticky lg:top-24 lg:h-fit">
        <ResultsPanel results={results} answeredCount={answeredCount} />
        <Methodology />
        <EmailCapture inputs={inputs} disabled={!isComplete(inputs)} />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- inputs

function Inputs({
  inputs,
  setInputs,
}: {
  inputs: PartialInputs;
  setInputs: React.Dispatch<React.SetStateAction<PartialInputs>>;
}) {
  const set = <K extends keyof PartialInputs>(
    key: K,
    value: PartialInputs[K],
  ) => setInputs((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Your portal
      </div>
      <div className="mt-5 flex flex-col gap-7">
        <NumberInput
          number={1}
          id="bs-contact"
          question="Total custom contact properties"
          placeholder="e.g. 240"
          value={inputs.contactProperties}
          onChange={(v) => set("contactProperties", v)}
        />
        <NumberInput
          number={2}
          id="bs-company"
          question="Total custom company properties"
          placeholder="e.g. 60"
          value={inputs.companyProperties}
          onChange={(v) => set("companyProperties", v)}
        />
        <NumberInput
          number={3}
          id="bs-deal"
          question="Total custom deal properties"
          placeholder="e.g. 80"
          value={inputs.dealProperties}
          onChange={(v) => set("dealProperties", v)}
        />
        <NumberInput
          number={4}
          id="bs-workflows"
          question="Total active workflows"
          placeholder="e.g. 75"
          value={inputs.activeWorkflows}
          onChange={(v) => set("activeWorkflows", v)}
        />
        <NumberInput
          number={5}
          id="bs-lists"
          question="Total active lists"
          placeholder="e.g. 200"
          value={inputs.activeLists}
          onChange={(v) => set("activeLists", v)}
        />
        <NumberInput
          number={6}
          id="bs-contacts"
          question="Total contacts in portal"
          placeholder="e.g. 25000"
          value={inputs.totalContacts}
          onChange={(v) => set("totalContacts", v)}
        />
        <RadioInput
          number={7}
          id="bs-age"
          question="Portal age"
          value={inputs.portalAge}
          onChange={(v) => set("portalAge", v)}
          options={[
            { value: "under_1", label: "Under 1 year" },
            { value: "1_3", label: "1 to 3 years" },
            { value: "3_5", label: "3 to 5 years" },
            { value: "5_plus", label: "5+ years" },
          ]}
        />
        <RadioInput
          number={8}
          id="bs-tier"
          question="HubSpot tier"
          value={inputs.tier}
          onChange={(v) => set("tier", v)}
          options={[
            { value: "free", label: "Free" },
            { value: "starter", label: "Starter" },
            { value: "pro", label: "Pro" },
            { value: "enterprise", label: "Enterprise" },
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

function NumberInput({
  number,
  id,
  question,
  placeholder,
  value,
  onChange,
}: {
  number: number;
  id: string;
  question: string;
  placeholder: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <QuestionHeader number={number} id={id} question={question} />
      <div className="mt-3 max-w-[240px]">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder={placeholder}
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

function RadioInput<T extends string>({
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
  results: BloatResults | null;
  answeredCount: number;
}) {
  if (!results) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7 text-center">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          Your bloat score
        </div>
        <div className="mt-3 font-[var(--font-display)] text-4xl font-medium tracking-tight text-[var(--fg-subtle)] sm:text-5xl">
          --<span className="text-2xl text-[var(--fg-subtle)]">/100</span>
        </div>
        <p className="mt-3 text-sm text-[var(--fg-muted)]">
          Fill in all 8 inputs to see your score, breakdown, and top
          concentrations.
        </p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
            style={{ width: `${(answeredCount / 8) * 100}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-xs text-[var(--fg-subtle)]">
          {answeredCount} of 8 filled
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Your bloat score
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="font-[var(--font-display)] text-5xl font-medium tracking-tight text-[var(--fg)]">
          {results.totalScore}
        </div>
        <div className="text-2xl text-[var(--fg-subtle)]">/100</div>
      </div>
      <p className="mt-1 text-xs text-[var(--fg-subtle)]">Lower is leaner</p>
      <div className="mt-3">
        <BloatTierBadge tier={results.tier} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">
        {results.tierBlurb}
      </p>

      <div className="mt-6 border-t border-[var(--border)] pt-5">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          Per-asset breakdown
        </div>
        <div className="mt-4 flex flex-col gap-4">
          {results.breakdown.map((b) => (
            <div key={b.id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-sm font-medium text-[var(--fg)]">
                  {b.label}
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={b.status} />
                  <span className="font-mono text-xs text-[var(--fg-subtle)]">
                    +{Math.round(b.contribution)} pts
                  </span>
                </div>
              </div>
              <div className="text-xs leading-relaxed text-[var(--fg-muted)]">
                {b.current}
              </div>
              <div className="text-xs leading-relaxed text-[var(--fg-subtle)]">
                {b.benchmark}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-[var(--border)] pt-5">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          Top 3 concentrations
        </div>
        <ol className="mt-4 flex flex-col gap-4">
          {results.topConcentrations.map((c, i) => (
            <li key={c.categoryId} className="flex gap-3">
              <span
                aria-hidden
                className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--color-brand-500)_15%,transparent)] font-mono text-xs font-medium text-[var(--color-brand-400)]"
              >
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-medium leading-snug text-[var(--fg)]">
                  {c.title}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--fg-muted)]">
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function BloatTierBadge({ tier }: { tier: BloatTier }) {
  const styles: Record<BloatTier, string> = {
    Lean: "border-[color-mix(in_oklch,var(--color-success)_50%,transparent)] bg-[color-mix(in_oklch,var(--color-success)_15%,transparent)] text-[var(--color-success)]",
    Healthy:
      "border-[color-mix(in_oklch,var(--accent)_50%,transparent)] bg-[color-mix(in_oklch,var(--accent)_15%,transparent)] text-[var(--fg)]",
    Bloated:
      "border-[color-mix(in_oklch,var(--color-danger)_40%,transparent)] bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] text-[var(--fg)]",
    Critical:
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

function StatusPill({ status }: { status: CategoryStatus }) {
  const styles: Record<CategoryStatus, string> = {
    lean: "bg-[color-mix(in_oklch,var(--color-success)_15%,transparent)] text-[var(--color-success)]",
    on: "bg-[var(--bg)] text-[var(--fg-subtle)]",
    heavy:
      "bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] text-[var(--color-danger)]",
    critical:
      "bg-[color-mix(in_oklch,var(--color-danger)_20%,transparent)] text-[var(--color-danger)]",
  };
  const label: Record<CategoryStatus, string> = {
    lean: "Lean",
    on: "On",
    heavy: "Heavy",
    critical: "Critical",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        styles[status],
      )}
    >
      {label[status]}
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
            <span className="font-medium text-[var(--fg)]">
              HubSpot product limits.
            </span>{" "}
            Custom property caps are 10 total on Free and 1,000 per object
            type on Starter, Pro, and Enterprise. Real-world reports place
            the practical ceiling around 1,100 per object before the
            editor blocks new fields. Workflow caps are 300 on Marketing
            Pro and 1,000 on Marketing Enterprise; 400 on Operations Hub
            Starter and 1,100 on Enterprise. Caps are not additive across
            hubs. Active list caps are 25 on Marketing Starter (with 1,000
            static), 1,000 on Pro, and 1,500 active plus 1,500 static on
            Enterprise.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Industry observations from Vantage Point.
            </span>{" "}
            Mid-size portals accumulate 300 to 500+ custom properties
            within 2 years if creation goes unmanaged. Only 30 to 40
            percent of custom properties are actively used in mid-size
            portals.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Dunamis model assumptions.
            </span>{" "}
            A healthy custom property count by portal age: about 50 under
            1 year, 150 at 1 to 3 years, 300 at 3 to 5 years, and 400 at
            5+ years. Bloat weights split 40 percent to properties, 25
            percent to workflows, 20 percent to lists, and 15 percent to
            asset density per contact.
          </p>
        </div>
      </details>
    </div>
  );
}

// ----------------------------------------------------------------- email

type EmailStatus = "idle" | "submitting" | "success" | "error";

function EmailCapture({
  inputs,
  disabled,
}: {
  inputs: PartialInputs;
  disabled: boolean;
}) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<EmailStatus>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting" || disabled) return;
    if (!isComplete(inputs)) return;
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const hubspotutk = readHubspotUtk();
      const res = await fetch("/api/tools/bloat-score-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          hubspotutk
            ? { email, inputs, hubspotutk }
            : { email, inputs },
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
        We&apos;ll send the score, tier, breakdown, and top concentrations.
        Optional. The assessment works without it.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="bloat-email" className="sr-only">
          Email address
        </label>
        <Input
          id="bloat-email"
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
          Finish filling in all 8 inputs to enable the report.
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
