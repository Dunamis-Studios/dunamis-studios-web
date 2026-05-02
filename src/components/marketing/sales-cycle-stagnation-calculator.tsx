"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Mail,
  RotateCcw,
  TrendingDown,
  TrendingUp,
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
  computeSalesCycleStagnation,
  cycleStatusLabel,
  fmtUsd,
  fmtUsdPrecise,
  winRateStatusLabel,
  type SalesCycleStagnationInputs,
  type SalesCycleStagnationResults,
} from "@/lib/sales-cycle-stagnation-logic";

/**
 * Free Tools / Sales Cycle Stagnation Calculator.
 *
 * Nine inputs feed a stalled-pipeline analysis: at-risk dollars,
 * critically-at-risk dollars, daily revenue lost per stalled deal,
 * pipeline velocity, and a deal-size-bracket benchmark comparison.
 * Mirrored on the server via the same shared lib so the email and
 * Redis row hold canonical numbers.
 */

const DEFAULTS: SalesCycleStagnationInputs = {
  avgDealSize: 25000,
  avgCycleLength: 75,
  numStages: 5,
  activeDeals: 50,
  totalPipelineValueOverride: null,
  winRatePct: 25,
  avgStageTimeOverride: null,
  dealsAtRisk: 10,
  dealsCritical: 4,
};

