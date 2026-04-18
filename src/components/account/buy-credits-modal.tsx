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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Buy credits</DialogTitle>
          <DialogDescription>
            Credit packs stack on top of your monthly allotment and never
            expire. One-time charge, no subscription change.
          </DialogDescription>
        </DialogHeader>

        <PackPicker selected={selected} onSelect={setSelected} />

        <PackCheckout
          entitlement={entitlement}
          selected={selected}
          accountEmail={accountEmail}
          onDone={() => onOpenChange(false)}
        />
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
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
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
      <div
        role="alert"
        className="rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]"
      >
        {error}
      </div>
    );
  }

  if (!clientSecret || loading) {
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
        accountEmail={accountEmail}
        selected={selected}
        onDone={onDone}
      />
    </Elements>
  );
}

function CheckoutForm({
  accountEmail,
  selected,
  onDone,
}: {
  accountEmail: string;
  selected: CreditPackName;
  onDone: () => void;
}) {
  const stripeSDK = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { push } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const pack = CREDIT_PACKS.find((p) => p.name === selected)!;

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
    push({
      kind: "success",
      title: `${pack.credits.toLocaleString()} credits added`,
      description: "Your balance will update in a moment.",
    });
    onDone();
    router.refresh();
    setSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
        <div className="flex items-center justify-between text-xs text-[var(--fg-muted)]">
          <span className="flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5" aria-hidden />
            One-time charge · billed to {accountEmail}
          </span>
          <span className="flex items-center gap-1 text-[var(--fg)]">
            <Check className="h-3.5 w-3.5 text-[var(--color-success)]" aria-hidden />
            Credits never expire
          </span>
        </div>
        <div className="mt-4">
          <PaymentElement options={{ layout: "tabs" }} />
        </div>
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
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" loading={submitting} disabled={!stripeSDK}>
          Buy {pack.credits.toLocaleString()} credits
        </Button>
      </DialogFooter>
    </form>
  );
}
