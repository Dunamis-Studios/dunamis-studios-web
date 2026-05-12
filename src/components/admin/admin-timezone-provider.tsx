"use client";

import * as React from "react";

/**
 * Context that carries the admin's preferred IANA timezone (the
 * `timeZone` field saved on their Dunamis account) into every
 * descendant client component, so LocalTime and any other date-
 * formatting surface honor the saved preference rather than always
 * deferring to the browser's clock.
 *
 * `preferredTimeZone` is the resolved string. `null` means the admin
 * has not set one, so consumers should fall back to browser detection.
 * This way the SSR render is deterministic (server can format in the
 * preferred zone directly with no hydration swap) when the admin has
 * a saved preference, and degrades to the previous "UTC then swap to
 * browser" path when they don't.
 */

interface AdminTimezoneContextValue {
  preferredTimeZone: string | null;
}

const Ctx = React.createContext<AdminTimezoneContextValue>({
  preferredTimeZone: null,
});

export function AdminTimezoneProvider({
  preferredTimeZone,
  children,
}: {
  preferredTimeZone: string | null;
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({ preferredTimeZone }),
    [preferredTimeZone],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminPreferredTimeZone(): string | null {
  return React.useContext(Ctx).preferredTimeZone;
}
