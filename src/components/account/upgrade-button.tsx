"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { SubscribeModal } from "./subscribe-modal";
import type { Entitlement } from "@/lib/types";

interface Props {
  entitlement: Entitlement;
  accountEmail: string;
  variant?: "secondary" | "primary";
  label?: string;
}

/**
 * Wraps the SubscribeModal in a trigger button. Used in two places:
 *   - Current plan section header → "Upgrade plan" / "Change plan"
 *   - Empty-state prompts          → configurable label
 */
export function UpgradeButton({
  entitlement,
  accountEmail,
  variant = "secondary",
  label,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const defaultLabel = entitlement.stripeSubscriptionId
    ? "Change plan"
    : "Upgrade plan";
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {label ?? defaultLabel}
      </Button>
      <SubscribeModal
        open={open}
        onOpenChange={setOpen}
        entitlement={entitlement}
        accountEmail={accountEmail}
      />
    </>
  );
}
