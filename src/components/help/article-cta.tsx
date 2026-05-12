import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Compact footer CTA rendered at the bottom of every help article.
 * Less prominent than the marketing site's primary brand CTAs by
 * design: an admin search-for-help moment is the wrong place for a
 * full-width filled button. A single line of body copy plus an
 * underlined inline link is enough nudge for the customer who hit
 * the article but didn't find their answer.
 *
 * Anchor target is the support page's #support-form, so the user
 * lands directly on the form rather than scrolling past the page
 * header. The receiving page applies a useEffect-driven scroll
 * adjustment for the case where the form mounts after the initial
 * hash-resolve.
 */
export function ArticleCta() {
  return (
    <aside
      aria-label="Need more help?"
      className="mt-10 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-4 text-sm text-[var(--fg-muted)]"
    >
      <p>
        Didn&apos;t find what you needed?{" "}
        <Link
          href="/help/contact-support#support-form"
          className="inline-flex items-center gap-1 font-medium text-[var(--accent)] underline-offset-2 hover:underline"
        >
          Contact support
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </p>
    </aside>
  );
}
