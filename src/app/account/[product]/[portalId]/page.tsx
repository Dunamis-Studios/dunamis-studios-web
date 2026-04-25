import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, ChevronDown, Receipt } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/account/section-card";
import { CancelSubscriptionBlock } from "@/components/account/cancel-subscription-block";
import { UpgradeButton } from "@/components/account/upgrade-button";
import { BuyCreditsButton } from "@/components/account/buy-credits-button";
import { BuyPropertyPulseButton } from "@/components/account/buy-property-pulse-button";
import { ManageBillingButton } from "@/components/account/manage-billing-button";
import { getCurrentSession } from "@/lib/session";
import { getEntitlement } from "@/lib/accounts";
import { PRODUCT_META, type Entitlement } from "@/lib/types";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { getTierFeatures } from "@/lib/pricing";
import { productSlugSchema, portalIdSchema } from "@/lib/validation";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ product: string; portalId: string }>;
}): Promise<Metadata> {
  const { product, portalId } = await params;
  const prod = productSlugSchema.safeParse(product);
  if (!prod.success) return { title: "Entitlement not found" };
  return { title: `${PRODUCT_META[prod.data].name} · ${portalId}` };
}

export default async function EntitlementDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ product: string; portalId: string }>;
  searchParams?: Promise<{
    purchase?: string;
    session_id?: string;
  }>;
}) {
  const s = await getCurrentSession();
  if (!s) return null;
  const raw = await params;
  const productParse = productSlugSchema.safeParse(raw.product);
  const portalParse = portalIdSchema.safeParse(raw.portalId);
  if (!productParse.success || !portalParse.success) notFound();

  const entitlement = await getEntitlement(productParse.data, portalParse.data);
  if (!entitlement || entitlement.accountId !== s.account.accountId) {
    notFound();
  }

  const sp = (await searchParams) ?? {};
  const purchaseSignal: "success" | "cancelled" | null =
    sp.purchase === "success"
      ? "success"
      : sp.purchase === "cancelled"
        ? "cancelled"
        : null;

  const meta = PRODUCT_META[entitlement.product];

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/account" },
          { label: entitlement.portalId },
        ]}
      />

      <header className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              entitlement.product === "property-pulse"
                ? "bg-[var(--color-pulse-500)]/15 text-[var(--color-pulse-500)]"
                : "bg-[var(--color-brief-500)]/15 text-[var(--color-brief-500)]",
            )}
            aria-hidden
          >
            <span className="h-2 w-2 rounded-full bg-current" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              {meta.name}
            </div>
            <h1 className="mt-1 font-[var(--font-display)] text-3xl font-medium tracking-tight">
              Portal {entitlement.portalId}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--fg-muted)]">
              <span>{entitlement.portalDomain}</span>
              <span aria-hidden>·</span>
              <span>Installed by {entitlement.installerEmail}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={entitlement.status} />
          {entitlement.tier ? (
            <Badge variant="neutral" className="capitalize">
              {entitlement.tier}
            </Badge>
          ) : null}
          {entitlement.renewalDate ? (
            <span className="text-xs text-[var(--fg-muted)]">
              {entitlement.cancelAtPeriodEnd
                ? `Ends ${formatDate(entitlement.renewalDate)}`
                : `Renews ${formatDate(entitlement.renewalDate)}`}
            </span>
          ) : null}
          {entitlement.product === "debrief" &&
          entitlement.stripeSubscriptionId ? (
            <ManageBillingButton entitlement={entitlement} />
          ) : null}
        </div>
      </header>

      {purchaseSignal ? (
        <PurchaseBanner
          signal={purchaseSignal}
          licenseStatus={entitlement.licenseStatus}
        />
      ) : null}

      <div className="mt-10 space-y-8">
        <CurrentPlanSection
          entitlement={entitlement}
          accountEmail={s.account.email}
        />
        <CreditsSection
          entitlement={entitlement}
          accountEmail={s.account.email}
        />
        <UpcomingChargeSection entitlement={entitlement} />
        <BillingHistorySection entitlement={entitlement} />
        <CancelSubscriptionBlock entitlement={entitlement} />
      </div>
    </>
  );
}

