"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { pollUntil } from "@/lib/poll";
import { CREDIT_PACKS, type CreditPackName } from "@/lib/pricing";
import type { Entitlement } from "@/lib/types";

let stripeSingleton: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> {
  if (!stripeSingleton) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripeSingleton = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripeSingleton;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entitlement: Entitlement;
  accountEmail: string;
}

export function BuyCreditsModal({
  open,
  onOpenChange,
  entitlement,
  accountEmail,
}: Props) {
  const [selected, setSelected] = React.useState<CreditPackName>("medium");
  React.useEffect(() => {
    if (open) setSelected("medium");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl md:max-h-[90vh] flex flex-col overflow-hidden p-0">
        <div className="shrink-0 border-b border-[var(--border)] px-6 py-5">
          <DialogHeader className="mb-0">
            <DialogTitle>Buy credits</DialogTitle>
            <DialogDescription>
              Credit packs stack on top of your monthly allotment and never
              expire. One-time charge, no subscription change.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="border-b border-[var(--border)] p-6 md:border-b-0 md:border-r md:overflow-y-auto">
            <PackPicker selected={selected} onSelect={setSelected} />
          </div>
          <div className="flex min-h-0 flex-col">
            <PackCheckout
              entitlement={entitlement}
              selected={selected}
              accountEmail={accountEmail}
              onDone={() => onOpenChange(false)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PackPicker({
  selected,
  onSelect,
}: {
  selected: CreditPackName;
  onSelect: (n: CreditPackName) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Credit pack"
      className="grid grid-cols-2 gap-2"
    >
      {CREDIT_PACKS.map((p) => {
        const isSelected = selected === p.name;
        return (
          <button
            key={p.name}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(p.name)}
            className={cn(
              "relative flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
              isSelected
                ? "border-[var(--accent)] bg-[color-mix(in_oklch,var(--accent)_6%,transparent)]"
                : "border-[var(--border)] hover:border-[var(--border-strong)]",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{p.label}</span>
              {p.discountPercent ? (
                <Badge variant="accent" className="text-[10px] py-0">
                  {p.discountPercent}% off
                </Badge>
              ) : null}
            </div>
            <span className="font-mono text-xs text-[var(--fg-muted)]">
              {p.credits.toLocaleString()} credits
            </span>
            <span className="font-[var(--font-display)] text-xl font-medium tracking-tight">
              ${p.dollars}
            </span>
            <span className="text-xs text-[var(--fg-subtle)]">
              ${p.effectiveRate.toFixed(p.effectiveRate < 0.2 ? 3 : 2)} / credit
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PackCheckout({
  entitlement,
  selected,
  accountEmail,
  onDone,
}: {
  entitlement: Entitlement;
  selected: CreditPackName;
  accountEmail: string;
  onDone: () => void;
}) {
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      setError(null);
      setClientSecret(null);
      try {
        const res = await fetch("/api/stripe/buy-credits", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            product: entitlement.product,
            portalId: entitlement.portalId,
            pack: selected,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.clientSecret) {
          setError(data?.error?.message ?? "Couldn't start the purchase.");
          return;
        }
        setClientSecret(data.clientSecret);
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
  }, [selected, entitlement.product, entitlement.portalId]);

  if (error) {
    return (
      <div className="flex flex-col min-h-0 flex-1">
        <div className="flex-1 p-6">
          <div
            role="alert"
            className="rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]"
          >
            {error}
          </div>
        </div>
        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-4">
          <div className="flex justify-end">
            <DialogClose asChild>
              <Button variant="secondary">Close</Button>
            </DialogClose>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret || loading) {
    return (
      <div className="flex flex-col min-h-0 flex-1">
        <div className="flex-1 p-6">
          <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-5 text-sm text-[var(--fg-muted)]">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
              aria-hidden
            />
            Preparing secure checkout…
          </div>
        </div>
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
        selected={selected}
        onDone={onDone}
      />
    </Elements>
  );
}

function CheckoutForm({
  entitlement,
  accountEmail,
  selected,
  onDone,
}: {
  entitlement: Entitlement;
  accountEmail: string;
  selected: CreditPackName;
  onDone: () => void;
}) {
  const stripeSDK = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { push } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [finalizing, setFinalizing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const pack = CREDIT_PACKS.find((p) => p.name === selected)!;

  // Capture the starting addon balance so the poll can detect when the
  // payment_intent.succeeded webhook has incremented it.
  const priorAddonRef = React.useRef(entitlement.credits?.addon ?? 0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripeSDK || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error: confirmError } = await stripeSDK.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?creditsAdded=${pack.credits}`,
      },
      redirect: "if_required",
    });
    if (confirmError) {
      setError(confirmError.message ?? "Payment failed.");
      setSubmitting(false);
      return;
    }

    // Stripe's payment_intent.succeeded webhook drives the addon-bucket
    // increment in Redis. Poll the entitlement until the bucket matches
    // the expected post-purchase balance. Fall back gracefully on timeout.
    setFinalizing(true);
    const expectedAddon = priorAddonRef.current + pack.credits;
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
      (ent) => (ent?.credits?.addon ?? 0) >= expectedAddon,
      { intervalMs: 500, timeoutMs: 10_000 },
    );

    if (matched) {
      push({
        kind: "success",
        title: `${pack.credits.toLocaleString()} credits added`,
      });
    } else {
      push({
        kind: "info",
        title: "Your purchase is processing",
        description: "Refresh in a moment to see the new balance.",
      });
    }
    onDone();
    router.refresh();
    setFinalizing(false);
    setSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 md:overflow-y-auto p-6">
        <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] mb-3">
          <span className="flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5" aria-hidden />
            One-time charge · billed to {accountEmail}
          </span>
          <span className="flex items-center gap-1 text-[var(--fg)]">
            <Check
              className="h-3.5 w-3.5 text-[var(--color-success)]"
              aria-hidden
            />
            Credits never expire
          </span>
        </div>
        {finalizing ? (
          <div className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-4 text-sm text-[var(--fg-muted)]">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
              aria-hidden
            />
            Finalizing your purchase — waiting on Stripe&apos;s confirmation
            webhook.
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <PaymentElement options={{ layout: "tabs" }} />
          </div>
        )}
        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]"
          >
            {error}
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-4">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
              : `Buy ${pack.credits.toLocaleString()} credits`}
          </Button>
        </div>
      </div>
    </form>
  );
}
