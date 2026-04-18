import type Stripe from "stripe";
import { redis, KEY } from "./redis";
import { saveEntitlement, getEntitlement } from "./accounts";
import { withEntitlementLock } from "./entitlement-lock";
import { stripe } from "./stripe";
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

function appendToHistory(
  history: string[] | undefined,
  subscriptionId: string,
): string[] {
  const existing = Array.isArray(history) ? history : [];
  if (existing.includes(subscriptionId)) return existing;
  return [...existing, subscriptionId];
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

// Stripe subscription statuses that indicate the stored subscription is
// no longer the live one — a newly-created subscription carrying a
// different id is the real replacement and should overwrite state.
const DEAD_STATUSES = new Set<Stripe.Subscription.Status>([
  "canceled",
  "incomplete_expired",
  "unpaid",
]);

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

    // Always maintain the audit trail, even if we decide not to write
    // tier/credits below.
    entitlement.subscriptionHistory = appendToHistory(
      entitlement.subscriptionHistory,
      sub.id,
    );

    // Decide whether this event should overwrite current state.
    const stored = entitlement.stripeSubscriptionId;
    let shouldOverwrite: boolean;
    if (!stored) {
      // First subscription — normal path.
      shouldOverwrite = true;
    } else if (stored === sub.id) {
      // Same subscription, re-delivery. Idempotent rewrite.
      shouldOverwrite = true;
    } else {
      // Different stored sub — check if the stored one is dead.
      const storedStatus = await fetchSubscriptionStatus(stored);
      if (storedStatus === null || DEAD_STATUSES.has(storedStatus)) {
        shouldOverwrite = true;
      } else {
        console.error(
          `[stripe-webhook] subscription.created ${sub.id} arrived but entitlement ${ref.product}:${ref.portalId} still has live stored subscription ${stored} (status=${storedStatus}). Not overwriting; history appended only.`,
        );
        shouldOverwrite = false;
      }
    }

    if (!shouldOverwrite) {
      await saveEntitlement(entitlement);
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

    entitlement.subscriptionHistory = appendToHistory(
      entitlement.subscriptionHistory,
      sub.id,
    );

    // Stale-event guard: a subscription.updated for an older sub must
    // not clobber the current subscription's tier/credits/status.
    const stored = entitlement.stripeSubscriptionId;
    if (stored && stored !== sub.id) {
      console.log(
        `[stripe-webhook] subscription.updated ${sub.id} is stale (current stored: ${stored}). History appended; tier/credits/status writes skipped.`,
      );
      await saveEntitlement(entitlement);
      return;
    }

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

    // Tier change detection: the event resolves to a different tier than
    // what we had stored. Compare against entitlement.tier rather than
    // prior.monthlyAllotment because the displayed tier can be pinned
    // by a tier override even while Stripe's tier changes underneath.
    const priorTier = entitlement.tier;
    const tierChanged = !!tier && !!priorTier && tier !== priorTier;

    // Decision (see PR "FIX 12"): on any mid-period tier change, reset
    // monthly credits to the new allotment. Rationale: the user paid
    // the new tier's price today (proration via always_invoice in
    // FIX 14); charging them for Enterprise while gating them at Pro's
    // credit ceiling until period roll-over would be unexpected. The
    // period-roll-over path below also resets — the two conditions are
    // unioned, never double-applied.
    const shouldResetMonthly = periodRolled || tierChanged;

    const credits: CreditBuckets = {
      monthly: shouldResetMonthly
        ? allotment
        : (prior?.monthly ?? allotment),
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

    entitlement.subscriptionHistory = appendToHistory(
      entitlement.subscriptionHistory,
      sub.id,
    );

    // Only mark the entitlement canceled if the deleted subscription is
    // actually the current one. An older sub winding down after the user
    // has already re-subscribed must not flip the current record to
    // canceled.
    const stored = entitlement.stripeSubscriptionId;
    if (stored && stored !== sub.id) {
      console.log(
        `[stripe-webhook] subscription.deleted ${sub.id} is not current (stored: ${stored}). History appended; status write skipped.`,
      );
      await saveEntitlement(entitlement);
      return;
    }

    entitlement.status = "canceled";
    entitlement.cancelAtPeriodEnd = false;
    await saveEntitlement(entitlement);
  });
}

/**
 * Retrieve the current status of a Stripe subscription. Returns null on
 * error (404, rate-limit, etc.) so callers can fall through to
 * "treat the stored sub as dead" when Stripe claims it doesn't exist.
 */
async function fetchSubscriptionStatus(
  subscriptionId: string,
): Promise<Stripe.Subscription.Status | null> {
  try {
    const sub = await stripe().subscriptions.retrieve(subscriptionId);
    return sub.status;
  } catch (err) {
    console.warn(
      `[stripe-webhook] fetchSubscriptionStatus(${subscriptionId}) failed:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
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
