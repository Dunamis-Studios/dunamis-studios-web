"use client";

import { SectionCard } from "./section-card";
import { Button } from "@/components/ui/button";
import { HintTooltip } from "@/components/ui/tooltip";

export function CancelSubscriptionBlock() {
  return (
    <SectionCard
      danger
      title="Danger zone"
      description="Cancel this entitlement's subscription."
    >
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--fg-muted)]">
          Cancellation keeps the entitlement active through the end of the
          current paid period, then moves it to ‘canceled’.
        </p>
        <HintTooltip content="Billing coming soon — cancellation will be available once Stripe is wired up.">
          <span tabIndex={0} className="inline-flex">
            <Button variant="danger" disabled aria-disabled>
              Cancel subscription
            </Button>
          </span>
        </HintTooltip>
      </div>
    </SectionCard>
  );
}
