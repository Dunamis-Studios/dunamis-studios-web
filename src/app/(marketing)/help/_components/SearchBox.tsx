"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Lock, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Client-side help-center search.
 *
 * Data source: /kb-index.json, written by scripts/build-kb-index.ts
 * during `prebuild`. The index is a flat array of entries with title,
 * description, tags, and (for public articles only) a truncated
 * plain-text body.
 *
 * Lifecycle:
 *   1. On mount, do nothing unless `eager` is true (search page).
 *   2. On first input focus, kick off the fetch to /kb-index.json.
 *   3. Cache the response in state; subsequent searches are in-memory.
 *   4. Debounce the query by DEBOUNCE_MS before computing results.
 *
 * Scoring:
 *   score = title_hits * TITLE_BOOST
 *         + description_hits * DESC_BOOST
 *         + tag_hits * TAG_BOOST
 *         + body_hits * 1
 *
 *   Customer-gated entries have no body in the index, so they can only
 *   score via title/description/tags. The access gate still runs at
 *   article-page render, so if a signed-out user clicks through they
 *   land on the teaser or redirect per the usual flow — search never
 *   leaks body content from behind the gate.
 */

interface KbIndexEntry {
  slug: string;
  category: string;
  product: "debrief" | "property-pulse" | "platform";
  title: string;
  description: string;
  tags?: string[];
  access: "public" | "customers";
  updated: string;
  href: string;
  body?: string;
}

interface KbIndex {
  version: 1;
  generatedAt: string;
  count: number;
  entries: KbIndexEntry[];
}

interface ScoredResult {
  entry: KbIndexEntry;
  score: number;
}

const DEBOUNCE_MS = 200;
const TITLE_BOOST = 3;
const DESC_BOOST = 2;
const TAG_BOOST = 2;
const MIN_TOKEN_LEN = 2;
const MAX_RESULTS = 20;
const DEFAULT_INLINE_LIMIT = 5;

const PRODUCT_LABEL: Record<string, string> = {
  debrief: "Debrief",
  "property-pulse": "Property Pulse",
  platform: "Platform",
};

export function SearchBox({
  initialQuery = "",
  eager = false,
  maxResultsInline,
}: {
  initialQuery?: string;
  /**
   * If true, the index is fetched on mount rather than first focus.
   * Use on /help/search where the user arrived specifically to search.
   */
  eager?: boolean;
  /**
   * Cap the inline result list. Default 5 on the /help index (so the
   * sections below don't get pushed too far); MAX_RESULTS on the
   * search page.
   */
  maxResultsInline?: number;
}) {
  const inlineLimit =
    maxResultsInline ?? (eager ? MAX_RESULTS : DEFAULT_INLINE_LIMIT);

  const [query, setQuery] = React.useState(initialQuery);
  const [debounced, setDebounced] = React.useState(initialQuery);
  const [index, setIndex] = React.useState<KbIndex | null>(null);
  const [indexState, setIndexState] =
    React.useState<"idle" | "loading" | "error">("idle");

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const loadIndex = React.useCallback(async () => {
    if (index || indexState === "loading") return;
    setIndexState("loading");
    try {
      const res = await fetch("/kb-index.json", { cache: "force-cache" });
      if (!res.ok) throw new Error(`Index ${res.status}`);
      const data = (await res.json()) as KbIndex;
      setIndex(data);
      setIndexState("idle");
    } catch {
      setIndexState("error");
    }
  }, [index, indexState]);

  React.useEffect(() => {
    if (eager) loadIndex();
  }, [eager, loadIndex]);

  const tokens = React.useMemo(() => tokenize(debounced), [debounced]);
  const results = React.useMemo(() => {
    if (!index || tokens.length === 0) return [];
    return rankResults(index.entries, tokens);
  }, [index, tokens]);

  const totalResults = results.length;
  const shown = results.slice(0, inlineLimit);
  const hiddenCount = Math.max(0, totalResults - shown.length);
  const hasQuery = tokens.length > 0;

  return (
    <div className="w-full">
      <div className="relative">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-subtle)]"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={loadIndex}
          placeholder="Search help articles…"
          aria-label="Search help articles"
          autoComplete="off"
          spellCheck={false}
          className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] pl-10 pr-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
      </div>

      {hasQuery ? (
        <ResultsPanel
          tokens={tokens}
          query={debounced}
          results={shown}
          hiddenCount={hiddenCount}
          indexState={indexState}
          hasIndex={!!index}
          eager={eager}
        />
      ) : null}
    </div>
  );
}

