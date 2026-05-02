"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Mail,
  Plus,
  TrendingDown,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  REVENUE_LABELS,
  USAGE_LABELS,
  computeTechStackCostAudit,
  fmtUsd,
  spendStatusLabel,
  toolCountStatusLabel,
  type OverlapCategory,
  type RevenueRange,
  type TechStackCostAuditInputs,
  type TechStackCostAuditResults,
  type Tool,
  type ToolCategory,
  type ToolFinancials,
  type UsageLevel,
} from "@/lib/tech-stack-cost-audit-logic";

/**
 * Free Tools / Tech Stack Cost Audit.
 *
 * Dynamic list builder: visitor adds tools, picks a category and
 * usage level, and immediately sees their annual SaaS spend, license
 * waste estimate, overlap detection, and the top three consolidation
 * opportunities. Mirrored on the server via the same shared lib.
 */

const CATEGORY_OPTIONS: { value: ToolCategory; label: string }[] = (
  Object.keys(CATEGORY_LABELS) as ToolCategory[]
).map((value) => ({ value, label: CATEGORY_LABELS[value] }));

const USAGE_OPTIONS: { value: UsageLevel; label: string }[] = (
  Object.keys(USAGE_LABELS) as UsageLevel[]
).map((value) => ({ value, label: USAGE_LABELS[value] }));

const REVENUE_OPTIONS: { value: RevenueRange; label: string }[] = (
  Object.keys(REVENUE_LABELS) as RevenueRange[]
).map((value) => ({ value, label: REVENUE_LABELS[value] }));

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function emptyTool(): Tool {
  return {
    id: uid(),
    name: "",
    category: "crm",
    costPerSeat: 0,
    seats: 1,
    usageLevel: "daily",
  };
}

