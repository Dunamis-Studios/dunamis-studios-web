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
import { getCurrentSession } from "@/lib/session";
import { getEntitlement } from "@/lib/accounts";
import { PRODUCT_META, type Entitlement, type EntitlementTier } from "@/lib/types";
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

const TIER_FEATURES: Record<EntitlementTier, string[]> = {
  starter: ["Core product functionality", "Email support", "7-day audit history"],
  pro: [
    "Everything in Starter",
    "Advanced rules & automations",
    "Priority support",
    "90-day audit history",
  ],
  enterprise: [
    "Everything in Pro",
    "SSO + SCIM",
    "Data residency controls",
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
          { label: meta.name, href: `/products/${entitlement.product}` },
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
              Renews {formatDate(entitlement.renewalDate)}
            </span>
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
        <BillingHistorySection />
        <CancelSubscriptionBlock />
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
  const features =
    entitlement.tier ? TIER_FEATURES[entitlement.tier] : [];
  const isDebrief = entitlement.product === "debrief";

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
              <span className="font-mono text-xl font-medium">
                {(c.monthly ?? 0).toLocaleString()}
              </span>
              <span className="text-[var(--fg-muted)]">
                {" "}
                of {(c.monthlyAllotment ?? 0).toLocaleString()} remaining · resets{" "}
                {formatDate(c.currentPeriodEnd)}
              </span>
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

function BillingHistorySection() {
  return (
    <SectionCard
      title="Billing history"
      description="Invoices for this entitlement."
    >
      <EmptyState
        icon={<Receipt className="h-5 w-5" />}
        title="No invoices yet"
        description="Invoices will appear here once Stripe is wired up and your first charge runs."
      />
    </SectionCard>
  );
}