function ResultsPanel({
  tokens,
  query,
  results,
  hiddenCount,
  indexState,
  hasIndex,
  eager,
}: {
  tokens: string[];
  query: string;
  results: ScoredResult[];
  hiddenCount: number;
  indexState: "idle" | "loading" | "error";
  hasIndex: boolean;
  eager: boolean;
}) {
  if (!hasIndex && indexState === "loading") {
    return (
      <p className="mt-4 text-sm text-[var(--fg-subtle)]">
        Loading search index…
      </p>
    );
  }
  if (indexState === "error") {
    return (
      <p className="mt-4 text-sm text-[var(--color-danger)]">
        Couldn&apos;t load the search index. Try refreshing the page.
      </p>
    );
  }
  if (results.length === 0) {
    return (
      <p className="mt-4 text-sm text-[var(--fg-muted)]">
        No matches for &ldquo;{query}&rdquo;.
      </p>
    );
  }
  return (
    <div className="mt-4">
      <ul className="grid gap-3">
        {results.map((r) => (
          <li key={r.entry.href}>
            <ResultCard entry={r.entry} tokens={tokens} />
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && !eager ? (
        <div className="mt-4">
          <Link
            href={`/help/search?q=${encodeURIComponent(query)}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            View all {results.length + hiddenCount} results
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function ResultCard({
  entry,
  tokens,
}: {
  entry: KbIndexEntry;
  tokens: string[];
}) {
  const crumb = `${PRODUCT_LABEL[entry.product] ?? entry.product} · ${titleCaseSlug(entry.category)}`;
  const excerpt = buildExcerpt(entry, tokens);
  return (
    <Link
      href={entry.href}
      className="group block rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 transition-colors hover:border-[var(--border-strong)]"
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        <span>{crumb}</span>
        {entry.access === "customers" ? (
          <>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1 text-[var(--color-brief-500)]">
              <Lock className="h-3 w-3" aria-hidden /> Customers only
            </span>
          </>
        ) : null}
      </div>
      <h3 className="mt-2 font-[var(--font-display)] text-lg font-medium tracking-tight text-[var(--fg)] group-hover:text-[var(--fg)]">
        {highlight(entry.title, tokens)}
      </h3>
      <p className="mt-1.5 line-clamp-3 text-sm text-[var(--fg-muted)]">
        {highlight(excerpt, tokens)}
      </p>
    </Link>
  );
}

// ---- ranking -------------------------------------------------------------

function tokenize(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= MIN_TOKEN_LEN);
}

function rankResults(
  entries: KbIndexEntry[],
  tokens: string[],
): ScoredResult[] {
  const scored: ScoredResult[] = [];
  for (const entry of entries) {
    const title = entry.title.toLowerCase();
    const description = entry.description.toLowerCase();
    const body = (entry.body ?? "").toLowerCase();
    const tagsText = (entry.tags ?? []).join(" ").toLowerCase();

    let score = 0;
    for (const token of tokens) {
      score += countOccurrences(title, token) * TITLE_BOOST;
      score += countOccurrences(description, token) * DESC_BOOST;
      score += countOccurrences(tagsText, token) * TAG_BOOST;
      score += countOccurrences(body, token);
    }

    if (score > 0) scored.push({ entry, score });
  }
  scored.sort(
    (a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title),
  );
  return scored.slice(0, MAX_RESULTS);
}

function countOccurrences(haystack: string, token: string): number {
  if (!token || !haystack) return 0;
  let n = 0;
  let pos = 0;
  while ((pos = haystack.indexOf(token, pos)) !== -1) {
    n++;
    pos += token.length;
  }
  return n;
}

// ---- excerpt + highlight -------------------------------------------------

function buildExcerpt(entry: KbIndexEntry, tokens: string[]): string {
  const body = entry.body ?? "";
  if (body) {
    const lower = body.toLowerCase();
    let first = -1;
    for (const t of tokens) {
      const i = lower.indexOf(t);
      if (i !== -1 && (first === -1 || i < first)) first = i;
    }
    if (first !== -1) {
      const rawStart = Math.max(0, first - 60);
      const rawEnd = Math.min(body.length, first + 140);
      const start = snapToWordStart(body, rawStart);
      const end = snapToWordEnd(body, rawEnd);
      let text = body.slice(start, end).trim();
      if (start > 0) text = "… " + text;
      if (end < body.length) text = text + " …";
      return text;
    }
  }
  return entry.description;
}

function snapToWordStart(body: string, idx: number): number {
  if (idx === 0) return 0;
  const next = body.indexOf(" ", idx);
  return next === -1 ? idx : Math.min(next + 1, body.length);
}

function snapToWordEnd(body: string, idx: number): number {
  if (idx >= body.length) return body.length;
  const next = body.indexOf(" ", idx);
  return next === -1 ? body.length : next;
}

function highlight(text: string, tokens: string[]): React.ReactNode[] {
  if (tokens.length === 0) return [text];
  const pattern = new RegExp(
    `(${tokens.map(escapeRegex).join("|")})`,
    "gi",
  );
  const parts = text.split(pattern);
  const lowerTokens = new Set(tokens);
  return parts.map((part, i) => {
    if (!part) return null;
    const isMatch = lowerTokens.has(part.toLowerCase());
    return isMatch ? (
      <mark
        key={i}
        className={cn(
          "rounded-sm px-0.5 text-[var(--fg)]",
          "bg-[color-mix(in_oklch,var(--color-brief-500)_30%,transparent)]",
        )}
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    );
  });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function titleCaseSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}
