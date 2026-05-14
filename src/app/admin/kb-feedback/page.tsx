import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentAdminSession } from "@/lib/session";
import { listKbFeedback, type KbFeedbackRow } from "@/lib/admin/kb-feedback";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "KB feedback · Admin · Dunamis Studios",
  robots: { index: false, follow: false },
};

/**
 * Per-article thumbs aggregation. Lists every published help-center
 * article with its current up / down counts and a derived down-rate,
 * sorted highest-down-rate first so the articles most worth rewriting
 * surface at the top. Counts come straight from
 * `dunamis:kb:rating:{category}:{slug}` HSETs in Redis; the same data
 * the public rating route writes, just batched and surfaced to a
 * single admin pane rather than read one article at a time.
 *
 * Privacy posture: this is the only surface that exposes raw counts.
 * Public-facing rendering still routes through `getHelpfulBadge` in
 * `src/lib/kb-rating.ts`, which returns a derived boolean and never
 * leaks the underlying numbers to the HTML.
 */
export default async function AdminKbFeedbackPage() {
  const admin = await getCurrentAdminSession();
  if (!admin) {
    redirect("/login?redirect=/admin/kb-feedback");
  }

  const rows = await listKbFeedback();
  const withVotes = rows.filter((r) => r.total > 0);
  const totals = rows.reduce(
    (acc, r) => ({
      up: acc.up + r.up,
      down: acc.down + r.down,
      total: acc.total + r.total,
    }),
    { up: 0, down: 0, total: 0 },
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[var(--font-display)] text-3xl font-medium tracking-tight text-[var(--fg)]">
          KB feedback
        </h1>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Per-article thumbs aggregation across the help center. Sorted by
          highest down-rate first so the articles most worth rewriting
          bubble to the top. Articles with zero votes are listed below the
          summary so the table reflects the full content surface.
        </p>
      </header>

      <section
        aria-label="Summary totals"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <SummaryTile label="Articles" value={rows.length} />
        <SummaryTile label="Articles with votes" value={withVotes.length} />
        <SummaryTile label="Total up votes" value={totals.up} />
        <SummaryTile label="Total down votes" value={totals.down} />
      </section>

      <FeedbackTable rows={rows} />
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
      <p className="text-xs text-[var(--fg-muted)]">{label}</p>
      <p className="mt-1 font-[var(--font-display)] text-2xl font-medium tracking-tight text-[var(--fg)]">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function FeedbackTable({ rows }: { rows: KbFeedbackRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-center text-sm text-[var(--fg-muted)]">
        No published articles yet.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
      <table className="min-w-full divide-y divide-[var(--border)] text-sm">
        <thead className="bg-[var(--bg-subtle)] text-left text-xs uppercase tracking-wider text-[var(--fg-subtle)]">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Article
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Category
            </th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">
              Up
            </th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">
              Down
            </th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">
              Total
            </th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">
              Down rate
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((row) => (
            <tr
              key={`${row.category}:${row.slug}`}
              className="hover:bg-[var(--bg-muted)]"
            >
              <td className="px-4 py-2.5">
                <Link
                  href={row.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--fg)] underline-offset-2 hover:underline"
                >
                  {row.title}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-[var(--fg-muted)]">
                {row.category}
              </td>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[var(--fg)]">
                {row.up}
              </td>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[var(--fg)]">
                {row.down}
              </td>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[var(--fg-muted)]">
                {row.total}
              </td>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[var(--fg)]">
                {row.total === 0 ? (
                  <span className="text-[var(--fg-subtle)]">&mdash;</span>
                ) : (
                  formatPct(row.downRate)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}
