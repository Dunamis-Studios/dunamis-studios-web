"use client";

import * as React from "react";
import { ArrowRight, Check, CheckCircle2, Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  buildLeadScoringModel,
  renderModelAsText,
  type Disqualifier,
  type HighIntentAction,
  type LeadScoringInputs,
  type LeadScoringResults,
  type ScoringRule,
  type TierMapping,
} from "@/lib/lead-scoring-logic";

/**
 * Free Tools / Lead Scoring Builder.
 *
 * Six inputs feed a HubSpot lead-scoring model the visitor can copy
 * directly into Marketing > Lead Scoring. Mirrors the model logic
 * from the scoring lib for live preview; the server rebuilds from
 * the same lib for the canonical version.
 */

type PartialInputs = {
  [K in keyof LeadScoringInputs]: K extends
    | "highIntentActions"
    | "disqualifiers"
    ? LeadScoringInputs[K]
    : LeadScoringInputs[K] | null;
};

const INITIAL: PartialInputs = {
  buyerRole: null,
  companySize: null,
  cycleLength: null,
  highIntentActions: [],
  disqualifiers: [],
  tier: null,
};

function isComplete(p: PartialInputs): p is LeadScoringInputs {
  return (
    p.buyerRole !== null &&
    p.companySize !== null &&
    p.cycleLength !== null &&
    p.tier !== null
  );
}