function readHubspotUtk(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function SalesCycleStagnationCalculator() {
  const [inputs, setInputs] = React.useState<SalesCycleStagnationInputs>(DEFAULTS);
  const results = React.useMemo(
    () => computeSalesCycleStagnation(inputs),
    [inputs],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <InputsPanel inputs={inputs} setInputs={setInputs} results={results} />
      </div>
      <div className="lg:col-span-3 flex flex-col gap-6">
        <ResultsPanel inputs={inputs} results={results} />
        <Methodology />
        <EmailCapture inputs={inputs} />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- inputs

function InputsPanel({
  inputs,
  setInputs,
  results,
}: {
  inputs: SalesCycleStagnationInputs;
  setInputs: React.Dispatch<React.SetStateAction<SalesCycleStagnationInputs>>;
  results: SalesCycleStagnationResults;
}) {
  const update = <K extends keyof SalesCycleStagnationInputs>(
    key: K,
    value: SalesCycleStagnationInputs[K],
  ) => setInputs((prev) => ({ ...prev, [key]: value }));

  const autoPipelineValue = inputs.activeDeals * inputs.avgDealSize;
  const autoStageTime =
    inputs.numStages > 0 ? inputs.avgCycleLength / inputs.numStages : 0;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Your pipeline
      </div>

      <SectionHeader>Deal economics</SectionHeader>
      <div className="flex flex-col gap-5">
        <NumberField
          id="scsc-deal-size"
          label="Average deal size"
          prefix="$"
          value={inputs.avgDealSize}
          min={0}
          step={500}
          onChange={(v) => update("avgDealSize", v)}
        />
        <SliderField
          id="scsc-win-rate"
          label="Win rate"
          value={inputs.winRatePct}
          min={0}
          max={100}
          step={1}
          suffix="%"
          onChange={(v) => update("winRatePct", v)}
        />
        <NumberField
          id="scsc-active-deals"
          label="Active deals in pipeline"
          value={inputs.activeDeals}
          min={0}
          step={1}
          onChange={(v) => update("activeDeals", v)}
        />
        <AutoNumberField
          id="scsc-pipeline-value"
          label="Total pipeline value"
          prefix="$"
          step={1000}
          value={inputs.totalPipelineValueOverride}
          autoValue={autoPipelineValue}
          autoLabel={`Auto: ${fmtUsd(autoPipelineValue)} from ${inputs.activeDeals.toLocaleString("en-US")} deals x ${fmtUsd(inputs.avgDealSize)}`}
          onChange={(v) => update("totalPipelineValueOverride", v)}
        />
      </div>

      <SectionHeader>Cycle structure</SectionHeader>
      <div className="flex flex-col gap-5">
        <NumberField
          id="scsc-cycle"
          label="Average sales cycle"
          suffix="days"
          value={inputs.avgCycleLength}
          min={1}
          step={1}
          onChange={(v) => update("avgCycleLength", v)}
        />
        <NumberField
          id="scsc-stages"
          label="Number of pipeline stages"
          value={inputs.numStages}
          min={1}
          step={1}
          onChange={(v) => update("numStages", v)}
        />
        <AutoNumberField
          id="scsc-stage-time"
          label="Average days per stage"
          suffix="days"
          step={0.5}
          value={inputs.avgStageTimeOverride}
          autoValue={autoStageTime}
          autoLabel={`Auto: ${autoStageTime.toFixed(1)} days from ${inputs.avgCycleLength} day cycle / ${inputs.numStages} stages`}
          onChange={(v) => update("avgStageTimeOverride", v)}
        />
      </div>

      <SectionHeader>Stagnation</SectionHeader>
      <div className="flex flex-col gap-5">
        <NumberField
          id="scsc-at-risk"
          label={`Deals stuck for 2x+ stage time (${(results.effectiveStageTime * 2).toFixed(1)}+ days)`}
          hint="Count of deals that have not advanced a stage in twice your average stage time."
          value={inputs.dealsAtRisk}
          min={0}
          step={1}
          onChange={(v) => update("dealsAtRisk", v)}
        />
        <NumberField
          id="scsc-critical"
          label={`Deals stuck for 3x+ stage time (${(results.effectiveStageTime * 3).toFixed(1)}+ days)`}
          hint="Subset of the above. Critical threshold."
          value={inputs.dealsCritical}
          min={0}
          step={1}
          onChange={(v) => update("dealsCritical", v)}
        />
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 mb-4 flex items-center gap-3 first:mt-5">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--fg-subtle)]">
        {children}
      </div>
      <div className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}

// ----------------------------------------------------------------- input fields

interface NumberFieldProps {
  id: string;
  label: string;
  hint?: string;
  value: number;
  min?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
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
  suffix,
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
          className={cn(prefix && "pl-7", suffix && "pr-14")}
        />
        {suffix ? (
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--fg-subtle)]"
          >
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

interface AutoNumberFieldProps {
  id: string;
  label: string;
  prefix?: string;
  suffix?: string;
  step?: number;
  value: number | null;
  autoValue: number;
  autoLabel: string;
  onChange: (value: number | null) => void;
}

function AutoNumberField({
  id,
  label,
  prefix,
  suffix,
  step,
  value,
  autoValue,
  autoLabel,
  onChange,
}: AutoNumberFieldProps) {
  const isAuto = value === null;
  const display = isAuto ? autoValue : value;

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {!isAuto ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            <RotateCcw className="h-3 w-3" aria-hidden />
            Reset to auto
          </button>
        ) : null}
      </div>
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
          min={0}
          step={step}
          value={Number.isFinite(display) ? Number(display.toFixed(2)) : ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onChange(null);
              return;
            }
            const parsed = Number(raw);
            if (Number.isNaN(parsed)) return;
            onChange(parsed);
          }}
          className={cn(prefix && "pl-7", suffix && "pr-14")}
        />
        {suffix ? (
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--fg-subtle)]"
          >
            {suffix}
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-xs text-[var(--fg-subtle)]">
        {isAuto
          ? autoLabel
          : "Override active. Reset to use the auto-calculated value."}
      </p>
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

function ResultsPanel({
  inputs,
  results,
}: {
  inputs: SalesCycleStagnationInputs;
  results: SalesCycleStagnationResults;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          Pipeline value at risk
        </div>
        <div className="mt-3 font-[var(--font-display)] text-4xl font-medium tracking-tight text-[var(--color-danger)] sm:text-5xl">
          {fmtUsd(results.pipelineValueAtRisk)}
        </div>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          Across {inputs.dealsAtRisk.toLocaleString("en-US")} deals stuck for{" "}
          {(results.effectiveStageTime * 2).toFixed(1)}+ days.{" "}
          <span className="text-[var(--color-danger)]">
            {fmtUsd(results.pipelineValueCritical)}
          </span>{" "}
          of that is critically at risk ({inputs.dealsCritical} deals stuck for{" "}
          {(results.effectiveStageTime * 3).toFixed(1)}+ days).
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Daily revenue lost per stalled deal"
            value={fmtUsdPrecise(results.dailyRevenueLostPerStalledDeal)}
          />
          <StatCard
            label="Total daily bleed across stalled deals"
            value={fmtUsdPrecise(results.totalDailyBleed)}
            tone="danger"
          />
        </div>
      </div>

      <VelocityPanel inputs={inputs} results={results} />

      <BracketPanel inputs={inputs} results={results} />
    </div>
  );
}

function VelocityPanel({
  inputs,
  results,
}: {
  inputs: SalesCycleStagnationInputs;
  results: SalesCycleStagnationResults;
}) {
  const above = results.velocityDelta >= 0;
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        {above ? (
          <TrendingUp className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <TrendingDown className="h-3.5 w-3.5" aria-hidden />
        )}
        Pipeline velocity
      </div>
      <p className="mt-2 text-xs text-[var(--fg-subtle)]">
        Active deals x deal size x win rate / cycle length = revenue per day.
        Benchmark holds your deal count and deal size constant; only cycle and
        win rate are swapped to bracket numbers.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Your velocity / day"
          value={fmtUsdPrecise(results.pipelineVelocity)}
        />
        <StatCard
          label={`Benchmark / day (${results.bracketLabel.split(" (")[0]})`}
          value={fmtUsdPrecise(results.benchmarkVelocity)}
        />
        <StatCard
          label="Delta / day"
          value={`${above ? "+" : ""}${fmtUsdPrecise(results.velocityDelta)}`}
          tone={above ? "success" : "danger"}
        />
      </div>

      <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
        <div className="font-mono text-xs text-[var(--fg-muted)]">
          {inputs.activeDeals.toLocaleString("en-US")} deals x{" "}
          {fmtUsd(inputs.avgDealSize)} x {inputs.winRatePct}% /{" "}
          {inputs.avgCycleLength} days ={" "}
          <span className="text-[var(--fg)]">
            {fmtUsdPrecise(results.pipelineVelocity)} / day
          </span>
        </div>
      </div>
    </div>
  );
}

function BracketPanel({
  inputs,
  results,
}: {
  inputs: SalesCycleStagnationInputs;
  results: SalesCycleStagnationResults;
}) {
  const cycleColor =
    results.cycleStatus === "slow"
      ? "text-[var(--color-danger)]"
      : "text-[var(--color-success)]";
  const winRateColor =
    results.winRateStatus === "below"
      ? "text-[var(--color-danger)]"
      : results.winRateStatus === "above"
        ? "text-[var(--color-success)]"
        : "text-[var(--fg)]";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Bracket comparison
      </div>
      <p className="mt-2 text-sm text-[var(--fg-muted)]">
        Based on your average deal size of {fmtUsd(inputs.avgDealSize)}, your
        bracket is{" "}
        <span className="text-[var(--fg)]">{results.bracketLabel}</span>.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Sales cycle
          </div>
          <div className="mt-1.5 font-[var(--font-display)] text-2xl font-medium tracking-tight text-[var(--fg)]">
            {inputs.avgCycleLength}{" "}
            <span className="text-base text-[var(--fg-muted)]">days</span>
          </div>
          <div className="mt-2 text-xs text-[var(--fg-muted)]">
            Benchmark: {results.bracketCycleLow} to {results.bracketCycleHigh}{" "}
            days, median {results.bracketCycleMedian}.
          </div>
          <div className={cn("mt-1 text-xs font-medium", cycleColor)}>
            {cycleStatusLabel(results.cycleStatus)} (
            {results.cycleDeltaDays >= 0 ? "+" : ""}
            {results.cycleDeltaDays} days vs median)
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Win rate
          </div>
          <div className="mt-1.5 font-[var(--font-display)] text-2xl font-medium tracking-tight text-[var(--fg)]">
            {inputs.winRatePct}
            <span className="text-base text-[var(--fg-muted)]">%</span>
          </div>
          <div className="mt-2 text-xs text-[var(--fg-muted)]">
            Benchmark: {results.bracketWinRate}% for this bracket.
          </div>
          <div className={cn("mt-1 text-xs font-medium", winRateColor)}>
            {winRateStatusLabel(results.winRateStatus)} (
            {results.winRateDelta >= 0 ? "+" : ""}
            {results.winRateDelta.toFixed(1)} pts vs benchmark)
          </div>
        </div>
      </div>
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
  tone?: "success" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-[color-mix(in_oklch,var(--color-danger)_40%,transparent)] bg-[color-mix(in_oklch,var(--color-danger)_8%,transparent)]"
      : tone === "success"
        ? "border-[color-mix(in_oklch,var(--color-success)_40%,transparent)] bg-[color-mix(in_oklch,var(--color-success)_8%,transparent)]"
        : "border-[var(--border)] bg-[var(--bg)]";
  const valueClass =
    tone === "danger"
      ? "text-[var(--color-danger)]"
      : tone === "success"
        ? "text-[var(--color-success)]"
        : "text-[var(--fg)]";
  return (
    <div className={cn("rounded-xl border p-4", toneClass)}>
      <div className="text-xs text-[var(--fg-muted)]">{label}</div>
      <div
        className={cn(
          "mt-1.5 font-[var(--font-display)] text-xl font-medium tracking-tight",
          valueClass,
        )}
      >
        {value}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- methodology

function Methodology() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium text-[var(--fg)] [&::-webkit-details-marker]:hidden">
          <span>Where the numbers come from</span>
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
              Cycle benchmarks.
            </span>{" "}
            Optifai&apos;s 2025 sales-cycle benchmark roundup: SMB under $15K
            closes in 14 to 30 days, mid-market $15K to $100K closes in 30 to
            90 days, enterprise $100K+ closes in 90 to 180 days. Overall B2B
            SaaS median is 84 days. Bracket assignment uses your average deal
            size.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Win-rate benchmarks.
            </span>{" "}
            Digital Bloom&apos;s 2025 sales-stats roundup: 35% for SMB, 30% for
            mid-market, 25% for enterprise. These are starting reference points
            for B2B SaaS; mature go-to-market motions in any bracket can run
            higher.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Pipeline velocity formula.
            </span>{" "}
            Opportunities x Deal Size x Win Rate / Cycle Length = Revenue per
            Day. Standard sales operations definition. Benchmark velocity uses
            your active deal count and deal size, swapping in the bracket
            median cycle and bracket benchmark win rate, so the delta isolates
            cycle and win-rate gaps from scale differences.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Dunamis model assumptions.
            </span>{" "}
            2x average stage time is our at-risk threshold; 3x is critical.
            These are heuristics that surface deals worth manually reviewing,
            not statistical cutoffs. Stage time defaults to cycle length
            divided by number of stages, which assumes even time per stage;
            late-funnel stages typically run longer than early-funnel, so
            override with your actual median per-stage time if you have it.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Pipeline value at risk.
            </span>{" "}
            Stalled deal count x deal size x win rate. Each stalled deal is
            counted at its expected value, not gross value, so the figure
            already discounts for the deals that would not have closed
            anyway. The critical figure is a subset of the at-risk figure.
          </p>
        </div>
      </details>
    </div>
  );
}

// ----------------------------------------------------------------- email

type EmailStatus = "idle" | "submitting" | "success" | "error";

function EmailCapture({ inputs }: { inputs: SalesCycleStagnationInputs }) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
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
      const payload: Record<string, unknown> = {
        firstName,
        lastName,
        email,
        inputs,
      };
      if (hubspotutk) payload.hubspotutk = hubspotutk;
      const res = await fetch("/api/tools/sales-cycle-stagnation-report", {
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
            One email with the analysis. No newsletter, no sharing.
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
        We&apos;ll send a clean breakdown of your inputs, results, and
        bracket comparison. Optional. The calculator works without it.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        <LeadNameFields
          idPrefix="scsc"
          firstName={firstName}
          lastName={lastName}
          setFirstName={setFirstName}
          setLastName={setLastName}
          disabled={status === "submitting"}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="scsc-email">
              Email
              <RequiredMark />
            </Label>
            <Input
              id="scsc-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              aria-required="true"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "submitting"}
              className="mt-1.5"
            />
          </div>
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
        </div>
      </form>
      {status === "error" && errorMessage ? (
        <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
