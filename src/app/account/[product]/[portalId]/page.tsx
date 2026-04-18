import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Receipt } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { HintTooltip } from "@/components/ui/tooltip";
import { SectionCard } from "@/components/account/section-card";
import { CancelSubscriptionBlock } from "@/components/account/cancel-subscription-block";
import { UpgradeButton } from "@/components/account/upgrade-button";
import { BuyCreditsButton } from "@/components/account/buy-credits-button";
import { ManageBillingButton } from "@/components/account/manage-billing-button";
import { getCurrentSession } from "@/lib/session";
import { getEntitlement } from "@/lib/accounts";
import { PRODUCT_META, type Entitlement, type EntitlementTier } from "@/lib/types";
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

/**
 * Property Pulse has no canonical pricing source yet (out of scope), so
 * we keep a stub feature list here. Debrief reads from pricing.ts via
 * getTierFeatures so it matches the pricing page and subscribe modal.
 */
const PROPERTY_PULSE_TIER_FEATURES: Record<EntitlementTier, string[]> = {
  starter: [
    "1 pipeline",
    "Up to 3 health rules",
    "Daily rollup email",
    "7-day audit history",
    "Email support",
  ],
  pro: [
    "Unlimited pipelines",
    "Unlimited health rules",
    "Staleness + drift timers",
    "Inline remediation",
    "90-day audit history",
    "Priority support",
  ],
  enterprise: [
    "Everything in Pro",
    "SSO + SCIM",
    "Data residency",
    "Custom SLAs",
    "Dedicated engineer",
  ],
};

export default async function EntitlementDetailPage({
  params,
}: {
  params: Promise<{ product: string; portalId: string }>;
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

      <div className="mt-10 space-y-8">
        <CurrentPlanSection
          entitlement={entitlement}
          accountEmail={s.account.email}
        />
        <CreditsSection
          entitlement={entitlement}
          accountEmail={s.account.email}
        />
        <BillingHistorySection entitlement={entitlement} />
        <CancelSubscriptionBlock entitlement={entitlement} />
      </div>
    </>
  );
}

function CurrentPlanSection({
  entitlement,
  accountEmail,
}: {
  entitlement: Entitlement;
  accountEmail: string;
}) {
  const isDebrief = entitlement.product === "debrief";
  const features = entitlement.tier
    ? isDebrief
      ? getTierFeatures(entitlement.tier)
      : PROPERTY_PULSE_TIER_FEATURES[entitlement.tier]
    : [];

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
        {isDebrief ? (
          <UpgradeButton
            entitlement={entitlement}
            accountEmail={accountEmail}
          />
        ) : (
          <HintTooltip content="Billing is coming soon. Plan changes will be available once Stripe is wired up.">
            <span tabIndex={0} className="inline-flex">
              <Button variant="secondary" disabled aria-disabled>
                Upgrade plan
              </Button>
            </span>
          </HintTooltip>
        )}
      </div>
    </SectionCard>
  );
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

async function BillingHistorySection({
  entitlement,
}: {
  entitlement: Entitlement;
}) {
  const customerId = entitlement.stripeCustomerId;
  const subscriptionId = entitlement.stripeSubscriptionId;

  let invoices: Stripe.Invoice[] = [];
  if (customerId && entitlement.product === "debrief") {
    // Prefer the server-side subscription filter — Stripe's 2026-03-25
    // invoice shape moved the subscription ref around, and the server
    // filter is the canonical path regardless of shape drift.
    const listInvoices = async (): Promise<Stripe.Invoice[]> => {
      try {
        const resp = await stripe().invoices.list(
          subscriptionId
            ? { customer: customerId, subscription: subscriptionId, limit: 24 }
            : { customer: customerId, limit: 24 },
        );
        return resp.data;
      } catch (err) {
        console.error("[billing-history] stripe fetch failed", err);
        return [];
      }
    };

    invoices = await listInvoices();

    // An active subscription with zero invoices usually means Stripe
    // hasn't finished committing the first invoice server-side. One
    // 1s retry covers that race — every other scenario (no sub,
    // canceled sub) bails before this line.
    if (invoices.length === 0 && subscriptionId) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      invoices = await listInvoices();
    }
  }

  if (invoices.length === 0) {
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
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Billing history"
      description="Invoices for this entitlement."
    >
      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
            <tr className="text-xs uppercase tracking-wider text-[var(--fg-subtle)]">
              <th className="px-4 py-2.5 text-left font-medium">Date</th>
              <th className="px-4 py-2.5 text-left font-medium">Amount</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="border-b border-[var(--border)] last:border-0"
              >
                <td className="px-4 py-3 text-[var(--fg)]">
                  {formatDate(
                    inv.created
                      ? new Date(inv.created * 1000).toISOString()
                      : null,
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-[var(--fg)]">
                  ${(inv.amount_paid / 100).toFixed(2)}{" "}
                  <span className="text-[var(--fg-subtle)]">
                    {inv.currency?.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <InvoiceStatusPill status={inv.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    {inv.hosted_invoice_url ? (
                      <a
                        href={inv.hosted_invoice_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[var(--accent)] hover:underline"
                      >
                        View
                      </a>
                    ) : null}
                    {inv.invoice_pdf ? (
                      <a
                        href={inv.invoice_pdf}
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
    </SectionCard>
  );
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