function PurchaseBanner({
  signal,
  licenseStatus,
}: {
  signal: "success" | "cancelled";
  licenseStatus?: Entitlement["licenseStatus"];
}) {
  if (signal === "success") {
    // Webhook may not have landed yet if the user returns fast — the
    // banner says "processing" until licenseStatus flips to "Paid".
    const paid = licenseStatus === "Paid";
    return (
      <div
        role="status"
        className="mt-6 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-3 text-sm"
      >
        <span className="font-medium text-[var(--fg)]">
          {paid ? "Payment complete." : "Payment received."}
        </span>{" "}
        <span className="text-[var(--fg-muted)]">
          {paid
            ? "Your Property Pulse license is active on this portal."
            : "Your license will activate as soon as Stripe confirms — usually a few seconds. Refresh if you don't see it."}
        </span>
      </div>
    );
  }
  return (
    <div
      role="status"
      className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--fg-muted)]"
    >
      Checkout cancelled. No charge was made. You can retry below.
    </div>
  );
}

async function CurrentPlanSection({
  entitlement,
  accountEmail,
}: {
  entitlement: Entitlement;
  accountEmail: string;
}) {
  if (entitlement.product === "property-pulse") {
    return <PropertyPulseLicenseSection entitlement={entitlement} />;
  }

  const features = entitlement.tier ? getTierFeatures(entitlement.tier) : [];

  return (
    <SectionCard title="Current plan" description="Your tier and what's included.">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="font-[var(--font-display)] text-2xl font-medium tracking-tight capitalize">
            {entitlement.tier ?? "No plan"}
          </div>
          {features.length > 0 ? (
            <ul className="mt-4 space-y-2.5">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check
                    className="h-4 w-4 mt-0.5 shrink-0 text-[var(--accent)]"
                    aria-hidden
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--fg-muted)]">
              No plan is assigned to this entitlement yet.
            </p>
          )}
        </div>
        <UpgradeButton
          entitlement={entitlement}
          accountEmail={accountEmail}
        />
      </div>
    </SectionCard>
  );
}

/**
 * Property Pulse has one SKU — flat $49 per portal, one-time. The card
 * either shows the Buy button (pre-purchase) or "License: Paid" with
 * the purchase date and a receipt link (post-purchase). No tier,
 * features, or subscription framing — PP is not a subscription.
 */
