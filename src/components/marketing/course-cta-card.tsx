import Link from "next/link";
import { ArrowUpRight, GraduationCap } from "lucide-react";

/**
 * Inline CTA pointing visitors at /courses/hubspot-audit. Used at the
 * bottom of the audit-relevant tool pages and inside the stale-property
 * guide. Opens in a new tab so the visitor's current tool session is
 * preserved.
 *
 * Server component. No state, no client features.
 */
export function CourseCtaCard({
  courseHref = "/courses/hubspot-audit",
}: {
  courseHref?: string;
} = {}) {
  return (
    <div className="mt-16 rounded-2xl border border-[color-mix(in_oklch,var(--color-brand-500)_30%,transparent)] bg-[color-mix(in_oklch,var(--color-brand-500)_5%,transparent)] p-6 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--color-brand-500)_15%,transparent)] text-[var(--color-brand-400)]"
            aria-hidden
          >
            <GraduationCap className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-brand-400)]">
              Free email course
            </div>
            <h3 className="mt-1 font-[var(--font-display)] text-lg font-medium tracking-tight text-[var(--fg)] sm:text-xl">
              Want the full audit?
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--fg-muted)]">
              Get a free 5-day email course that walks through every
              dimension of your portal.
            </p>
          </div>
        </div>
        <Link
          href={courseHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[color-mix(in_oklch,var(--color-brand-500)_50%,transparent)] bg-[color-mix(in_oklch,var(--color-brand-500)_15%,transparent)] px-4 py-2.5 text-sm font-medium text-[var(--color-brand-400)] transition-colors hover:bg-[color-mix(in_oklch,var(--color-brand-500)_25%,transparent)]"
        >
          Start the course
          <ArrowUpRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </div>
  );
}
