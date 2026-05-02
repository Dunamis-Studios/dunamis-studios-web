"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Free Tools / Handoff Time Calculator.
 *
 * Five inputs, four outputs. Calculation is mirrored on the server in
 * src/app/api/tools/handoff-calculator-report/route.ts so the email
 * the visitor receives uses canonical numbers regardless of any client
 * tampering. Updates run every render via useMemo so the visitor sees
 * the result move while they slide the turnover input.
 *
 * Email capture below the results POSTs to the same route. The handler
 * persists to Redis as source of truth, mirrors to HubSpot Forms with
 * a "Free Tools" tag on notify_interests, and emails the report back.
 */

interface Inputs {
  reps: number;
  dealsPerRepPerQuarter: number;
  handoffHours: number;
  hourlyCost: number;
  turnoverPct: number;
}

interface Results {
  annualDeals: number;
  routineHours: number;
  routineCost: number;
  turnoverHandoffs: number;
  turnoverHours: number;
  turnoverCost: number;
  totalHours: number;
  totalCost: number;
}

const DEFAULTS: Inputs = {
  reps: 10,
  dealsPerRepPerQuarter: 25,
  handoffHours: 2,
  hourlyCost: 75,
  // 30% matches the median annual rep turnover reported across B2B SaaS
  // benchmarks (Bridge Group, Xactly, Ebsta). Visitors with lower-churn
  // teams should slide it down; the calculator updates live.
  turnoverPct: 30,
};

function computeResults(inputs: Inputs): Results {
  const annualDeals = inputs.reps * inputs.dealsPerRepPerQuarter * 4;
  const routineHours = annualDeals * inputs.handoffHours;
  const routineCost = routineHours * inputs.hourlyCost;
  const turnoverHandoffs = Math.round(
    inputs.reps * (inputs.turnoverPct / 100) * inputs.dealsPerRepPerQuarter,
  );
  const turnoverHours = turnoverHandoffs * inputs.handoffHours * 2;
  const turnoverCost = turnoverHours * inputs.hourlyCost;
  return {
    annualDeals,
    routineHours,
    routineCost,
    turnoverHandoffs,
    turnoverHours,
    turnoverCost,
    totalHours: routineHours + turnoverHours,
    totalCost: routineCost + turnoverCost,
  };
}

function fmtUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function fmtHours(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function readHubspotUtk(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function HandoffTimeCalculator() {
  const [inputs, setInputs] = React.useState<Inputs>(DEFAULTS);
  const results = React.useMemo(() => computeResults(inputs), [inputs]);

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <InputsPanel inputs={inputs} setInputs={setInputs} />
      </div>
      <div className="lg:col-span-3 flex flex-col gap-6">
        <ResultsPanel results={results} />
        <DebriefCta />
        <p className="text-xs leading-relaxed text-[var(--fg-subtle)]">
          These are directional estimates based on industry research. Your
          actual numbers will vary.
        </p>
        <EmailCapture inputs={inputs} />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- inputs

function InputsPanel({
  inputs,
  setInputs,
}: {
  inputs: Inputs;
  setInputs: React.Dispatch<React.SetStateAction<Inputs>>;
}) {
  const update = <K extends keyof Inputs>(key: K, value: Inputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Your inputs
      </div>
      <div className="mt-5 flex flex-col gap-5">
        <NumberField
          id="calc-reps"
          label="Number of sales reps"
          value={inputs.reps}
          min={1}
          step={1}
          onChange={(v) => update("reps", v)}
        />
        <NumberField
          id="calc-deals"
          label="Average deals per rep per quarter"
          value={inputs.dealsPerRepPerQuarter}
          min={1}
          step={1}
          onChange={(v) => update("dealsPerRepPerQuarter", v)}
        />
        <NumberField
          id="calc-hours"
          label="Average time per handoff (hours)"
          value={inputs.handoffHours}
          min={0.25}
          step={0.25}
          onChange={(v) => update("handoffHours", v)}
        />
        <NumberField
          id="calc-cost"
          label="Average rep hourly cost (USD)"
          hint="Default $75 assumes $150K total comp divided by 2,000 work hours"
          value={inputs.hourlyCost}
          min={1}
          step={1}
          prefix="$"
          onChange={(v) => update("hourlyCost", v)}
        />
        <SliderField
          id="calc-turnover"
          label="Annual rep turnover rate"
          value={inputs.turnoverPct}
          min={0}
          max={100}
          step={1}
          suffix="%"
          onChange={(v) => update("turnoverPct", v)}
        />
      </div>
    </div>
  );
}

interface NumberFieldProps {
  id: string;
  label: string;
  hint?: string;
  value: number;
  min?: number;
  step?: number;
  prefix?: string;
  onChange: (value: number) => void;
}

function NumberField({
  id,
  label,
  hint,
  value,
  min,
  step,
  prefix,
  onChange,
}: NumberFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">{hint}</p>
      ) : null}
      <div className="relative mt-1.5">
        {prefix ? (
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--fg-subtle)]"
          >
            {prefix}
          </span>
        ) : null}
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => {
            const raw = e.target.value;
            const parsed = raw === "" ? 0 : Number(raw);
            if (Number.isNaN(parsed)) return;
            onChange(parsed);
          }}
          className={cn(prefix && "pl-7")}
        />
      </div>
    </div>
  );
}

interface SliderFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}

function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: SliderFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="font-mono text-sm text-[var(--fg)]">
          {value}
          {suffix ?? ""}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--border)] accent-[var(--accent)]"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}

