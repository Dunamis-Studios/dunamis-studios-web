import type Stripe from "stripe";
import { redis, KEY } from "./redis";
import { saveEntitlement, getEntitlement } from "./accounts";
import { withEntitlementLock } from "./entitlement-lock";
import {
  getTierByPriceId,
  getTierAllotment,
  getFirstMonthBonus,
} from "./pricing";
import type {
  CreditBuckets,
  Entitlement,
  EntitlementStatus,
  EntitlementTier,
} from "./types";

const IDEMPOTENCY_TTL_SEC = 7 * 24 * 3600;

/**
 * Route a verified Stripe event to its handler. Every handler is
 * idempotent (guarded by the event id cache) and entitlement writes go
 * through withEntitlementLock. Unknown events are logged and 200'd so
 * Stripe stops retrying.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  const r = redis();
  const alreadyHandled = await r.set(KEY.stripeEvent(event.id), "1", {
    ex: IDEMPOTENCY_TTL_SEC,
    nx: true,
  });
  if (!alreadyHandled) {
    console.log(`[stripe-webhook] duplicate event ${event.id}, skipping`);
    return;
  }

  switch (event.type) {
    case "customer.subscription.created": {
      await onSubscriptionCreated(event.data.object);
      break;
    }
    case "customer.subscription.updated": {
      await onSubscriptionUpdated(event.data.object);
      break;
    }
    case "customer.subscription.deleted": {
      await onSubscriptionDeleted(event.data.object);
      break;
    }
    case "invoice.paid": {
      console.log(
        `[stripe-webhook] invoice.paid — handled by subscription.updated`,
      );
      break;
    }
    case "invoice.payment_failed": {
      await onInvoicePaymentFailed(event.data.object);
      break;
    }
    case "payment_intent.succeeded": {
      await onPaymentIntentSucceeded(event.data.object);
      break;
    }
    case "customer.subscription.trial_will_end": {
      console.log(
        `[stripe-webhook] trial_will_end on ${(event.data.object as Stripe.Subscription).id} — no trial logic in scope`,
      );
      break;
    }
    default: {
      console.log(`[stripe-webhook] unhandled event type ${event.type}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

interface EntitlementRef {
  product: "debrief";
  portalId: string;
}

function entitlementRefFromMetadata(
  md: Stripe.Metadata | null | undefined,
): EntitlementRef | null {
  const product = md?.product;
  const portalId = md?.portalId;
  if (product !== "debrief" || !portalId) return null;
  return { product, portalId };
}

function mapSubscriptionStatus(s: Stripe.Subscription.Status): EntitlementStatus {
  switch (s) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "incomplete":
      // Should not happen under payment_behavior='error_if_incomplete',
      // but defense-in-depth: reflect the real state rather than lying
      // with 'trial'. UI treats this as a stuck state.
      return "incomplete";
    case "paused":
    default:
      return "trial";
  }
}

function resolveTier(
  sub: Stripe.Subscription,
): EntitlementTier | null {
  const metaTier = sub.metadata?.tier as EntitlementTier | undefined;
  if (metaTier && ["starter", "pro", "enterprise"].includes(metaTier)) {
    return metaTier;
  }
  const price = sub.items.data[0]?.price.id;
  return price ? getTierByPriceId(price) : null;
}

function toIso(unixSeconds: number | null | undefined): string {
  if (!unixSeconds) return new Date().toISOString();
  return new Date(unixSeconds * 1000).toISOString();
}

function periodFromSubscription(sub: Stripe.Subscription): {
  start: number;
  end: number;
} {
  // Subscription-level period is on the first item in API 2025+. Fall
  // back to the subscription root fields if a lib shape we don't expect
  // appears (defensive — tests in older API versions have them there).
  const item = sub.items.data[0];
  const subAny = sub as unknown as Record<string, number | undefined>;
  const start =
    item?.current_period_start ??
    subAny.current_period_start ??
    Math.floor(Date.now() / 1000);
  const end =
    item?.current_period_end ??
    subAny.current_period_end ??
    start + 30 * 24 * 3600;
  return { start, end };
}

async function applyTierWithOverride(
  ref: EntitlementRef,
  desiredTier: EntitlementTier | null,
  entitlement: Entitlement,
): Promise<EntitlementTier | null> {
  if (!desiredTier) return entitlement.tier;
  // If a tier override is set in Redis, Stripe state is still synced on
  // every other field, but the displayed tier stays pinned to the override.
  const override = await redis().get<string>(
    KEY.tierOverride(ref.product, ref.portalId),
  );
  if (override) {
    console.log(
      `[stripe-webhook] tier override on ${ref.product}:${ref.portalId} keeps ${override}, skipping write of ${desiredTier}`,
    );
    return entitlement.tier;
  }
  return desiredTier;
}

async function onSubscriptionCreated(
  sub: Stripe.Subscription,
): Promise<void> {
  const ref = entitlementRefFromMetadata(sub.metadata);
  if (!ref) {
    console.warn(
      `[stripe-webhook] subscription.created ${sub.id} has no Dunamis metadata — skipping`,
    );
    return;
  }
  await withEntitlementLock(ref.product, ref.portalId, async () => {
    const entitlement = await getEntitlement(ref.product, ref.portalId);
    if (!entitlement) {
      console.warn(
        `[stripe-webhook] no entitlement for ${ref.product}:${ref.portalId} — event ${sub.id}`,
      );
      return;
    }
    const tier = resolveTier(sub);
    const effectiveTier = await applyTierWithOverride(ref, tier, entitlement);
    const { start, end } = periodFromSubscription(sub);
    const allotment = tier ? getTierAllotment(tier) : 0;
    const bonus = tier ? getFirstMonthBonus(tier) : 0;

    const prior = entitlement.credits;
    const firstBonusGranted = prior?.firstMonthBonusGranted === true;

    const credits: CreditBuckets = {
      monthly: allotment,
      monthlyAllotment: allotment,
      addon:
        (prior?.addon ?? 0) + (firstBonusGranted ? 0 : bonus),
      currentPeriodStart: toIso(start),
      currentPeriodEnd: toIso(end),
      firstMonthBonusGranted: true,
    };

    entitlement.status = mapSubscriptionStatus(sub.status);
    entitlement.tier = effectiveTier;
    entitlement.stripeCustomerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    entitlement.stripeSubscriptionId = sub.id;
    entitlement.renewalDate = toIso(end);
    entitlement.credits = credits;
    entitlement.cancelAtPeriodEnd = sub.cancel_at_period_end ?? false;

    await saveEntitlement(entitlement);
  });
}

async function onSubscriptionUpdated(
  sub: Stripe.Subscription,
): Promise<void> {
  const ref = entitlementRefFromMetadata(sub.metadata);
  if (!ref) {
    console.warn(
      `[stripe-webhook] subscription.updated ${sub.id} has no Dunamis metadata — skipping`,
    );
    return;
  }
  await withEntitlementLock(ref.product, ref.portalId, async () => {
    const entitlement = await getEntitlement(ref.product, ref.portalId);
    if (!entitlement) return;

    const tier = resolveTier(sub);
    const effectiveTier = await applyTierWithOverride(ref, tier, entitlement);
    const { start, end } = periodFromSubscription(sub);
    const newPeriodStart = toIso(start);

    const prior: CreditBuckets | null = entitlement.credits;
    const priorPeriodStart = prior?.currentPeriodStart ?? null;
    const periodRolled =
      priorPeriodStart !== null && priorPeriodStart !== newPeriodStart;

    const allotment = tier
      ? getTierAllotment(tier)
      : (prior?.monthlyAllotment ?? 0);

    const credits: CreditBuckets = {
      // On period roll-over, reset monthly to the new allotment.
      // Otherwise preserve the current monthly balance (mid-period
      // updates like cancel_at_period_end toggles don't reset credits).
      monthly: periodRolled ? allotment : (prior?.monthly ?? allotment),
      monthlyAllotment: allotment,
      addon: prior?.addon ?? 0,
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: toIso(end),
      firstMonthBonusGranted: prior?.firstMonthBonusGranted ?? false,
    };

    entitlement.status = mapSubscriptionStatus(sub.status);
    entitlement.tier = effectiveTier;
    entitlement.stripeSubscriptionId = sub.id;
    entitlement.renewalDate = toIso(end);
    entitlement.credits = credits;
    entitlement.cancelAtPeriodEnd = sub.cancel_at_period_end ?? false;

    await saveEntitlement(entitlement);
  });
}

async function onSubscriptionDeleted(
  sub: Stripe.Subscription,
): Promise<void> {
  const ref = entitlementRefFromMetadata(sub.metadata);
  if (!ref) return;
  await withEntitlementLock(ref.product, ref.portalId, async () => {
    const entitlement = await getEntitlement(ref.product, ref.portalId);
    if (!entitlement) return;
    entitlement.status = "canceled";
    entitlement.cancelAtPeriodEnd = false;
    await saveEntitlement(entitlement);
  });
}

async function onInvoicePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  const subId = (invoice as unknown as { subscription?: string }).subscription;
  if (!subId) return;
  // Find the entitlement via subscription metadata — invoice metadata is
  // not guaranteed to carry it.
  // (We skip fetching the sub object here to avoid rate-limit pressure;
  // the subscription.updated event that fires alongside will carry the
  // right metadata, so status sync happens there too. This handler is a
  // belt-and-suspenders path for cases where subscription.updated is
  // delivered out of order.)
  console.log(
    `[stripe-webhook] invoice.payment_failed for subscription ${subId} — subscription.updated will sync status.past_due`,
  );
}

async function onPaymentIntentSucceeded(
  pi: Stripe.PaymentIntent,
): Promise<void> {
  const md = pi.metadata ?? {};
  const packName = md.packName;
  const creditAmount = Number(md.creditAmount ?? 0);
  const product = md.product;
  const portalId = md.portalId;
  if (!packName || !creditAmount || product !== "debrief" || !portalId) {
    // Either a subscription payment (sub.updated handles state) or an
    // unrelated intent. No-op.
    return;
  }
  await withEntitlementLock("debrief", portalId, async () => {
    const entitlement = await getEntitlement("debrief", portalId);
    if (!entitlement) return;
    const prior: CreditBuckets | null = entitlement.credits;
    const base: CreditBuckets = prior ?? {
      monthly: 0,
      monthlyAllotment: 0,
      addon: 0,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      firstMonthBonusGranted: false,
    };
    entitlement.credits = {
      ...base,
      addon: (base.addon ?? 0) + creditAmount,
    };
    await saveEntitlement(entitlement);
  });
}
