"use client";

import * as React from "react";

/**
 * Render an ISO timestamp in the viewer's local timezone with a TZ
 * abbreviation suffix. Admin pages are server-rendered on Vercel
 * (UTC); without this component every "Created at..." / "Last sign-in"
 * label would show UTC and confuse admins viewing a customer they know
 * just signed in from their own timezone.
 *
 * SSR rendering shows UTC + " UTC" so the initial paint is meaningful
 * even before hydration; the client effect swaps to the browser's
 * local zone on mount. The full datetime stays in the title attribute
 * for hover.
 */
export function LocalTime({
  iso,
  variant = "long",
  fallback = "never",
}: {
  iso: string | null | undefined;
  variant?: "long" | "short";
  fallback?: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!iso) return <span>{fallback}</span>;

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return <span>{iso}</span>;

  const formatted = mounted
    ? formatLocal(d, variant)
    : formatUtc(d, variant);

  return (
    <time dateTime={iso} title={iso} suppressHydrationWarning>
      {formatted}
    </time>
  );
}

function formatLocal(d: Date, variant: "long" | "short"): string {
  if (variant === "short") {
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  const tz =
    Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone?.split("/")
      .pop()
      ?.replace(/_/g, " ") ?? "local";
  const base = d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${base} ${tz}`;
}

function formatUtc(d: Date, variant: "long" | "short"): string {
  if (variant === "short") {
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }
  const base = d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
  return `${base} UTC`;
}
