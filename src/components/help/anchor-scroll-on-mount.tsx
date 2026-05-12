"use client";

import * as React from "react";

/**
 * When a help-article ArticleCta link lands on /help/contact-support
 * with a #support-form hash, Next.js's initial hash-resolve fires
 * before the SupportForm client component has hydrated, so the
 * browser scrolls to wherever the empty wrapper was at SSR time
 * rather than to the now-mounted form. This component runs one
 * scrollIntoView after mount when the URL matches the target hash,
 * which lines up the form with the viewport after hydration is
 * complete.
 *
 * Render this component inside the same DOM subtree as the anchor
 * target so it is guaranteed to mount after the target exists.
 */
export function AnchorScrollOnMount({ targetId }: { targetId: string }) {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (hash !== targetId) return;
    const el = document.getElementById(targetId);
    if (!el) return;
    // requestAnimationFrame defers the scroll one frame so any layout-
    // dependent content above us settles first; without it the form
    // sometimes lands a few pixels off on slow first paints.
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [targetId]);
  return null;
}