function readHubspotUtk(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function LeadScoringBuilder() {
  const [inputs, setInputs] = React.useState<PartialInputs>(INITIAL);

  const results = React.useMemo<LeadScoringResults | null>(() => {
    if (!isComplete(inputs)) return null;
    return buildLeadScoringModel(inputs);
  }, [inputs]);

  const requiredCount = 4; // buyerRole + companySize + cycleLength + tier
  const answeredRequired = [
    inputs.buyerRole,
    inputs.companySize,
    inputs.cycleLength,
    inputs.tier,
  ].filter((v) => v !== null).length;

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Inputs inputs={inputs} setInputs={setInputs} />
      </div>
      <div className="lg:col-span-3 flex flex-col gap-6">
        <ResultsPanel
          results={results}
          inputs={inputs}
          answeredRequired={answeredRequired}
          requiredCount={requiredCount}
        />
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

  const toggleAction = (action: HighIntentAction) => {
    setInputs((prev) => {
      const has = prev.highIntentActions.includes(action);
      return {
        ...prev,
        highIntentActions: has
          ? prev.highIntentActions.filter((a) => a !== action)
          : [...prev.highIntentActions, action],
      };
    });
  };

  const toggleDisqualifier = (disq: Disqualifier) => {
    setInputs((prev) => {
      const has = prev.disqualifiers.includes(disq);
      return {
        ...prev,
        disqualifiers: has
          ? prev.disqualifiers.filter((d) => d !== disq)
          : [...prev.disqualifiers, disq],
      };
    });
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Your ICP and funnel
      </div>
      <div className="mt-5 flex flex-col gap-7">
        <RadioInput
          number={1}
          id="ls-role"
          question="Primary buyer role"
          value={inputs.buyerRole}
          onChange={(v) => set("buyerRole", v)}
          options={[
            { value: "vp_c", label: "VP / C-Suite" },
            { value: "director_manager", label: "Director / Manager" },
            { value: "ic", label: "Individual Contributor" },
            { value: "mixed", label: "Mixed seniority" },
          ]}
        />
        <RadioInput
          number={2}
          id="ls-size"
          question="Target company size"
          value={inputs.companySize}
          onChange={(v) => set("companySize", v)}
          options={[
            { value: "under_50", label: "Under 50" },
            { value: "50_250", label: "50 to 250" },
            { value: "250_1000", label: "250 to 1,000" },
            { value: "1000_plus", label: "1,000+" },
          ]}
        />
        <RadioInput
          number={3}
          id="ls-cycle"
          question="Sales cycle length"
          value={inputs.cycleLength}
          onChange={(v) => set("cycleLength", v)}
          options={[
            { value: "under_30", label: "Under 30 days" },
            { value: "30_90", label: "30 to 90 days" },
            { value: "90_180", label: "90 to 180 days" },
            { value: "180_plus", label: "180+ days" },
          ]}
        />
        <MultiSelectInput
          number={4}
          id="ls-actions"
          question="High-intent actions on your site"
          hint="Select every action that signals buying intent for your team."
          values={inputs.highIntentActions}
          onToggle={toggleAction}
          options={[
            { value: "demo_request", label: "Demo request" },
            { value: "free_trial", label: "Free trial signup" },
            { value: "contact_form", label: "Contact form submission" },
            { value: "pricing_visit", label: "Pricing page visit" },
            { value: "return_visit_7d", label: "Return visit within 7 days" },
            { value: "multi_page_session", label: "Multi-page session" },
            { value: "content_download", label: "Content download" },
          ]}
        />
        <MultiSelectInput
          number={5}
          id="ls-disq"
          question="Disqualifiers"
          hint="Select every signal that should subtract from the score."
          values={inputs.disqualifiers}
          onToggle={toggleDisqualifier}
          options={[
            { value: "competitor_domain", label: "Competitor domain" },
            { value: "role_mismatch", label: "Role mismatch" },
            { value: "size_mismatch", label: "Company size mismatch" },
            { value: "free_email", label: "Free email domain" },
            { value: "geo_mismatch", label: "Geography mismatch" },
          ]}
        />
        <RadioInput
          number={6}
          id="ls-tier"
          question="HubSpot tier"
          value={inputs.tier}
          onChange={(v) => set("tier", v)}
          options={[
            { value: "pro", label: "Marketing Pro (100 pt cap)" },
            { value: "enterprise", label: "Marketing Enterprise (500 pt cap)" },
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
          className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] font-mono text-[10px] text-[var(--fg-muted)]"
        >
          {number}
        </span>
        <span className="font-normal leading-relaxed">{question}</span>
      </Label>
      {hint ? (
        <p className="ml-8 mt-1 text-xs text-[var(--fg-subtle)]">{hint}</p>
      ) : null}
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
          "mt-3 grid gap-2 ml-8",
          options.length === 2 ? "sm:grid-cols-1" : "sm:grid-cols-2",
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

function MultiSelectInput<T extends string>({
  number,
  id,
  question,
  hint,
  values,
  onToggle,
  options,
}: {
  number: number;
  id: string;
  question: string;
  hint?: string;
  values: T[];
  onToggle: (v: T) => void;
  options: RadioOption<T>[];
}) {
  return (
    <div>
      <QuestionHeader number={number} id={id} question={question} hint={hint} />
      <div
        role="group"
        aria-labelledby={id}
        className="mt-3 grid gap-2 ml-8 sm:grid-cols-2"
      >
        {options.map((opt) => {
          const selected = values.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => onToggle(opt.value)}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                selected
                  ? "border-[var(--accent)] bg-[color-mix(in_oklch,var(--color-brand-500)_12%,transparent)] text-[var(--fg)]"
                  : "border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] hover:border-[var(--border-strong)] hover:text-[var(--fg)]",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent)]"
                    : "border-[var(--border)] bg-transparent",
                )}
              >
                {selected ? (
                  <Check
                    className="h-3 w-3 text-[var(--accent-fg)]"
                    aria-hidden
                  />
                ) : null}
              </span>
              <span className="flex-1">{opt.label}</span>
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
  inputs,
  answeredRequired,
  requiredCount,
}: {
  results: LeadScoringResults | null;
  inputs: PartialInputs;
  answeredRequired: number;
  requiredCount: number;
}) {
  if (!results) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7 text-center">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          Your scoring model
        </div>
        <p className="mt-3 text-sm text-[var(--fg-muted)]">
          Fill in the four required inputs (buyer role, company size, cycle
          length, and HubSpot tier) to see your starter scoring model. The
          two multi-select inputs are optional but improve the model.
        </p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
            style={{ width: `${(answeredRequired / requiredCount) * 100}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-xs text-[var(--fg-subtle)]">
          {answeredRequired} of {requiredCount} required filled
        </p>
      </div>
    );
  }

  // Safe cast: results is non-null only when isComplete(inputs) was true.
  const completeInputs = inputs as LeadScoringInputs;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              Your scoring model
            </div>
            <p className="mt-1 max-w-md text-xs text-[var(--fg-muted)]">
              A build reference to read while configuring HubSpot&apos;s
              lead-scoring tool. The tool is UI-driven; each criterion below
              shows where to set it.
            </p>
          </div>
          <CopyAsTextButton inputs={completeInputs} results={results} />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SummaryStat
            label="Score cap"
            value={`${results.scoreCap} pts`}
            sublabel={
              completeInputs.tier === "enterprise"
                ? "Marketing Enterprise"
                : "Marketing Pro"
            }
          />
          <SummaryStat
            label="MQL threshold"
            value={`${results.mqlThreshold} pts`}
            sublabel={`${Math.round((results.mqlThreshold / results.scoreCap) * 100)}% of cap`}
            highlight
          />
          <SummaryStat
            label="Fit / Engagement split"
            value={`${results.split.fit} / ${results.split.engagement}`}
            sublabel="Adjusted for cycle length"
          />
          <SummaryStat
            label="Score decay"
            value={`${results.decayDays} days`}
            sublabel={results.decayRate}
          />
        </div>
      </div>

      <RuleSection
        title="Fit criteria"
        rules={results.fitRules}
        emptyMessage={null}
      />

      <RuleSection
        title="Engagement criteria"
        rules={results.engagementRules}
        emptyMessage="Select high-intent actions to populate this section."
      />

      <RuleSection
        title="Disqualifier criteria"
        rules={results.negativeRules}
        emptyMessage="Select disqualifiers to populate this section."
      />

      <TierMappingGrid tiers={results.tiers} />

      <ImplementationSteps results={results} />
    </div>
  );
}

function CopyAsTextButton({
  inputs,
  results,
}: {
  inputs: LeadScoringInputs;
  results: LeadScoringResults;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(renderModelAsText(inputs, results));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable. The visitor can still use the email helper
      // below to receive the same text reference.
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={copy}
      disabled={copied}
      title="Copy a plain-text version of this build reference for offline use"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" aria-hidden />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" aria-hidden />
          Copy as text
        </>
      )}
    </Button>
  );
}

function SummaryStat({
  label,
  value,
  sublabel,
  highlight,
}: {
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        highlight
          ? "border-[color-mix(in_oklch,var(--color-brand-500)_40%,transparent)] bg-[color-mix(in_oklch,var(--color-brand-500)_8%,transparent)]"
          : "border-[var(--border)] bg-[var(--bg)]",
      )}
    >
      <div className="text-xs text-[var(--fg-subtle)]">{label}</div>
      <div className="mt-1 font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
        {value}
      </div>
      {sublabel ? (
        <div className="mt-0.5 text-xs text-[var(--fg-muted)]">{sublabel}</div>
      ) : null}
    </div>
  );
}

function RuleSection({
  title,
  rules,
  emptyMessage,
}: {
  title: string;
  rules: ScoringRule[];
  emptyMessage: string | null;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        {title}
      </div>
      {rules.length === 0 ? (
        emptyMessage ? (
          <p className="mt-3 text-sm text-[var(--fg-subtle)]">
            {emptyMessage}
          </p>
        ) : null
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-[var(--border)]">
          {rules.map((r) => (
            <li
              key={r.name}
              className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--fg)]">
                  {r.name}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--fg-muted)]">
                  {r.description}
                </p>
                <div className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-[var(--color-brand-400)]">
                  <span
                    aria-hidden
                    className="shrink-0 select-none font-medium uppercase tracking-[0.12em] text-[var(--fg-subtle)]"
                  >
                    Where
                  </span>
                  <span className="font-mono text-[var(--color-brand-400)]">
                    {r.hubspotPath}
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  "shrink-0 font-mono text-sm font-medium",
                  r.points >= 0
                    ? "text-[var(--color-success)]"
                    : "text-[var(--color-danger)]",
                )}
              >
                {r.points >= 0 ? "+" : ""}
                {r.points}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TierMappingGrid({ tiers }: { tiers: TierMapping[] }) {
  const bandTone = (band: TierMapping["band"]) => {
    if (band === "A") {
      return "border-[color-mix(in_oklch,var(--color-success)_35%,transparent)] bg-[color-mix(in_oklch,var(--color-success)_6%,transparent)]";
    }
    if (band === "B") {
      return "border-[color-mix(in_oklch,var(--color-brand-500)_35%,transparent)] bg-[color-mix(in_oklch,var(--color-brand-500)_6%,transparent)]";
    }
    return "border-[var(--border)] bg-[var(--bg)]";
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Tier mapping (A1 to C3)
      </div>
      <p className="mt-1 text-xs text-[var(--fg-muted)]">
        Three sub-tiers per band so triage can scale beyond binary MQL/not-MQL.
        Wire the matching range to its workflow in HubSpot.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.letter}
            className={cn("rounded-lg border p-4", bandTone(t.band))}
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
                {t.letter}
              </div>
              <div className="font-mono text-xs text-[var(--fg-muted)]">
                {t.range}
              </div>
            </div>
            <div className="mt-2 text-sm font-medium text-[var(--fg)]">
              {t.label}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--fg-muted)]">
              {t.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImplementationSteps({ results }: { results: LeadScoringResults }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Implementation steps
      </div>
      <ol className="mt-4 flex flex-col gap-2 text-sm leading-relaxed text-[var(--fg-muted)]">
        <Step n={1}>
          Open HubSpot, navigate to{" "}
          <span className="font-medium text-[var(--fg)]">
            Marketing &gt; Lead Scoring
          </span>
          .
        </Step>
        <Step n={2}>Create or edit your score property.</Step>
        <Step n={3}>
          Add the Fit rules above as positive criteria, scoped to contact
          properties for role and company size.
        </Step>
        <Step n={4}>
          Add the Engagement rules above as positive criteria, scoped to the
          relevant page or form events.
        </Step>
        <Step n={5}>Add the Negative rules above as negative criteria.</Step>
        <Step n={6}>
          Configure decay: {results.decayRate}, {results.decayDays}-day
          window.
        </Step>
        <Step n={7}>
          Add a workflow that fires on score &gt;= {results.mqlThreshold} to
          flag the contact as MQL and notify sales.
        </Step>
        <Step n={8}>Save and apply.</Step>
      </ol>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] font-mono text-[10px] text-[var(--fg-muted)]"
      >
        {n}
      </span>
      <span>{children}</span>
    </li>
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
              HubSpot product limits and recommendations.
            </span>{" "}
            Score caps are HubSpot&apos;s published per-tier limits: 100
            points on Marketing Pro, 500 on Marketing Enterprise. The 50/50
            Fit/Engagement default is HubSpot&apos;s recommended starting
            split. MQL thresholds typically fall between 50 and 80 on the
            100-point scale per common practice.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Industry-standard point values.
            </span>{" "}
            Demo +25, free trial +25, contact form +20, pricing visit +15,
            role match +10, content download +5. Standard negative values:
            free email -15, role mismatch -25, competitor domain -50. These
            are widely cited starting points in HubSpot lead-scoring
            documentation and partner playbooks.
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Dunamis model assumptions.
            </span>{" "}
            MQL thresholds adjust by sales cycle (60 / 70 / 75 / 80 across
            the four cycle bands) and decay periods adjust the same way (30
            / 60 / 90 / 90 days). The Fit/Engagement split also shifts with
            cycle length, anchored at HubSpot&apos;s 50/50 default for the
            median 30 to 90 day band. Shorter cycles weight engagement more
            (transactional buying); longer cycles weight fit more
            (considered enterprise sales).
          </p>
          <p>
            <span className="font-medium text-[var(--fg)]">
              Enterprise scaling.
            </span>{" "}
            On Enterprise, point values and the threshold scale 5x to fit
            the 500-point cap proportionally. Most Enterprise teams extend
            this baseline with more granular intent rules (specific page
            visits, intent-data signals, custom event triggers) to use the
            additional headroom.
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
      const res = await fetch("/api/tools/lead-scoring-report", {
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
            One email with the model and copy-paste block. No newsletter,
            no sharing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--fg)]">
        <Mail className="h-4 w-4" aria-hidden />
        Email me this model
      </div>
      <p className="mt-1 text-xs text-[var(--fg-muted)]">
        We&apos;ll send the full model with copy-paste blocks for HubSpot.
        Optional. The builder works without it.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="ls-email" className="sr-only">
          Email address
        </label>
        <Input
          id="ls-email"
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
          Finish the four required inputs to enable the report.
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
