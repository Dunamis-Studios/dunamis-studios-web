"use client";

import * as React from "react";
import { Check, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { pollUntil } from "@/lib/poll";
import {
  DEBRIEF_TIERS,
  DEBRIEF_TIER_ORDER,
} from "@/lib/pricing";
import type { Entitlement, EntitlementTier } from "@/lib/types";

// Lazily resolve once per browser session. Null-safe when env is absent
// (build-time pages that render this component don't crash).
let stripeSingleton: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> {
  if (!stripeSingleton) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripeSingleton = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripeSingleton;
}

interface SubscribeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entitlement: Entitlement;
  accountEmail: string;
}

/**
 * Tier-selection + Stripe Elements modal for Debrief subscriptions.
 * Two branches:
 *   - No existing subscription → create + confirm PaymentElement.
 *   - Existing subscription     → change plan via API, no Elements.
 */
export function SubscribeModal({
  open,
  onOpenChange,
  entitlement,
  accountEmail,
}: SubscribeModalProps) {
  const isChangePlan = !!entitlement.stripeSubscriptionId;
  const currentTier = entitlement.tier;
  const initialTier = pickInitialTier(currentTier);

  const [selectedTier, setSelectedTier] =
    React.useState<EntitlementTier>(initialTier);
  React.useEffect(() => {
    if (open) setSelectedTier(initialTier);
  }, [open, initialTier]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isChangePlan ? "Change plan" : "Start a Debrief subscription"}
          </DialogTitle>
          <DialogDescription>
            Portal {entitlement.portalId} · {entitlement.portalDomain}. All
            tiers billed monthly in USD. Upgrade, downgrade, or cancel any
            time.
          </DialogDescription>
        </DialogHeader>

        <TierPicker
          selectedTier={selectedTier}
          onSelect={setSelectedTier}
          currentTier={currentTier}
        />

        {isChangePlan ? (
          <ChangePlanActions
            entitlement={entitlement}
            selectedTier={selectedTier}
            currentTier={currentTier}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <CreateSubscriptionCheckout
            entitlement={entitlement}
            selectedTier={selectedTier}
            accountEmail={accountEmail}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function pickInitialTier(currentTier: EntitlementTier | null): EntitlementTier {
  if (!currentTier) return "pro";
  if (currentTier === "enterprise") return "enterprise";
  // Suggest the next tier up as the default upgrade.
  const i = DEBRIEF_TIER_ORDER.indexOf(currentTier);
  return DEBRIEF_TIER_ORDER[Math.min(i + 1, DEBRIEF_TIER_ORDER.length - 1)]!;
}

// --------------------------------------------------------------------------
// Tier picker
// --------------------------------------------------------------------------

function TierPicker({
  selectedTier,
  onSelect,
  currentTier,
}: {
  selectedTier: EntitlementTier;
  onSelect: (t: EntitlementTier) => void;
  currentTier: EntitlementTier | null;
}) {
  // Hide Enterprise only if the portal is already on Enterprise.
  const tiers = DEBRIEF_TIER_ORDER.filter(
    (t) => !(currentTier === "enterprise" && t === "enterprise"),
  );
  const spec = DEBRIEF_TIERS[selectedTier];
  return (
    <div className="flex flex-col gap-4">
      <div
        role="radiogroup"
        aria-label="Subscription tier"
        className="grid grid-cols-3 gap-2"
      >
        {tiers.map((t) => {
          const tierSpec = DEBRIEF_TIERS[t];
          const selected = selectedTier === t;
          const current = currentTier === t;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(t)}
              className={cn(
                "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                selected
                  ? "border-[var(--accent)] bg-[color-mix(in_oklch,var(--accent)_6%,transparent)]"
                  : "border-[var(--border)] hover:border-[var(--border-strong)]",
              )}
            >
              <span className="flex items-center justify-between">
                <span className="text-sm font-medium">{tierSpec.label}</span>
                {current ? (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
                    Current
                  </span>
                ) : null}
              </span>
              <span className="font-mono text-xs text-[var(--fg-muted)]">
                ${tierSpec.monthlyDollars} / mo
              </span>
              <span className="text-xs text-[var(--fg-subtle)]">
                {tierSpec.monthlyAllotment} credits / mo
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              {spec.label}
            </div>
            <div className="mt-1 font-[var(--font-display)] text-2xl font-medium tracking-tight">
              ${spec.monthlyDollars}
              <span className="text-sm font-normal text-[var(--fg-muted)]">
                {" "}
                / portal / month
              </span>
            </div>
          </div>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm">
          {spec.features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check
                className="h-4 w-4 mt-0.5 shrink-0 text-[var(--color-brief-500)]"
                aria-hidden
              />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Change-plan path (existing subscription, payment method on file)
// --------------------------------------------------------------------------

function ChangePlanActions({
  entitlement,
  selectedTier,
  currentTier,
  onDone,
}: {
  entitlement: Entitlement;
  selectedTier: EntitlementTier;
  currentTier: EntitlementTier | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const sameTier = selectedTier === currentTier;

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/change-plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product: entitlement.product,
          portalId: entitlement.portalId,
          tier: selectedTier,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Couldn't change plan.");
        return;
      }
      push({
        kind: "success",
        title: `Plan change queued`,
        description:
          "Stripe will prorate the difference and your dashboard will update in a moment.",
      });
      onDone();
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error ? (
        <div
          role="alert"
          className="rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]"
        >
          {error}
        </div>
      ) : null}
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary">Cancel</Button>
        </DialogClose>
        <Button
          onClick={submit}
          disabled={sameTier}
          loading={loading}
        >
          {sameTier
            ? `Already on ${DEBRIEF_TIERS[selectedTier].label}`
            : `Switch to ${DEBRIEF_TIERS[selectedTier].label}`}
        </Button>
      </DialogFooter>
    </>
  );
}

// --------------------------------------------------------------------------
// Create-subscription path (SetupIntent-first — new Customer or no active sub)
// --------------------------------------------------------------------------

function CreateSubscriptionCheckout({
  entitlement,
  selectedTier,
  accountEmail,
  onDone,
}: {
  entitlement: Entitlement;
  selectedTier: EntitlementTier;
  accountEmail: string;
  onDone: () => void;
}) {
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [setupIntentId, setSetupIntentId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // SetupIntent is tier-agnostic. Create it ONCE on mount and reuse it
  // across tier changes — the tier only matters at subscription-create
  // time (step 2 of the two-step flow).
  React.useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      setError(null);
      setClientSecret(null);
      setSetupIntentId(null);
      try {
        const res = await fetch("/api/stripe/create-setup-intent", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            product: entitlement.product,
            portalId: entitlement.portalId,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.clientSecret || !data.setupIntentId) {
          setError(data?.error?.message ?? "Couldn't initialize checkout.");
          return;
        }
        setClientSecret(data.clientSecret);
        setSetupIntentId(data.setupIntentId);
      } catch {
        if (!cancelled) setError("Network error — please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [entitlement.product, entitlement.portalId]);

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]"
      >
        {error}
      </div>
    );
  }

  if (!clientSecret || !setupIntentId || loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-5 text-sm text-[var(--fg-muted)]">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
        Preparing secure checkout…
      </div>
    );
  }

  return (
    <Elements
      key={clientSecret}
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#6d5cf5",
            colorBackground: "transparent",
            colorText: "#eaeaea",
            colorDanger: "#ef4444",
            fontFamily: "system-ui, sans-serif",
            borderRadius: "8px",
          },
        },
      }}
    >
      <CheckoutForm
        entitlement={entitlement}
        accountEmail={accountEmail}
        selectedTier={selectedTier}
        setupIntentId={setupIntentId}
        onDone={onDone}
      />
    </Elements>
  );
}

function CheckoutForm({
  entitlement,
  accountEmail,
  selectedTier,
  setupIntentId,
  onDone,
}: {
  entitlement: Entitlement;
  accountEmail: string;
  selectedTier: EntitlementTier;
  setupIntentId: string;
  onDone: () => void;
}) {
  const stripeSDK = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { push } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [finalizing, setFinalizing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Snapshot before the flow starts so the poll can detect "webhook
  // landed" by comparing the new subscriptionId against what we had.
  // Almost always null on the new-sub path; captured defensively so
  // re-subscribe after cancel doesn't false-positive on the old id.
  const priorSubscriptionIdRef = React.useRef(entitlement.stripeSubscriptionId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripeSDK || !elements) return;
    setSubmitting(true);
    setError(null);

    // Step 1 — attach the payment method to the customer via the
    // SetupIntent. No charge happens here.
    const { error: setupError } = await stripeSDK.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?subscribed=1`,
      },
      redirect: "if_required",
    });
    if (setupError) {
      setError(setupError.message ?? "Couldn't save your payment method.");
      setSubmitting(false);
      return;
    }

    // Step 2 — create the subscription with the confirmed SetupIntent.
    let createResp: Response;
    try {
      createResp = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product: entitlement.product,
          portalId: entitlement.portalId,
          tier: selectedTier,
          setupIntentId,
        }),
      });
    } catch {
      setError("Network error while creating subscription.");
      setSubmitting(false);
      return;
    }
    const createData = await createResp.json().catch(() => null);
    if (!createResp.ok || !createData) {
      setError(
        createData?.error?.message ?? "Subscription could not be created.",
      );
      setSubmitting(false);
      return;
    }

    // Step 3 — 3DS handoff. If Stripe needs an authentication challenge,
    // the subscription is live-but-incomplete and the backend hands us
    // a PaymentIntent client_secret to confirm the first invoice.
    if (createData.requires3DS && createData.clientSecret) {
      const { error: threeDsError, paymentIntent } =
        await stripeSDK.confirmCardPayment(createData.clientSecret);
      if (threeDsError) {
        setError(
          threeDsError.message ?? "3D Secure authentication failed.",
        );
        setSubmitting(false);
        return;
      }
      if (paymentIntent?.status !== "succeeded") {
        setError(
          `Payment is ${paymentIntent?.status ?? "pending"} — please retry.`,
        );
        setSubmitting(false);
        return;
      }
    }

    // Step 4 — Finalizing. The Stripe response is already back with
    // success, but the customer.subscription.created webhook is
    // asynchronous. Poll the entitlement endpoint until Redis reflects
    // the new subscription, then close. If the webhook is slow, fall
    // back to closing anyway after 10s with a softer toast — the page
    // will hydrate correctly once the webhook does land + the user
    // refreshes.
    setFinalizing(true);
    const priorSubId = priorSubscriptionIdRef.current;

    const { matched } = await pollUntil<Entitlement | null>(
      async () => {
        const res = await fetch(
          `/api/entitlements/${entitlement.product}/${entitlement.portalId}`,
          { cache: "no-store" },
        );
        if (!res.ok) return null;
        const data = await res.json().catch(() => null);
        return (data?.entitlement as Entitlement | undefined) ?? null;
      },
      (ent) =>
        !!ent?.stripeSubscriptionId &&
        ent.stripeSubscriptionId !== priorSubId,
      { intervalMs: 500, timeoutMs: 10_000 },
    );

    if (matched) {
      push({
        kind: "success",
        title: "Subscription active",
      });
    } else {
      push({
        kind: "info",
        title: "Your subscription is processing",
        description: "Refresh in a moment to see updates.",
      });
    }
    onDone();
    router.refresh();
    setFinalizing(false);
    setSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
        <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
          <CreditCard className="h-3.5 w-3.5" aria-hidden />
          Payment · billed to {accountEmail}
        </div>
        {finalizing ? (
          <div className="mt-4 flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-4 text-sm text-[var(--fg-muted)]">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
              aria-hidden
            />
            Finalizing your subscription — hang tight, we&apos;re waiting on
            Stripe&apos;s confirmation webhook.
          </div>
        ) : (
          <div className="mt-4">
            <PaymentElement options={{ layout: "tabs" }} />
          </div>
        )}
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]"
        >
          {error}
        </div>
      ) : null}

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary" disabled={finalizing}>
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="submit"
          loading={submitting}
          disabled={!stripeSDK || finalizing}
        >
          {finalizing
            ? "Finalizing…"
            : `Start ${DEBRIEF_TIERS[selectedTier].label} subscription`}
        </Button>
      </DialogFooter>
    </form>
  );
}
