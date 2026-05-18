/**
 * Tiny grab-bag of view-layer helpers reused across React components.
 *
 * Nothing here talks to the network, the database, or the request
 * context. The helpers are pure, synchronous, and safe to call inside
 * both server components and client components without lazy loading.
 *
 * Keep this file small. Anything that grows a dependency on env vars,
 * Redis, Stripe, or HubSpot belongs in its own module so this one
 * stays a zero-cost import for every UI surface that touches it.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Conditionally compose Tailwind class strings while deduping
 * conflicts. Combines clsx (handles arrays, objects, falsy values)
 * with twMerge (resolves Tailwind conflicts so `px-4` and `px-6`
 * collapse to the later one). Every component in the site uses this
 * helper rather than string concatenation, so a className override on
 * a wrapper actually wins.
 *
 * @param inputs - Variadic mix of strings, arrays, objects, or falsy
 *                 values accepted by clsx.
 * @returns A single deduped Tailwind class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format an ISO date string for display in en-US "Mon DD, YYYY" form.
 * Tolerant of null, undefined, and unparseable strings: each falls
 * back to a horizontal-bar placeholder rather than throwing or
 * rendering "Invalid Date". Used by every customer-facing list and
 * table cell that needs a date.
 *
 * @param iso - ISO-8601 timestamp, or null / undefined for the empty
 *              state.
 * @returns Either a localized date or the empty-state placeholder.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format an ISO timestamp for display in en-US "Mon DD, YYYY, h:mm AM"
 * form. Same tolerance contract as formatDate: null, undefined, and
 * unparseable strings each fall back to the horizontal-bar
 * placeholder. Used for activity feeds, audit logs, and any UI that
 * surfaces a precise moment rather than just a calendar date.
 *
 * @param iso - ISO-8601 timestamp, or null / undefined for the empty
 *              state.
 * @returns Either a localized date+time or the empty-state placeholder.
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Build a two-character avatar fallback from a first / last name pair.
 * Used as the visible glyph inside the circular avatar that the
 * account dashboard and admin tables render when the customer has no
 * uploaded logo. Always uppercased, always exactly the first letter
 * of each name; if both names are empty the result is a literal "?"
 * so an unseeded account still renders a glyph rather than an empty
 * circle.
 *
 * @param first - Optional first name.
 * @param last - Optional last name.
 * @returns A two-character uppercase string, or "?" when both inputs
 *          are blank.
 */
export function initials(first?: string | null, last?: string | null): string {
  const f = (first ?? "").trim().charAt(0);
  const l = (last ?? "").trim().charAt(0);
  return (f + l || "?").toUpperCase();
}

/**
 * Promise-based delay helper. Resolves after the requested number of
 * milliseconds. Used by retry loops and gentle backoff paths to
 * avoid hammering downstream services. Not for production-critical
 * timing (event loop drift makes setTimeout inexact); fine for
 * "wait a beat".
 *
 * @param ms - Milliseconds to wait before resolving.
 * @returns A Promise that resolves with no value once the timer fires.
 */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
