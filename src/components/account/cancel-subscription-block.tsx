"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SectionCard } from "./section-card";
import { Button } from "@/components/ui/button";
import { HintTooltip } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import type { Entitlement } from "@/lib/types";

/**
 * Three states this block can render:
 *   1. Debrief entitlement with an active subscription
 *        → confirm dialog + "Cancel subscription" button
 *   2. Debrief entitlement scheduled for cancellation
 *        → "Ending on X" banner + Reactivate button
 *   3. Anything else (no sub, or Property Pulse)
 *        → disabled "Billing coming soon" (unchanged legacy behavior)
 */
export function CancelSubscriptionBlock({
  entitlement,
}: {
  entitlement: Entitlement;
}) {
  const isDebrief = entitlement.product === "debrief";
  const hasSubscription = !!entitlement.stripeSubscriptionId;
  const scheduledCancel =
    entitlement.cancelAtPeriodEnd === true &&
    entitlement.status !== "canceled";

  if (!isDebrief || !hasSubscription) {
    return (
      <SectionCard
        danger
        title="Danger zone"
        description="Cancel this entitlement's subscription."
      >
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--fg-muted)]">
            {isDebrief
              ? "There's no active subscription on this entitlement yet."
              : "Cancellation will keep the entitlement active through the end of the current paid period."}
          </p>
          <HintTooltip
            content={
              isDebrief
                ? "Start a subscription first."
                : "Billing coming soon. Cancellation will be available once Stripe is wired up."
            }
          >
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

  if (scheduledCancel) {
    return <ReactivateBlock entitlement={entitlement} />;
  }

  return <CancelBlock entitlement={entitlement} />;
}

function CancelBlock({ entitlement }: { entitlement: Entitlement }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = React.useState(false);

  async function onCancel() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product: entitlement.product,
          portalId: entitlement.portalId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        push({
          kind: "error",
          title: "Cancellation failed",
          description: data?.error?.message,
        });
        return;
      }
      push({
        kind: "success",
        title: "Subscription will end at period close",
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      danger
      title="Danger zone"
      description="Cancel this entitlement's subscription."
    >
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--fg-muted)]">
          Cancellation keeps the entitlement active through the end of the
          current paid period, then moves it to ‘canceled’. You can reactivate
          any time before the period ends.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="danger">Cancel subscription</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel this subscription?</DialogTitle>
              <DialogDescription>
                You&apos;ll keep access until{" "}
                <span className="font-medium text-[var(--fg)]">
                  {formatDate(entitlement.renewalDate)}
                </span>
                . Reactivate anytime before then and nothing changes.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Keep subscription</Button>
              </DialogClose>
              <Button
                variant="danger"
                onClick={onCancel}
                loading={loading}
              >
                Yes, cancel at period end
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SectionCard>
  );
}

function ReactivateBlock({ entitlement }: { entitlement: Entitlement }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = React.useState(false);

  async function onReactivate() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/reactivate-subscription", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product: entitlement.product,
          portalId: entitlement.portalId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        push({
          kind: "error",
          title: "Reactivation failed",
          description: data?.error?.message,
        });
        return;
      }
      push({ kind: "success", title: "Subscription reactivated" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      danger
      title="Subscription scheduled to end"
      description={`Access continues through ${formatDate(entitlement.renewalDate)}.`}
    >
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--fg-muted)]">
          Your plan will move to <span className="font-medium">canceled</span>{" "}
          on{" "}
          <span className="font-mono text-[var(--fg)]">
            {formatDate(entitlement.renewalDate)}
          </span>
          . Reactivate now to keep things running.
        </p>
        <Button onClick={onReactivate} loading={loading}>
          Reactivate subscription
        </Button>
      </div>
    </SectionCard>
  );
}
