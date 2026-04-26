"use client";

import * as React from "react";
import { runAllChecks, computeScore, computeReadingTime, type CheckResult, type CheckStatus } from "@/lib/seo-checks";

interface SEOSidebarProps {
  title: string;
  slug: string;
  description: string;
  contentHtml: string;
  coverImageUrl: string;
  targetKeyword: string;
  onTargetKeywordChange: (value: string) => void;
}

function StatusIcon({ status }: { status: CheckStatus }) {
  switch (status) {
    case "pass":
      return <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-success)]" />;
    case "warn":
      return <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-warning)]" />;
    case "fail":
      return <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-danger)]" />;
    case "skip":
      return <span className="inline-block h-2 w-2 rounded-full bg-[var(--fg-subtle)] opacity-40" />;
  }
}

export function SEOSidebar({
  title,
  slug,
  description,
  contentHtml,
  coverImageUrl,
  targetKeyword,
  onTargetKeywordChange,
}: SEOSidebarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const checks = React.useMemo(
    () => runAllChecks({ title, slug, description, contentHtml, coverImageUrl, targetKeyword }),
    [title, slug, description, contentHtml, coverImageUrl, targetKeyword],
  );

  const { score, total } = computeScore(checks);
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const readingTime = computeReadingTime(contentHtml);

  const content = (
    <div className="space-y-4">
      {/* Target keyword input */}
      <div>
        <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1">Target keyword</label>
        <input
          type="text"
          value={targetKeyword}
          onChange={(e) => onTargetKeywordChange(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-sm text-[var(--fg)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          placeholder="e.g. hubspot automation"
        />
      </div>

      {/* Score header */}
      <div>
        <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] mb-1">
          <span>{score} / {total} checks passing</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[var(--bg-muted)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              backgroundColor: pct >= 80 ? "var(--color-success)" : pct >= 50 ? "var(--color-warning)" : "var(--color-danger)",
            }}
          />
        </div>
      </div>

      {/* Reading time info */}
      <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)] border-b border-[var(--border)] pb-3">
        <span>Reading time: {readingTime} min</span>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {checks.map((check) => (
          <CheckRow key={check.id} check={check} />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden lg:block sticky top-24">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
          <h3 className="text-sm font-medium text-[var(--fg)] mb-3">SEO Health</h3>
          {content}
        </div>
      </div>

      {/* Mobile: collapsible */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="w-full flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2.5"
        >
          <span className="text-sm font-medium text-[var(--fg)]">SEO Health</span>
          <span className="text-xs text-[var(--fg-muted)]">{score}/{total} • {pct}%</span>
        </button>
        {mobileOpen && (
          <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            {content}
          </div>
        )}
      </div>
    </>
  );
}

function CheckRow({ check }: { check: CheckResult }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-1 shrink-0">
        <StatusIcon status={check.status} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-[var(--fg)]">{check.label}</div>
        <div className="text-xs text-[var(--fg-muted)] truncate">{check.message}</div>
      </div>
    </div>
  );
}
