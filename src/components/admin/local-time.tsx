"use client";

import * as React from "react";

import { useAdminPreferredTimeZone } from "@/components/admin/admin-timezone-provider";

/**
 * Render an ISO timestamp in the viewer's preferred timezone.
 *
 * Resolution order:
 *   1. The IANA zone the admin saved on their account (read from
 *      AdminTimezoneProvider context). When set, both SSR and the
 *      hydrated client render this zone, so there is no flash.
 *   2. Browser-detected local zone via Intl.DateTimeFormat, applied
 *      client-side after mount. SSR falls back to UTC + " UTC" suffix
 *      so the initial paint is still meaningful.
 *
 * Admin pages are server-rendered on Vercel (UTC); without this
 * component every "Created at..." / "Last sign-in" label would show
 * UTC and confuse admins viewing a customer they know just signed in
 * from their own timezone.
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
  const preferred = useAdminPreferredTimeZone();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!iso) return <span>{fallback}</span>;

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return <span>{iso}</span>;

  let formatted: string;
  if (preferred) {
    formatted = formatInZone(d, variant, preferred);
  } else if (mounted) {
    formatted = formatBrowserLocal(d, variant);
  } else {
    formatted = formatUtc(d, variant);
  }

  return (
    <time dateTime={iso} title={iso} suppressHydrationWarning>
      {formatted}
    </time>
  );
}

function formatInZone(
  d: Date,
  variant: "long" | "short",
  timeZone: string,
): string {
  if (variant === "short") {
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone,
    });
  }
  const base = d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
  return `${base} ${zoneShortLabel(timeZone)}`;
}

function formatBrowserLocal(d: Date, variant: "long" | "short"): string {
  if (variant === "short") {
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  const tz =
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "local";
  const base = d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${base} ${zoneShortLabel(tz)}`;
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

function zoneShortLabel(iana: string): string {
  if (!iana) return "local";
  const tail = iana.split("/").pop();
  if (!tail) return iana;
  return tail.replace(/_/g, " ");
}
