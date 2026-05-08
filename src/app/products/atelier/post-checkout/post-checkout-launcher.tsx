"use client";

import { useEffect, useState } from "react";

interface Props {
  sessionId: string | null;
}

/**
 * Client-side launcher: navigates the browser to the
 * `atelier://atelier/post-checkout?session_id=…` URL on mount, which
 * activates the OS-registered deep-link handler the desktop installs.
 *
 * Browser security disallows arbitrary same-tab navigation to custom
 * schemes from server HTML, so this runs as a client effect after the
 * page hydrates. We give the browser ~250ms to take the navigation,
 * then surface a manual "open the app" link as a fallback for the case
 * where the deep-link handler didn't fire (uninstalled, foreign
 * machine, blocked by browser policy, etc.).
 *
 * The deep-link path mirrors the existing Sync flow — see
 * `src-tauri/src/lib.rs` for the `atelier://` listener.
 */
export function PostCheckoutLauncher({ sessionId }: Props) {
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const url = `atelier://atelier/post-checkout?session_id=${encodeURIComponent(sessionId)}`;
    window.location.href = url;
    const t = window.setTimeout(() => setLaunched(true), 250);
    return () => window.clearTimeout(t);
  }, [sessionId]);

  if (!sessionId) {
    return (
      <p className="mt-6 text-sm text-[var(--fg-muted)]">
        We couldn&apos;t read your checkout session. Open Atelier and sign
        in again — your license is on your account.
      </p>
    );
  }

  if (!launched) {
    return (
      <p className="mt-6 text-sm text-[var(--fg-muted)]">
        Returning to Atelier…
      </p>
    );
  }

  const url = `atelier://atelier/post-checkout?session_id=${encodeURIComponent(sessionId)}`;
  return (
    <p className="mt-6 text-sm text-[var(--fg-muted)]">
      Atelier didn&apos;t open?{" "}
      <a className="underline" href={url}>
        Click here to retry
      </a>
      .
    </p>
  );
}