// ----------------------------------------------------------------- results

function ResultsPanel({ results }: { results: Results }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Your annual handoff cost
      </div>
      <div className="mt-3 font-[var(--font-display)] text-4xl font-medium tracking-tight text-[var(--fg)] sm:text-5xl">
        {fmtUsd(results.totalCost)}
      </div>
      <p className="mt-2 text-sm text-[var(--fg-muted)]">
        Across {results.annualDeals.toLocaleString("en-US")} deals per year and{" "}
        {results.turnoverHandoffs.toLocaleString("en-US")} reassigned books
        from rep turnover.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Routine handoff hours / year"
          value={`${fmtHours(results.routineHours)} hrs`}
        />
        <StatCard
          label="Routine handoff cost / year"
          value={fmtUsd(results.routineCost)}
        />
        <StatCard
          label="Hours lost to owner-change"
          value={`${fmtHours(results.turnoverHours)} hrs`}
          tone="accent"
        />
      </div>

      <div className="mt-6 space-y-3 text-xs leading-relaxed text-[var(--fg-subtle)]">
        <p>
          <span className="font-medium text-[var(--fg-muted)]">
            Industry sourcing.
          </span>{" "}
          B2B SaaS sales rep turnover averages 30 to 36 percent annually
          (Bridge Group, Xactly, Ebsta). Sales reps spend about 28 percent of
          their time actively selling, with the rest on admin and ramp work
          (Salesforce State of Sales 2024). Account research alone runs 1 to
          3 hours per account on the receiving end (Salesmotion).
        </p>
        <p>
          <span className="font-medium text-[var(--fg-muted)]">
            Our model assumptions.
          </span>{" "}
          Two hours per handoff is our working estimate for synthesized
          handoff time, not a published benchmark. The 2x penalty on cold
          reassignments is our assumption based on the new owner starting
          from zero context, not published data. Slide either input to match
          your team and the output recalculates.
        </p>
      </div>

      <details className="group mt-5 rounded-lg border border-[var(--border)] bg-[var(--bg)] open:bg-[var(--bg-elevated)]">
        <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-[var(--fg)] [&::-webkit-details-marker]:hidden">
          <span>How we calculated this</span>
          <span
            aria-hidden
            className="text-xs text-[var(--fg-subtle)] transition-transform duration-150 group-open:rotate-90"
          >
            &#9656;
          </span>
        </summary>
        <div className="border-t border-[var(--border)] px-4 py-4">
          <ol className="list-decimal space-y-1.5 pl-5 font-mono text-xs leading-relaxed text-[var(--fg-muted)]">
            <li>
              annual_deals = reps {"×"} deals_per_rep_per_quarter {"×"} 4
            </li>
            <li>
              routine_hours = annual_deals {"×"} hours_per_handoff
            </li>
            <li>
              routine_cost = routine_hours {"×"} rep_hourly_cost
            </li>
            <li>
              reassigned_books = round(reps {"×"} turnover_pct {"×"} deals_per_rep_per_quarter)
            </li>
            <li>
              cold_hours = reassigned_books {"×"} hours_per_handoff {"×"} 2
            </li>
            <li>
              cold_cost = cold_hours {"×"} rep_hourly_cost
            </li>
            <li>
              total_cost = routine_cost + cold_cost
            </li>
          </ol>
          <p className="mt-3 text-xs leading-relaxed text-[var(--fg-subtle)]">
            The server recomputes from the same formula before saving the
            record or sending the email, so what you see here is what gets
            captured. Plug your own values into a spreadsheet to verify.
          </p>
        </div>
      </details>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "accent";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        tone === "accent"
          ? "border-[color-mix(in_oklch,var(--color-brand-500)_40%,transparent)] bg-[color-mix(in_oklch,var(--color-brand-500)_8%,transparent)]"
          : "border-[var(--border)] bg-[var(--bg)]",
      )}
    >
      <div className="text-xs text-[var(--fg-muted)]">{label}</div>
      <div className="mt-1.5 font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
        {value}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- cta

function DebriefCta() {
  return (
    <Link
      href="/products/debrief"
      className="group flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 transition-colors hover:border-[var(--border-strong)]"
    >
      <div>
        <div className="text-sm font-medium text-[var(--fg)]">
          Debrief automates this.
        </div>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Inheritance briefs on every CRM record when ownership changes. Free
          during marketplace beta.
        </p>
      </div>
      <ArrowUpRight
        className="h-5 w-5 shrink-0 text-[var(--fg-subtle)] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--fg)]"
        aria-hidden
      />
    </Link>
  );
}

// ----------------------------------------------------------------- email

type EmailStatus = "idle" | "submitting" | "success" | "error";

function EmailCapture({ inputs }: { inputs: Inputs }) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<EmailStatus>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const hubspotutk = readHubspotUtk();
      const res = await fetch("/api/tools/handoff-calculator-report", {
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
          // fall through to default
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
        We&apos;ll send a clean PDF-style breakdown of your inputs and results.
        Optional. The calculator works without it.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="calc-email" className="sr-only">
          Email address
        </label>
        <Input
          id="calc-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting"}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={status === "submitting"}
          aria-disabled={status === "submitting"}
        >
          {status === "submitting" ? "Sending..." : "Email it"}
          {status === "submitting" ? null : (
            <ArrowRight className="ml-0.5 h-4 w-4" aria-hidden />
          )}
        </Button>
      </form>
      {status === "error" && errorMessage ? (
        <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
