"use client";

import * as React from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Client-side fuzzy search over the Atelier docs index.
 *
 * Index lives at /atelier-docs-index.json and is regenerated on every
 * `next build` by scripts/build-atelier-docs-index.ts. Fetched once on
 * mount and kept in component state; Fuse.js searches are run
 * synchronously against the in-memory copy.
 *
 * The matched-substring snippets come from Fuse's `matches` array. We
 * pull the longest match per result and render it with the matched
 * range highlighted, so a query for "license key" highlights the words
 * "license" and "key" wherever they show up across the docs.
 */

interface IndexEntry {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  href: string;
  body: string;
}

interface Index {
  version: number;
  generatedAt: string;
  count: number;
  entries: IndexEntry[];
}

const FUSE_OPTIONS: ConstructorParameters<typeof Fuse<IndexEntry>>[1] = {
  // Keys ordered by relevance — title hits beat body hits.
  keys: [
    { name: "title", weight: 0.5 },
    { name: "description", weight: 0.3 },
    { name: "body", weight: 0.2 },
  ],
  includeMatches: true,
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

const SNIPPET_BEFORE = 60;
const SNIPPET_AFTER = 100;

interface FuseMatch {
  indices: ReadonlyArray<readonly [number, number]>;
  key?: string;
  value?: string;
}

interface FuseResult {
  item: IndexEntry;
  matches?: ReadonlyArray<FuseMatch>;
}

/** Render a match's surrounding context with the matched range marked. */
function renderSnippet(match: FuseMatch | undefined): React.ReactNode {
  if (!match || !match.value || !match.indices.length) return null;
  const value = match.value;
  // Pick the longest matched range so multi-word queries surface a
  // human-readable slice rather than chasing a one-letter coincidence.
  const longest = [...match.indices].sort(
    (a, b) => b[1] - b[0] - (a[1] - a[0]),
  )[0];
  const [start, end] = longest;
  const sliceStart = Math.max(0, start - SNIPPET_BEFORE);
  const sliceEnd = Math.min(value.length, end + 1 + SNIPPET_AFTER);
  const before = value.slice(sliceStart, start);
  const matched = value.slice(start, end + 1);
  const after = value.slice(end + 1, sliceEnd);
  return (
    <>
      {sliceStart > 0 ? "…" : ""}
      {before}
      <mark className="rounded bg-[color-mix(in_oklch,var(--color-atelier-500)_22%,transparent)] px-0.5 text-[var(--fg)]">
        {matched}
      </mark>
      {after}
      {sliceEnd < value.length ? "…" : ""}
    </>
  );
}

export function AtelierDocsSearch() {
  const [query, setQuery] = React.useState("");
  const [index, setIndex] = React.useState<Index | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/atelier-docs-index.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Index fetch failed: ${r.status}`);
        return r.json() as Promise<Index>;
      })
      .then((data) => {
        if (!cancelled) setIndex(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Could not load search index.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fuse = React.useMemo(() => {
    if (!index) return null;
    return new Fuse(index.entries, FUSE_OPTIONS);
  }, [index]);

  const results: FuseResult[] = React.useMemo(() => {
    if (!fuse || !query.trim()) return [];
    return fuse.search(query.trim(), { limit: 25 });
  }, [fuse, query]);

  return (
    <div>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-subtle)]"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search the Atelier docs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          autoFocus
          className="pl-9"
          aria-label="Search the Atelier documentation"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 text-sm text-[var(--color-danger)]"
        >
          {error}
        </p>
      ) : !index ? (
        <p className="mt-4 text-sm text-[var(--fg-subtle)]">
          Loading search index…
        </p>
      ) : !query.trim() ? (
        <p className="mt-4 text-sm text-[var(--fg-subtle)]">
          {index.count} docs indexed. Type to search across every page.
        </p>
      ) : results.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--fg-muted)]">
          No matches for <span className="font-medium">{query}</span>. Try
          a different word, or browse the sidebar on the left.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {results.map((r) => {
            const titleMatch = r.matches?.find((m) => m.key === "title");
            const bodyMatch = r.matches?.find(
              (m) => m.key === "body" || m.key === "description",
            );
            return (
              <li
                key={r.item.slug}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 transition-colors hover:border-[var(--border-strong)]"
              >
                <Link
                  href={r.item.href}
                  className="block"
                >
                  <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                    {r.item.categoryLabel}
                  </div>
                  <h3 className="mt-1 font-[var(--font-display)] text-lg font-medium tracking-tight text-[var(--fg)]">
                    {titleMatch ? renderSnippet(titleMatch) : r.item.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-2 text-sm leading-relaxed text-[var(--fg-muted)]",
                    )}
                  >
                    {bodyMatch ? renderSnippet(bodyMatch) : r.item.description}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