async function PropertyPulseLicenseSection({
  entitlement,
}: {
  entitlement: Entitlement;
}) {
  const isPaid = entitlement.licenseStatus === "Paid";
  const isRefunded = entitlement.licenseStatus === "Refunded";

  let receiptUrl: string | null = null;
  if (isPaid && entitlement.stripeCustomerId) {
    receiptUrl = await fetchLatestPpReceiptUrl(
      entitlement.stripeCustomerId,
      entitlement.portalId,
    );
  }

  return (
    <SectionCard
      title="License"
      description="Property Pulse is licensed per portal. One-time $49, no subscription."
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            {isPaid ? (
              <Badge variant="success">Paid</Badge>
            ) : isRefunded ? (
              <Badge variant="danger">Refunded</Badge>
            ) : (
              <Badge variant="neutral">Not purchased</Badge>
            )}
            {isPaid && entitlement.purchasedAt ? (
              <span className="text-sm text-[var(--fg-muted)]">
                Purchased {formatDate(entitlement.purchasedAt)}
              </span>
            ) : null}
          </div>
          {!isPaid && !isRefunded ? (
            <p className="text-sm text-[var(--fg-muted)]">
              Buy a license to unlock full access on this portal.
            </p>
          ) : null}
          {isRefunded ? (
            <p className="text-sm text-[var(--fg-muted)]">
              Your license was refunded. Reach out at{" "}
              <a
                href="mailto:hello@dunamisstudios.net"
                className="text-[var(--accent)] hover:underline"
              >
                hello@dunamisstudios.net
              </a>{" "}
              if you&apos;d like to reinstate it.
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {isPaid && receiptUrl ? (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[var(--accent)] hover:underline"
            >
              View receipt
            </a>
          ) : null}
          {!isPaid && !isRefunded ? (
            <BuyPropertyPulseButton portalId={entitlement.portalId} />
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}

/**
 * Pull the receipt URL for the latest Property Pulse Checkout charge
 * on this customer. Filters by product metadata so the lookup doesn't
 * pick up e.g. a credit-pack receipt if the customer was ever shared
 * across products (shouldn't happen per the per-entitlement-Customer
 * model, but defense-in-depth). Returns null on any failure — the
 * "View receipt" link is nice-to-have, not load-bearing.
 */
async function fetchLatestPpReceiptUrl(
  customerId: string,
  portalId: string,
): Promise<string | null> {
  try {
    const api = stripe();
    const resp = await api.paymentIntents.list({
      customer: customerId,
      limit: 20,
      expand: ["data.latest_charge"],
    });
    const match = resp.data.find(
      (pi) =>
        pi.status === "succeeded" &&
        pi.metadata?.product === "property-pulse" &&
        pi.metadata?.portalId === portalId,
    );
    if (!match) return null;
    const charge = (
      match as unknown as {
        latest_charge?: { receipt_url?: string | null } | string | null;
      }
    ).latest_charge;
    if (charge && typeof charge !== "string") {
      return charge.receipt_url ?? null;
    }
    return null;
  } catch (err) {
    console.warn(
      "[pp-license] receipt lookup failed:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

function CreditsSection({
  entitlement,
  accountEmail,
}: {
  entitlement: Entitlement;
  accountEmail: string;
}) {
  if (entitlement.credits === null) return null;
  const c = entitlement.credits;
  const total = (c.monthly ?? 0) + (c.addon ?? 0);
  const isDebrief = entitlement.product === "debrief";
  // Pre-subscription: no Stripe customer, no subscription. The seeded
  // monthlyAllotment is aspirational, not a real ceiling — the "0 of 50"
  // copy would mislead the user into thinking they have 50 credits worth
  // of headroom on a tier they haven't bought yet.
  const isPreSubscribe =
    !entitlement.stripeSubscriptionId && !entitlement.stripeCustomerId;
  return (
    <SectionCard
      title={
        <span className="flex items-baseline gap-3">
          Credits
          <span className="text-xs font-normal text-[var(--fg-subtle)]">
            Total: {total.toLocaleString()}
          </span>
        </span>
      }
      description="Usage credits attached to this entitlement. Monthly resets each billing period; add-on stacks on top and never expires."
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3 text-sm">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              Monthly
            </div>
            <div className="mt-1 text-[var(--fg)]">
              {isPreSubscribe ? (
                <>
                  <span className="font-mono text-xl font-medium">0</span>
                  <span className="text-[var(--fg-muted)]">
                    {" "}
                    credits · subscribe to unlock your monthly allotment
                  </span>
                </>
              ) : (
                <>
                  <span className="font-mono text-xl font-medium">
                    {(c.monthly ?? 0).toLocaleString()}
                  </span>
                  <span className="text-[var(--fg-muted)]">
                    {" "}
                    of {(c.monthlyAllotment ?? 0).toLocaleString()} remaining ·
                    resets {formatDate(c.currentPeriodEnd)}
                  </span>
                </>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              Add-on
            </div>
            <div className="mt-1 text-[var(--fg)]">
              <span className="font-mono text-xl font-medium">
                {(c.addon ?? 0).toLocaleString()}
              </span>
              <span className="text-[var(--fg-muted)]"> credits · never expire</span>
            </div>
          </div>
        </div>
        {isDebrief ? (
          <BuyCreditsButton
            entitlement={entitlement}
            accountEmail={accountEmail}
          />
        ) : null}
      </div>
    </SectionCard>
  );
}

async function UpcomingChargeSection({
  entitlement,
}: {
  entitlement: Entitlement;
}) {
  // Only Debrief + active subscription + not scheduled to cancel. A
  // cancel-at-period-end subscription has no "next charge"; past_due
  // subs have a failing in-flight invoice that's already in history.
  if (entitlement.product !== "debrief") return null;
  if (!entitlement.stripeSubscriptionId) return null;
  if (!entitlement.stripeCustomerId) return null;
  if (entitlement.cancelAtPeriodEnd) return null;
  if (entitlement.status !== "active") return null;

  type PreviewLine = {
    description?: string | null;
    amount?: number | null;
  };
  type PreviewLike = {
    amount_due?: number;
    currency?: string;
    next_payment_attempt?: number | null;
    period_end?: number;
    lines?: { data?: PreviewLine[] };
  };
  let preview: PreviewLike | null = null;
  try {
    const api = stripe() as unknown as {
      invoices: {
        createPreview: (params: {
          customer: string;
          subscription: string;
        }) => Promise<PreviewLike>;
      };
    };
    preview = await api.invoices.createPreview({
      customer: entitlement.stripeCustomerId,
      subscription: entitlement.stripeSubscriptionId,
    });
  } catch (err) {
    console.warn(
      "[upcoming-charge] createPreview failed — skipping section:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }

  if (!preview || typeof preview.amount_due !== "number") return null;

  const dateIso = preview.next_payment_attempt
    ? new Date(preview.next_payment_attempt * 1000).toISOString()
    : preview.period_end
      ? new Date(preview.period_end * 1000).toISOString()
      : entitlement.renewalDate;

  const lines = (preview.lines?.data ?? [])
    .map((l) => ({
      description:
        typeof l.description === "string" && l.description.trim().length > 0
          ? l.description.trim()
          : "Subscription",
      amountCents: typeof l.amount === "number" ? l.amount : 0,
    }));
  const currency = (preview.currency ?? "usd").toUpperCase();

  return (
    <SectionCard
      title="Upcoming charge"
      description="The next charge Stripe will attempt on this entitlement."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              {formatDate(dateIso)}
            </div>
            <div className="font-[var(--font-display)] text-2xl font-medium tracking-tight text-[var(--fg)]">
              {formatCents(preview.amount_due)}
              <span className="ml-2 text-sm font-normal text-[var(--fg-subtle)]">
                {currency}
              </span>
            </div>
            <UpcomingLineSummary lines={lines} />
          </div>
          <Badge variant="warning" className="self-start">
            Upcoming
          </Badge>
        </div>

        {lines.length > 1 ? (
          <details className="group rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]">
              <span>Show breakdown</span>
              <ChevronDown
                className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <ul className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
              {lines.map((l, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-4 px-4 py-2.5 text-sm"
                >
                  <span className="min-w-0 flex-1 text-[var(--fg)]">
                    {l.description}
                  </span>
                  <span
                    className={cn(
                      "font-mono shrink-0",
                      l.amountCents < 0
                        ? "text-[var(--fg-subtle)]"
                        : "text-[var(--fg)]",
                    )}
                  >
                    {formatCents(l.amountCents)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between gap-4 border-t-2 border-[var(--border-strong)] px-4 py-2.5 text-sm font-medium">
              <span className="text-[var(--fg)]">Total</span>
              <span className="font-mono text-[var(--fg)]">
                {formatCents(preview.amount_due)}{" "}
                <span className="font-normal text-[var(--fg-subtle)]">
                  {currency}
                </span>
              </span>
            </div>
          </details>
        ) : null}
      </div>
    </SectionCard>
  );
}

function UpcomingLineSummary({
  lines,
}: {
  lines: Array<{ description: string; amountCents: number }>;
}) {
  if (lines.length === 0) return null;
  if (lines.length === 1) {
    return (
      <div className="text-sm text-[var(--fg-muted)]">
        {lines[0]!.description}
      </div>
    );
  }
  return (
    <div className="text-sm text-[var(--fg-muted)]">
      {lines.length} line items
    </div>
  );
}

function formatCents(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(cents) / 100;
  return `${negative ? "-" : ""}$${abs.toFixed(2)}`;
}

/**
 * Pull the subscription id off a Stripe Invoice without committing to a
 * specific API-version shape. 2026-03-25.dahlia stashes it under
 * parent.subscription_details.subscription; older releases kept it at
 * the top level. Checks both, returns whichever is set.
 */
function invoiceSubscriptionId(inv: Stripe.Invoice): string | null {
  const parent = (
    inv as unknown as {
      parent?: {
        subscription_details?: { subscription?: string | null };
      };
    }
  ).parent;
  const nested = parent?.subscription_details?.subscription ?? null;
  if (nested) return nested;
  const direct = (inv as unknown as { subscription?: string | null })
    .subscription;
  return direct ?? null;
}

interface BillingRow {
  key: string;
  kind: "invoice" | "pack";
  created: number;
  amountCents: number;
  currency: string;
  status: string;
  primaryUrl: string | null;
  primaryLabel: string;
  pdfUrl: string | null;
  label: string | null;
}

function piInvoiceId(pi: Stripe.PaymentIntent): string | null {
  // Stripe 2026-03-25.dahlia stores the invoice reference on the nested
  // charge, not on the PaymentIntent top-level. Check nested first,
  // fall back to legacy top-level. Mirrors invoiceSubscriptionId().
  const nested = (
    pi as unknown as {
      latest_charge?: { invoice?: string | null } | string | null;
    }
  ).latest_charge;
  if (nested && typeof nested !== "string") {
    const invoice = nested.invoice ?? null;
    if (invoice) return typeof invoice === "string" ? invoice : null;
  }
  const direct = (pi as unknown as { invoice?: string | null }).invoice;
  return direct ?? null;
}

function chargeReceiptUrl(pi: Stripe.PaymentIntent): string | null {
  const charge = (
    pi as unknown as {
      latest_charge?: { receipt_url?: string | null } | string | null;
    }
  ).latest_charge;
  if (charge && typeof charge !== "string") {
    return charge.receipt_url ?? null;
  }
  return null;
}

async function BillingHistorySection({
  entitlement,
}: {
  entitlement: Entitlement;
}) {
  const customerId = entitlement.stripeCustomerId;
  const history = entitlement.subscriptionHistory ?? [];

  const relevantSubIds = new Set<string>(history);
  if (entitlement.stripeSubscriptionId) {
    relevantSubIds.add(entitlement.stripeSubscriptionId);
  }

  let rows: BillingRow[] = [];
  if (customerId && entitlement.product === "debrief") {
    const api = stripe();

    // Fetch invoices + payment intents in parallel. latest_charge is
    // expanded on PIs so we can pick up receipt_url for credit pack
    // rows (which never become invoices).
    const fetchBoth = async (): Promise<{
      invoices: Stripe.Invoice[];
      intents: Stripe.PaymentIntent[];
    }> => {
      try {
        const [invResp, piResp] = await Promise.all([
          api.invoices.list({ customer: customerId, limit: 100 }),
          api.paymentIntents.list({
            customer: customerId,
            limit: 100,
            expand: ["data.latest_charge"],
          }),
        ]);
        return { invoices: invResp.data, intents: piResp.data };
      } catch (err) {
        console.error("[billing-history] stripe fetch failed", err);
        return { invoices: [], intents: [] };
      }
    };

    let { invoices, intents } = await fetchBoth();

    // One 1s retry when a subscription exists but nothing came back —
    // covers the narrow webhook-landed / Stripe-committed race.
    if (
      invoices.length === 0 &&
      intents.length === 0 &&
      relevantSubIds.size > 0
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const retry = await fetchBoth();
      invoices = retry.invoices;
      intents = retry.intents;
    }

    // Invoices → BillingRow. Filter by subscription history so
    // invoices for subs other accounts canceled don't leak in when the
    // Customer is somehow shared (should never happen, but belt +
    // suspenders).
    const invoiceRows: BillingRow[] = invoices
      .filter((inv) => {
        const subId = invoiceSubscriptionId(inv);
        if (subId === null) return true;
        return relevantSubIds.has(subId);
      })
      .map((inv) => ({
        key: `inv:${inv.id ?? Math.random()}`,
        kind: "invoice" as const,
        created: inv.created ?? 0,
        amountCents: invoiceDisplayAmountCents(inv),
        currency: inv.currency ?? "usd",
        status: inv.status ?? "unknown",
        primaryUrl: inv.hosted_invoice_url ?? null,
        primaryLabel: "View",
        pdfUrl: inv.invoice_pdf ?? null,
        label: null,
      }));

    // PaymentIntents → BillingRow. A PI only renders as a credit pack if
    // it's succeeded, has no attached invoice (subscription PIs surface
    // via their invoice above), AND carries the packName/creditAmount
    // metadata we write in /api/stripe/buy-credits. The metadata check
    // is the belt-and-suspenders: if piInvoiceId ever returns a false
    // negative for a subscription PI (Stripe shape drift), the row still
    // won't misclassify.
    const isCreditPack = (pi: Stripe.PaymentIntent): boolean => {
      if (pi.status !== "succeeded") return false;
      if (piInvoiceId(pi)) return false;
      const packName =
        typeof pi.metadata?.packName === "string"
          ? pi.metadata.packName
          : null;
      const creditAmount = Number(pi.metadata?.creditAmount ?? 0);
      return (
        !!packName && Number.isFinite(creditAmount) && creditAmount > 0
      );
    };

    const packRows: BillingRow[] = intents
      .filter(isCreditPack)
      .map((pi) => {
        const packName =
          typeof pi.metadata?.packName === "string"
            ? pi.metadata.packName
            : "";
        const creditAmount = Number(pi.metadata?.creditAmount ?? 0);
        const label = `${creditAmount.toLocaleString()} credits (${packName})`;
        return {
          key: `pi:${pi.id}`,
          kind: "pack" as const,
          created: pi.created ?? 0,
          amountCents: pi.amount_received ?? pi.amount ?? 0,
          currency: pi.currency ?? "usd",
          status: "paid",
          primaryUrl: chargeReceiptUrl(pi),
          primaryLabel: "Receipt",
          pdfUrl: null,
          label,
        };
      });

    rows = [...invoiceRows, ...packRows].sort(
      (a, b) => b.created - a.created,
    );
  }

  const showPortalLink =
    entitlement.product === "debrief" && !!entitlement.stripeCustomerId;

  if (rows.length === 0) {
    return (
      <SectionCard
        title="Billing history"
        description="Invoices for this entitlement."
      >
        <EmptyState
          icon={<Receipt className="h-5 w-5" />}
          title="No invoices yet"
          description="Invoices will appear here once your first charge runs."
        />
        {showPortalLink ? (
          <div className="mt-4 text-center">
            <ManageBillingButton
              entitlement={entitlement}
              variant="link"
              size="sm"
              label="View all in the billing portal"
              showIcon
            />
          </div>
        ) : null}
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Billing history"
      description="Invoices for this entitlement, including prior subscriptions."
    >
      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
            <tr className="text-xs uppercase tracking-wider text-[var(--fg-subtle)]">
              <th className="px-4 py-2.5 text-left font-medium">Date</th>
              <th className="px-4 py-2.5 text-left font-medium">Detail</th>
              <th className="px-4 py-2.5 text-left font-medium">Amount</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className="border-b border-[var(--border)] last:border-0"
              >
                <td className="px-4 py-3 text-[var(--fg)]">
                  {formatDate(new Date(row.created * 1000).toISOString())}
                </td>
                <td className="px-4 py-3 text-[var(--fg-muted)]">
                  {row.kind === "pack"
                    ? (row.label ?? "Credit pack")
                    : "Subscription"}
                </td>
                <td className="px-4 py-3 font-mono text-[var(--fg)]">
                  ${(row.amountCents / 100).toFixed(2)}{" "}
                  <span className="text-[var(--fg-subtle)]">
                    {row.currency.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <InvoiceStatusPill status={row.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    {row.primaryUrl ? (
                      <a
                        href={row.primaryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[var(--accent)] hover:underline"
                      >
                        {row.primaryLabel}
                      </a>
                    ) : null}
                    {row.pdfUrl ? (
                      <a
                        href={row.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
                      >
                        PDF
                      </a>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPortalLink ? (
        <div className="mt-4 flex justify-end">
          <ManageBillingButton
            entitlement={entitlement}
            variant="link"
            size="sm"
            label="View all in the billing portal"
            showIcon
          />
        </div>
      ) : null}
    </SectionCard>
  );
}

/**
 * Voided invoices have amount_paid=0 but often carry a non-zero
 * amount_due. Prefer the total they were originally charged for so
 * $19 shows as $19 even after void — otherwise the row reads $0.00
 * and the user thinks the charge never happened.
 */
function invoiceDisplayAmountCents(inv: Stripe.Invoice): number {
  if (inv.amount_paid && inv.amount_paid > 0) return inv.amount_paid;
  if (inv.amount_due && inv.amount_due > 0) return inv.amount_due;
  return inv.total ?? 0;
}

function InvoiceStatusPill({ status }: { status: string | null }) {
  const s = status ?? "—";
  const variant =
    s === "paid"
      ? "success"
      : s === "open" || s === "draft"
        ? "neutral"
        : s === "uncollectible" || s === "void"
          ? "danger"
          : "neutral";
  return <Badge variant={variant} className="capitalize">{s}</Badge>;
}
