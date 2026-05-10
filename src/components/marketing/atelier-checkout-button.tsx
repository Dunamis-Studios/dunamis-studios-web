"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

/**
 * Client button that initiates Atelier Stripe Checkout. POSTs to
 * /api/atelier/checkout (which already requires the cookie session
 * gated by AtelierPurchaseGate's signed-in branch) and redirects to
 * the returned Stripe-hosted URL.
 *
 * On error, shows an inline message instead of throwing — the gate
 * doesn't unmount, so the customer can retry or sign out and try
 * from a different account without losing context.
 */
export function AtelierCheckoutButton({
  children,
}: {
  children: React.ReactNode;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/atelier/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        setError(
          data?.message ?? data?.error ?? "Could not start checkout. Try again.",
        );
        return;
      }
      // Send the buyer to Stripe. Don't open a new tab — the browser
      // history reads naturally as "product page → Stripe → post-
      // checkout return", and a new tab loses the post-purchase deep
      // link back into Atelier on customers who close their main tab.
      window.location.assign(data.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <Button onClick={onClick} disabled={busy} size="lg">
        {busy ? "Starting checkout…" : children}
      </Button>
      {error ? (
        <p
          role="alert"
          className="max-w-md text-xs text-[var(--color-danger)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
