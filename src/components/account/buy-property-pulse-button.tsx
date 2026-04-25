"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * Triggers the Property Pulse one-time license checkout. Calls
 * /api/stripe/create-one-time-checkout, receives a hosted Stripe
 * Checkout URL, and redirects the browser to it. Stripe handles the
 * payment UI; the session.completed webhook stamps the entitlement and
 * Stripe redirects back to /account/property-pulse/{portalId}?purchase=success.
 */
export function BuyPropertyPulseButton({
  portalId,
  variant = "primary",
  label,
}: {
  portalId: string;
  variant?: "primary" | "secondary";
  label?: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const { push } = useToast();

  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-one-time-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "property-pulse", portalId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;
        push({
          kind: "error",
          title: "Couldn't start checkout",
          description: body?.message ?? "Please try again in a moment.",
        });
        setLoading(false);
        return;
      }
      const { url } = (await res.json()) as { url: string };
      window.location.assign(url);
    } catch (err) {
      console.error("[buy-property-pulse] create session failed", err);
      push({
        kind: "error",
        title: "Couldn't start checkout",
        description: "Network error. Please try again.",
      });
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      onClick={go}
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? "Starting checkout…" : (label ?? "Buy license — $49")}
    </Button>
  );
}
