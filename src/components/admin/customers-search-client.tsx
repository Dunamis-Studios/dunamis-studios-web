"use client";

import * as React from "react";
import Link from "next/link";
import { Search as SearchIcon, X as XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface SearchResultRow {
  accountId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  createdAt: string;
}

interface RecentRow {
  accountId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  createdAt: string;
}

interface CustomersSearchClientProps {
  recent: RecentRow[];
}

type SearchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "results"; rows: SearchResultRow[] }
  | { kind: "error"; message: string };

const DEBOUNCE_MS = 300;

async function readJsonOrNull<T>(res: Response): Promise<T | null> {
  // Servers sometimes return a status with no JSON body on edge
  // cases (proxy timeouts, etc.). Treat parse failure as absent
  // metadata, not a UI crash: the status code is already
  // authoritative for the rendered state.
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Customers search UX. The endpoint behind this is exact-match-only
 * today; the array-shaped response is forward-compatible with future
 * fuzzy/prefix expansion. Behavior:
 *
 *   - 300ms debounce per keystroke
 *   - Any pending request aborts on the next keystroke (AbortController)
 *   - Loading state is a small spinner inside the input, not a
 *     full-page loader (page header + Recent list stay visible)
 *   - Empty state shows "no customer found with email X" when the
 *     search returned zero rows
 *   - Empty input renders the Recent Customers list passed in from
 *     the server (last 10 accounts with activity in the last 30 days)
 *   - 429 from the rate limiter is treated as a soft error: surface
 *     the wait time and stop firing until the next keystroke.
 */
export function CustomersSearchClient({ recent }: CustomersSearchClientProps) {
  const [input, setInput] = React.useState("");
  const [state, setState] = React.useState<SearchState>({ kind: "idle" });

  const abortRef = React.useRef<AbortController | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = React.useRef<string>("");

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const trimmed = input.trim();
    if (trimmed.length === 0) {
      lastQueryRef.current = "";
      setState({ kind: "idle" });
      return;
    }

    setState({ kind: "loading" });

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      lastQueryRef.current = trimmed;

      try {
        const res = await fetch(
          `/api/admin/customers/search?email=${encodeURIComponent(trimmed)}`,
          {
            signal: controller.signal,
            credentials: "same-origin",
          },
        );

        if (controller.signal.aborted) return;

        if (res.status === 429) {
          const body = await readJsonOrNull<{ retry_after_seconds?: number }>(
            res,
          );
          const wait = body?.retry_after_seconds ?? 60;
          setState({
            kind: "error",
            message: `Rate-limited. Try again in ${wait}s.`,
          });
          return;
        }

        if (res.status === 400) {
          const body = await readJsonOrNull<{ error?: string }>(res);
          setState({
            kind: "error",
            message: body?.error ?? "Enter a valid email address.",
          });
          return;
        }

        if (!res.ok) {
          setState({
            kind: "error",
            message: `Search failed (${res.status}).`,
          });
          return;
        }

        const data = (await res.json()) as { results: SearchResultRow[] };
        if (controller.signal.aborted) return;
        setState({ kind: "results", rows: data.results ?? [] });
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("[customers-search] fetch failed", err);
        setState({ kind: "error", message: "Network error. Retry?" });
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input]);

  function clearInput() {
    setInput("");
  }

  const showRecent = state.kind === "idle";
  const showResults = state.kind === "results";
  const showEmpty =
    state.kind === "results" &&
    state.rows.length === 0 &&
    lastQueryRef.current.length > 0;
  const showError = state.kind === "error";
  const showLoading = state.kind === "loading";

  return (
    <div className="space-y-6">
      <div className="relative">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-subtle)]"
        />
        <input
          type="email"
          inputMode="email"
          autoComplete="off"
          spellCheck={false}
          aria-label="Search by email"
          placeholder="Search by email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] py-2.5 pl-10 pr-10 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        {input.length > 0 && !showLoading ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={clearInput}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)]"
          >
            <XIcon className="h-4 w-4" />
          </button>
        ) : null}
        {showLoading ? (
          <div
            aria-hidden
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <Spinner />
          </div>
        ) : null}
      </div>

      {showError ? (
        <div
          role="alert"
          className="rounded-lg border border-[var(--color-danger-border,#fecaca)] bg-[var(--color-danger-bg,#fef2f2)] px-4 py-3 text-sm text-[var(--color-danger-fg,#991b1b)] dark:border-[#5b1f1f] dark:bg-[#2a1010] dark:text-[#fca5a5]"
        >
          {(state as { kind: "error"; message: string }).message}
        </div>
      ) : null}

      {showResults && !showEmpty ? (
        <ResultsList
          heading="Search results"
          rows={(state as { kind: "results"; rows: SearchResultRow[] }).rows}
        />
      ) : null}

      {showEmpty ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-center text-sm text-[var(--fg-muted)]">
          No customer found with email{" "}
          <code className="rounded bg-[var(--bg-muted)] px-1 py-0.5 text-xs text-[var(--fg)]">
            {lastQueryRef.current}
          </code>
          .
        </div>
      ) : null}

      {showRecent ? (
        <ResultsList heading="Recent customers" rows={recent} muted />
      ) : null}
    </div>
  );
}

function ResultsList({
  heading,
  rows,
  muted,
}: {
  heading: string;
  rows: SearchResultRow[];
  muted?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-center text-sm text-[var(--fg-muted)]">
        No recent customer activity.
      </div>
    );
  }
  return (
    <div>
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
        {heading}
      </h2>
      <ul
        className={cn(
          "divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]",
          muted ? "bg-[var(--bg)]" : "bg-[var(--bg-elevated)]",
        )}
      >
        {rows.map((row) => (
          <li key={row.accountId}>
            <Link
              href={`/admin/customers/${row.accountId}`}
              className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-muted)]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--fg)]">
                  {row.email}
                </p>
                <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
                  {displayName(row)}
                  {row.companyName ? (
                    <>
                      {" · "}
                      <span>{row.companyName}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <time
                className="shrink-0 text-xs text-[var(--fg-subtle)]"
                dateTime={row.createdAt}
                title={row.createdAt}
              >
                {formatShortDate(row.createdAt)}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function displayName(row: {
  firstName: string | null;
  lastName: string | null;
}): string {
  const parts = [row.firstName, row.lastName].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  return parts.length > 0 ? parts.join(" ") : "no name on file";
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-[var(--fg-muted)]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
