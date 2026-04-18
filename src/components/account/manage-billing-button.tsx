"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Entitlement } from "@/lib/types";

/**
 * Redirects the user to their Stripe Billing Portal session. Rendered
 * in a few places: the entitlement header (as a small secondary
 * button) and below the billing-history table (as a text link).
 */
export function ManageBillingButton({
  entitlement,
  variant = "secondary",
  size = "sm",
  label = "Manage billing",
  showIcon = true,
}: {
  entitlement: Entitlement;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  label?: string;
  showIcon?: boolean;
}) {
  const { push } = useToast();
  const [loading, setLoading] = React.useState(false);

  async function open() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product: entitlement.product,
          portalId: entitlement.portalId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        push({
          kind: "error",
          title: "Couldn't open billing portal",
          description: data?.error?.message,
        });
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size={size} variant={variant} onClick={open} loading={loading}>
      {label}
      {showIcon ? (
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      ) : null}
    </Button>
  );
}
