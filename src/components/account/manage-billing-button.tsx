"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Entitlement } from "@/lib/types";

export function ManageBillingButton({
  entitlement,
}: {
  entitlement: Entitlement;
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
    <Button size="sm" variant="secondary" onClick={open} loading={loading}>
      Manage billing
      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
    </Button>
  );
}