function readHubspotUtk(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function TechStackCostAudit() {
  const [teamSize, setTeamSize] = React.useState(50);
  const [revenueRange, setRevenueRange] =
    React.useState<RevenueRange>("1_10m");
  const [tools, setTools] = React.useState<Tool[]>(() => [emptyTool()]);

  const inputs: TechStackCostAuditInputs = React.useMemo(
    () => ({ tools, teamSize, revenueRange }),
    [tools, teamSize, revenueRange],
  );
  const results = React.useMemo(
    () => computeTechStackCostAudit(inputs),
    [inputs],
  );

  const updateTool = (id: string, partial: Partial<Tool>) => {
    setTools((prev) => prev.map((t) => (t.id === id ? { ...t, ...partial } : t)));
  };

  const addTool = () => {
    setTools((prev) => [...prev, emptyTool()]);
  };

  const removeTool = (id: string) => {
    setTools((prev) => (prev.length === 1 ? prev : prev.filter((t) => t.id !== id)));
  };

  const hasAnyTool = results.totalToolCount > 0;

  return (
    <div className="flex flex-col gap-6">
      <TeamProfile
        teamSize={teamSize}
        revenueRange={revenueRange}
        onTeamSizeChange={setTeamSize}
        onRevenueChange={setRevenueRange}
      />

      <ToolsList
        tools={tools}
        onUpdate={updateTool}
        onRemove={removeTool}
        onAdd={addTool}
        canRemove={tools.length > 1}
      />

      {hasAnyTool ? (
        <ResultsPanel inputs={inputs} results={results} />
      ) : (
        <EmptyResults />
      )}

      <Methodology />

      <EmailCapture inputs={inputs} disabled={!hasAnyTool} />
    </div>
  );
}

// ----------------------------------------------------------------- team profile

function TeamProfile({
  teamSize,
  revenueRange,
  onTeamSizeChange,
  onRevenueChange,
}: {
  teamSize: number;
  revenueRange: RevenueRange;
  onTeamSizeChange: (v: number) => void;
  onRevenueChange: (v: RevenueRange) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Team profile
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="tsa-team-size">Total team size</Label>
          <Input
            id="tsa-team-size"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={Number.isFinite(teamSize) ? teamSize : ""}
            onChange={(e) => {
              const raw = e.target.value;
              const n = raw === "" ? 0 : Number(raw);
              if (Number.isNaN(n)) return;
              onTeamSizeChange(n);
            }}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="tsa-revenue">Annual revenue range</Label>
          <NativeSelect
            id="tsa-revenue"
            value={revenueRange}
            onChange={(v) => onRevenueChange(v as RevenueRange)}
            options={REVENUE_OPTIONS}
            className="mt-1.5"
          />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- tools list

function ToolsList({
  tools,
  onUpdate,
  onRemove,
  onAdd,
  canRemove,
}: {
  tools: Tool[];
  onUpdate: (id: string, partial: Partial<Tool>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Your tools
          </div>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">
            Add every SaaS tool your sales, marketing, and operations teams
            pay for. Per-seat cost goes in monthly. Usage level is your best
            guess if you don&apos;t have utilization data handy.
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={onAdd}>
          <Plus className="h-4 w-4" aria-hidden />
          Add tool
        </Button>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {tools.map((tool, idx) => (
          <ToolRow
            key={tool.id}
            index={idx + 1}
            tool={tool}
            onChange={(partial) => onUpdate(tool.id, partial)}
            onRemove={() => onRemove(tool.id)}
            canRemove={canRemove}
          />
        ))}
      </div>

      <div className="mt-5">
        <Button
          type="button"
          variant="secondary"
          onClick={onAdd}
          className="w-full justify-center"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add another tool
        </Button>
      </div>
    </div>
  );
}

function ToolRow({
  index,
  tool,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  tool: Tool;
  onChange: (partial: Partial<Tool>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const idBase = `tsa-tool-${tool.id}`;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] font-mono text-[10px] text-[var(--fg-muted)]"
          >
            {index}
          </span>
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Tool {index}
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Remove tool ${index}`}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md border text-[var(--fg-muted)] transition-colors",
            canRemove
              ? "border-[var(--border)] hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]"
              : "border-[var(--border)] opacity-30 cursor-not-allowed",
          )}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-12">
        <div className="sm:col-span-7">
          <Label htmlFor={`${idBase}-name`} className="text-xs">
            Name
          </Label>
          <Input
            id={`${idBase}-name`}
            type="text"
            placeholder="e.g. HubSpot Marketing Hub"
            value={tool.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-5">
          <Label htmlFor={`${idBase}-cat`} className="text-xs">
            Category
          </Label>
          <NativeSelect
            id={`${idBase}-cat`}
            value={tool.category}
            onChange={(v) => onChange({ category: v as ToolCategory })}
            options={CATEGORY_OPTIONS}
            className="mt-1"
          />
        </div>

        <div className="sm:col-span-4">
          <Label htmlFor={`${idBase}-cost`} className="text-xs">
            Cost per seat / month
          </Label>
          <div className="relative mt-1">
            <span
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--fg-subtle)]"
            >
              $
            </span>
            <Input
              id={`${idBase}-cost`}
              type="number"
              inputMode="decimal"
              min={0}
              step={1}
              value={Number.isFinite(tool.costPerSeat) ? tool.costPerSeat : ""}
              onChange={(e) => {
                const raw = e.target.value;
                const n = raw === "" ? 0 : Number(raw);
                if (Number.isNaN(n)) return;
                onChange({ costPerSeat: n });
              }}
              className="pl-7"
            />
          </div>
        </div>
        <div className="sm:col-span-3">
          <Label htmlFor={`${idBase}-seats`} className="text-xs">
            Seats
          </Label>
          <Input
            id={`${idBase}-seats`}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={Number.isFinite(tool.seats) ? tool.seats : ""}
            onChange={(e) => {
              const raw = e.target.value;
              const n = raw === "" ? 0 : Number(raw);
              if (Number.isNaN(n)) return;
              onChange({ seats: n });
            }}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-5">
          <Label htmlFor={`${idBase}-usage`} className="text-xs">
            Usage level
          </Label>
          <NativeSelect
            id={`${idBase}-usage`}
            value={tool.usageLevel}
            onChange={(v) => onChange({ usageLevel: v as UsageLevel })}
            options={USAGE_OPTIONS}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- native select

interface NativeSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

function NativeSelect({
  id,
  value,
  onChange,
  options,
  className,
}: NativeSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-10 w-full rounded-md border bg-[var(--bg-elevated)] px-3 pr-8 text-sm text-[var(--fg)] transition-colors outline-none appearance-none",
        "border-[var(--border)] hover:border-[var(--border-strong)]",
        "focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20",
        "bg-no-repeat bg-[length:1em_1em] bg-[position:right_0.6rem_center]",
        "bg-[image:linear-gradient(45deg,transparent_50%,var(--fg-muted)_50%),linear-gradient(135deg,var(--fg-muted)_50%,transparent_50%)]",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)",
        backgroundSize: "5px 5px, 5px 5px",
        backgroundPosition:
          "calc(100% - 18px) calc(50% - 2px), calc(100% - 13px) calc(50% - 2px)",
        backgroundRepeat: "no-repeat",
        color: "var(--fg)",
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ----------------------------------------------------------------- results

function EmptyResults() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Your audit
      </div>
      <p className="mt-3 text-sm text-[var(--fg-muted)]">
        Add at least one tool above to see your annual SaaS spend, license
        waste estimate, overlap detection, and consolidation opportunities.
      </p>
    </div>
  );
}

function ResultsPanel({
  inputs,
  results,
}: {
  inputs: TechStackCostAuditInputs;
  results: TechStackCostAuditResults;
}) {
  return (
    <div className="flex flex-col gap-5">
      <HeadlineCard inputs={inputs} results={results} />
      <ToolCountCard results={results} />
      <ConsolidationsCard results={results} />
      <UnderutilizedCard results={results} />
      <AllToolsCard results={results} />
    </div>
  );
}

function HeadlineCard({
  inputs,
  results,
}: {
  inputs: TechStackCostAuditInputs;
  results: TechStackCostAuditResults;
}) {
  const spendColor =
    results.spendStatus === "above"
      ? "text-[var(--color-danger)]"
      : results.spendStatus === "below"
        ? "text-[var(--color-success)]"
        : "text-[var(--fg)]";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Total annual SaaS spend
      </div>
      <div className="mt-3 font-[var(--font-display)] text-4xl font-medium tracking-tight text-[var(--fg)] sm:text-5xl">
        {fmtUsd(results.totalAnnualSpend)}
      </div>
      <p className="mt-2 text-sm text-[var(--fg-muted)]">
        Across {results.totalToolCount}{" "}
        {results.totalToolCount === 1 ? "tool" : "tools"} and{" "}
        {results.totalSeats.toLocaleString("en-US")} total seats.{" "}
        {fmtUsd(results.totalMonthlySpend)} per month.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat
          label="Spend per employee"
          value={fmtUsd(results.spendPerEmployee)}
          sublabel={`${spendStatusLabel(results.spendStatus)} for ${REVENUE_LABELS[inputs.revenueRange]}`}
          valueClass={spendColor}
        />
        <Stat
          label="Industry benchmark"
          value={fmtUsd(results.benchmarkSpendPerEmployee)}
          sublabel={`Per employee, ${REVENUE_LABELS[inputs.revenueRange]}`}
        />
        <Stat
          label="License waste estimate"
          value={fmtUsd(results.licenseWasteEstimate)}
          sublabel="46% of total spend (Zylo)"
          tone="danger"
        />
      </div>

      {results.totalConsolidationSavings > 0 ? (
        <div className="mt-5 rounded-lg border border-[color-mix(in_oklch,var(--color-success)_35%,transparent)] bg-[color-mix(in_oklch,var(--color-success)_6%,transparent)] p-4">
          <div className="flex items-start gap-3">
            <TrendingDown
              className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]"
              aria-hidden
            />
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--fg)]">
                Up to {fmtUsd(results.totalConsolidationSavings)} in potential
                annual consolidation savings
              </div>
              <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
                Across {results.overlaps.length} overlap{" "}
                {results.overlaps.length === 1 ? "category" : "categories"}.
                See breakdown below.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ToolCountCard({ results }: { results: TechStackCostAuditResults }) {
  const toolColor =
    results.toolCountStatus === "bloated"
      ? "text-[var(--color-danger)]"
      : results.toolCountStatus === "lean"
        ? "text-[var(--color-success)]"
        : "text-[var(--fg)]";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Tool count vs benchmarks
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <Stat
          label="Your tools"
          value={String(results.totalToolCount)}
          sublabel={toolCountStatusLabel(results.toolCountStatus)}
          valueClass={toolColor}
        />
        <Stat
          label="Enterprise avg (Zylo)"
          value={String(results.enterpriseAvgToolCount)}
          sublabel="Across all departments"
        />
        <Stat
          label="Sales-team avg (Cleed)"
          value={`${results.salesTeamAvgLow} to ${results.salesTeamAvgHigh}`}
          sublabel="Sales-only stack"
        />
        <Stat
          label="Consolidated target"
          value={String(results.consolidatedTargetToolCount)}
          sublabel="Cleed leaders"
        />
      </div>
    </div>
  );
}

function ConsolidationsCard({
  results,
}: {
  results: TechStackCostAuditResults;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Top consolidation opportunities
      </div>
      <p className="mt-1 text-xs text-[var(--fg-muted)]">
        Categories where you have two or more tools. Recommended keeper is
        the highest-usage tool. Estimated savings recover 50% of the cost of
        the others.
      </p>

      {results.topConsolidationOpportunities.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--fg-muted)]">
          No overlaps found. Every category has at most one tool.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {results.topConsolidationOpportunities.map((opp, i) => (
            <ConsolidationItem key={opp.category} index={i + 1} opp={opp} />
          ))}
        </div>
      )}

      {results.overlaps.length > results.topConsolidationOpportunities.length ? (
        <p className="mt-4 text-xs text-[var(--fg-subtle)]">
          {results.overlaps.length -
            results.topConsolidationOpportunities.length}{" "}
          additional overlap{" "}
          {results.overlaps.length -
            results.topConsolidationOpportunities.length ===
          1
            ? "category"
            : "categories"}{" "}
          not shown. Email yourself the report below for the full list.
        </p>
      ) : null}
    </div>
  );
}

function ConsolidationItem({
  index,
  opp,
}: {
  index: number;
  opp: OverlapCategory;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-[var(--fg)]">
            {index}. {opp.categoryLabel}{" "}
            <span className="font-normal text-[var(--fg-muted)]">
              ({opp.tools.length} tools)
            </span>
          </div>
          <div className="text-xs text-[var(--fg-muted)] mt-0.5">
            Keep <span className="text-[var(--fg)]">{opp.recommendedKeeper}</span>.
            Review {opp.tools.length - 1} other{" "}
            {opp.tools.length - 1 === 1 ? "tool" : "tools"}.
          </div>
        </div>
        <div className="font-mono text-base font-medium text-[var(--color-success)]">
          {fmtUsd(opp.estimatedAnnualSavings)}
        </div>
      </div>

      <ul className="mt-3 flex flex-col divide-y divide-[var(--border)]">
        {opp.tools.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "text-sm",
                  t.name === opp.recommendedKeeper
                    ? "font-medium text-[var(--color-success)]"
                    : "text-[var(--fg)]",
                )}
              >
                {t.name}
                {t.name === opp.recommendedKeeper ? " (keep)" : ""}
              </span>
              <span className="text-xs text-[var(--fg-subtle)]">
                {t.usageLabel}
              </span>
            </div>
            <span className="font-mono text-sm text-[var(--fg-muted)]">
              {fmtUsd(t.annualCost)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UnderutilizedCard({
  results,
}: {
  results: TechStackCostAuditResults;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        Underutilized tools
      </div>
      <p className="mt-1 text-xs text-[var(--fg-muted)]">
        Anything marked Rarely or Unknown. Audit usage data in each
        vendor&apos;s admin console before renewing.
      </p>

      {results.underutilizedTools.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--fg-muted)]">
          None flagged. Every tool has Daily, Weekly, or Monthly usage.
        </p>
      ) : (
        <>
          <ul className="mt-4 flex flex-col divide-y divide-[var(--border)]">
            {results.underutilizedTools.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--fg)]">
                    {t.name}
                  </div>
                  <div className="text-xs text-[var(--fg-subtle)]">
                    {t.categoryLabel} ·{" "}
                    <span className="text-[var(--color-danger)]">
                      {t.usageLabel}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-sm text-[var(--fg-muted)]">
                  {fmtUsd(t.annualCost)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--fg-muted)]">
            Combined annual spend on underutilized tools:{" "}
            <span className="font-mono text-[var(--fg)]">
              {fmtUsd(results.underutilizedAnnualSpend)}
            </span>
            .
          </p>
        </>
      )}
    </div>
  );
}

function AllToolsCard({ results }: { results: TechStackCostAuditResults }) {
  if (results.toolsByAnnualCost.length === 0) return null;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Full tool list (sorted by annual cost)
      </div>
      <ul className="mt-4 flex flex-col divide-y divide-[var(--border)]">
        {results.toolsByAnnualCost.map((t) => (
          <ToolListRow key={t.id} t={t} />
        ))}
      </ul>
    </div>
  );
}

function ToolListRow({ t }: { t: ToolFinancials }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="text-sm font-medium text-[var(--fg)]">{t.name}</div>
        <div className="text-xs text-[var(--fg-subtle)]">
          {t.categoryLabel} · {t.usageLabel}
        </div>
      </div>
      <span className="font-mono text-sm text-[var(--fg-muted)]">
        {fmtUsd(t.annualCost)}
      </span>
    </li>
  );
}

function Stat({
  label,
  value,
  sublabel,
  valueClass,
  tone,
}: {
  label: string;
  value: string;
  sublabel?: string;
  valueClass?: string;
  tone?: "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-[color-mix(in_oklch,var(--color-danger)_30%,transparent)] bg-[color-mix(in_oklch,var(--color-danger)_6%,transparent)]"
      : "border-[var(--border)] bg-[var(--bg)]";
  return (
    <div className={cn("rounded-lg border p-4", toneClass)}>
      <div className="text-xs text-[var(--fg-subtle)]">{label}</div>
      <div
        className={cn(
          "mt-1 font-[var(--font-display)] text-xl font-medium tracking-tight",
          valueClass ??
            (tone === "danger"
              ? "text-[var(--color-danger)]"
              : "text-[var(--fg)]"),
        )}
      >
        {value}
      </div>
      {sublabel ? (
        <div className="mt-0.5 text-xs text-[var(--fg-muted)]">{sublabel}</div>
      ) : null}
    </div>
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
              Spend and tool-count benchmarks.
            </span>{" "}
            Zylo&apos;s 2026 SaaS Management Index reports that enterprise
            organizations average 106 apps and $20.6M in annual SaaS spend,
            with median license utilization at 54%. That means 46% of license
            spend goes unused. BetterCloud reports the same 106 average and
            notes 33% of SaaS portfolios were consolidated in 2025.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Sales-team benchmarks.
            </span>{" "}
            Cleed&apos;s 2026 sales-tech roundup: average sales teams use 10
            to 15 tools, consolidated leaders target 6, consolidated teams
            report 43% higher win rates, and 50% of sellers describe their
            stack as overwhelming.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Consolidation savings.
            </span>{" "}
            Zylo reports typical savings from consolidating overlap categories
            of $477K to $2.8M for mid-market and enterprise teams.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Dunamis model assumptions.
            </span>{" "}
            License waste estimate uses the flat Zylo 46% rate applied to
            total annual spend, not a per-tool calculation, because the
            published benchmark is portfolio-level. Overlap savings keep the
            highest-usage tool in each duplicated category and recover 50% of
            the cost of the others; consolidation never recovers 100% because
            the keeper has to absorb migrated workflows. Underutilized = tools
            marked Rarely or Unknown. Spend-per-employee benchmarks scale down
            from Zylo&apos;s enterprise figure (around $20K per employee at
            $50M+ revenue) to smaller revenue brackets using
            industry-typical SaaS-density observations.
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
  inputs: TechStackCostAuditInputs;
  disabled: boolean;
}) {
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
      const res = await fetch("/api/tools/tech-stack-cost-audit-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          hubspotutk ? { email, inputs, hubspotutk } : { email, inputs },
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
        We&apos;ll send a clean breakdown of your tools, headline spend,
        license waste, consolidation opportunities, and underutilized tools.
        Optional. The audit works without it.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="tsa-email" className="sr-only">
          Email address
        </label>
        <Input
          id="tsa-email"
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
          Add at least one tool above to enable the report.
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
