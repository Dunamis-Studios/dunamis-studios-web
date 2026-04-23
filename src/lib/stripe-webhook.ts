import type Stripe from "stripe";
import { redis, KEY } from "./redis";
import {
  getAccountById,
  getAccountIdByStripeCustomerId,
  saveEntitlement,
  getEntitlement,
} from "./accounts";
import { withEntitlementLock } from "./entitlement-lock";
import { stripe } from "./stripe";
import {
  getTierByPriceId,
  getTierAllotment,
  getFirstMonthBonus,
  CREDIT_PACKS,
} from "./pricing";
import type {
  CreditBuckets,
  Entitlement,
  EntitlementStatus,
  EntitlementTier,
} from "./types";
import {
  getContactByEmail,
  toHubspotTier,
  trackEvents,
  type EventSpec,
  type HubspotTier,
  type ProductAppName,
} from "./hubspot";

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
      await onInvoicePaid(event.data.object);
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
    case "charge.refunded": {
      await onChargeRefunded(event.data.object);
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
  // Captured inside the lock, fired outside. Remains null if the event
  // is a stale redelivery and shouldOverwrite stays false — we don't
  // want to stamp HubSpot with a purchase that the entitlement path
  // itself rejected.
  let hubspotPurchaseCtx: {
    tier: EntitlementTier | null;
    currency: string;
  } | null = null;
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

    hubspotPurchaseCtx = {
      tier: effectiveTier,
      currency: sub.currency ?? "usd",
    };
  });

  if (hubspotPurchaseCtx) {
    await firePurchaseCompletedForSubscription(ref, sub, hubspotPurchaseCtx);
  }
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

async function onInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  // First-invoice payments (billing_reason=subscription_create) are
  // handled by subscription.created → firePurchaseCompletedForSubscription.
  // This case fires subscription_renewed only for recurring cycle payments.
  if (invoice.billing_reason !== "subscription_cycle") {
    return;
  }
  await fireSubscriptionRenewedForInvoice(invoice);
}

async function onInvoicePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  const subId = (invoice as unknown as { subscription?: string }).subscription;
  if (!subId) return;
  // Entitlement state (past_due) is synced by subscription.updated —
  // we don't touch Redis here to avoid rate-limit pressure and race
  // with the concurrent subscription.updated delivery. We DO fire the
  // HubSpot event, which carries the specific failure reason and
  // retry attempt count that subscription.updated doesn't know about.
  console.log(
    `[stripe-webhook] invoice.payment_failed for subscription ${subId} — subscription.updated will sync status.past_due; firing HubSpot event`,
  );
  await fireSubscriptionPaymentFailedForInvoice(invoice);
}

async function onChargeRefunded(charge: Stripe.Charge): Promise<void> {
  await fireLicenseRefundedForCharge(charge);
}

async function onPaymentIntentSucceeded(
  pi: Stripe.PaymentIntent,
): Promise<void> {
  const md = pi.metadata ?? {};
  const packName = md.packName;
  const product = md.product;
  const portalId = md.portalId;
  if (!packName || product !== "debrief" || !portalId) {
    // Either a subscription payment (sub.updated handles state) or an
    // unrelated intent. No-op.
    return;
  }
  // Cross-check: the pack must exist in the catalog AND the amount Stripe
  // received must match the pack's catalog price. Never trust
  // metadata.creditAmount -- an attacker (or a future code path) with any
  // Stripe write access could stamp arbitrary credit counts onto a
  // low-dollar PaymentIntent. The catalog is the single source of truth
  // for how many credits a given pack grants.
  const pack = CREDIT_PACKS.find((p) => p.name === packName);
  if (!pack) {
    console.warn(
      `[stripe-webhook] unknown packName="${packName}" pi=${pi.id} portal=${portalId} — ignoring`,
    );
    return;
  }
  if (pi.amount_received !== pack.amountCents) {
    console.warn(
      `[stripe-webhook] amount mismatch pi=${pi.id} pack=${packName} expected=${pack.amountCents} got=${pi.amount_received} portal=${portalId} — ignoring`,
    );
    return;
  }
  const creditAmount = pack.credits; // authoritative — from catalog, not metadata
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

// ---------------------------------------------------------------------------
// HubSpot event wire-up
// ---------------------------------------------------------------------------

/**
 * Resolve the HubSpot contact identity (email + Dunamis account id) for
 * a Stripe-originated event. Prefers the dunamisAccountId attached to
 * Stripe metadata (cheapest path — Redis lookup only), falls back to
 * the stripeCustomer-to-account reverse index, and bails to null if
 * neither produces a linked account. Callers that get null log and
 * skip rather than firing an event with a missing or made-up account
 * id — HubSpot contacts without an account link are tracked by the
 * signup wire-up path, not by billing events.
 */
async function resolveHubspotContext({
  accountIdFromMetadata,
  customerId,
}: {
  accountIdFromMetadata?: string | null;
  customerId?: string | null;
}): Promise<{ email: string; accountId: string } | null> {
  let accountId: string | null = accountIdFromMetadata ?? null;
  if (!accountId && customerId) {
    accountId = await getAccountIdByStripeCustomerId(customerId);
  }
  if (!accountId) return null;
  const account = await getAccountById(accountId);
  if (!account?.email) return null;
  return { email: account.email, accountId };
}

/**
 * Product slug from Stripe metadata, widened beyond
 * entitlementRefFromMetadata (which gates to "debrief" for entitlement
 * state). HubSpot tracking should fire for any Dunamis product the
 * metadata names, including "property-pulse" when PP billing ships.
 */
function productFromMetadata(
  md: Stripe.Metadata | null | undefined,
): ProductAppName | null {
  const p = md?.product;
  if (p === "debrief" || p === "property-pulse") return p;
  return null;
}

function customerIdFromSubscriptionOrInvoice(
  obj: { customer?: string | Stripe.Customer | Stripe.DeletedCustomer | null },
): string | null {
  const c = obj.customer;
  if (!c) return null;
  return typeof c === "string" ? c : c.id;
}

/**
 * Fire purchase_completed for a brand-new Debrief subscription. Called
 * from onSubscriptionCreated after the entitlement lock releases — the
 * HubSpot API call can take seconds and mustn't hold the Redis mutex.
 * Retrieves the latest invoice to pull amount_paid + payment_intent_id
 * which aren't on the subscription object itself. The context passed
 * in captures the tier snapshot taken inside the lock so a concurrent
 * tier change can't skew the stamped value.
 */
async function firePurchaseCompletedForSubscription(
  ref: EntitlementRef,
  sub: Stripe.Subscription,
  ctx: { tier: EntitlementTier | null; currency: string },
): Promise<void> {
  const customerId = customerIdFromSubscriptionOrInvoice(sub);
  const accountIdMeta = sub.metadata?.dunamisAccountId ?? sub.metadata?.dunamisaccountid;
  const hsCtx = await resolveHubspotContext({
    accountIdFromMetadata: accountIdMeta,
    customerId,
  });
  if (!hsCtx) {
    console.warn(
      `[stripe-webhook] skipping purchase_completed for sub ${sub.id}: no HubSpot context (accountId unresolved)`,
    );
    return;
  }

  // Pull amount + PI from the latest invoice. Subscription.latest_invoice
  // is an id or expanded object depending on the create call; webhook
  // deliveries default to id-only, so retrieve. Non-fatal on failure —
  // we still fire the event with zeros so the occurrence lands.
  let amount_cents = 0;
  let currency = ctx.currency;
  let stripe_payment_intent_id = "";
  const latestInvoiceRef = sub.latest_invoice;
  const latestInvoiceId =
    typeof latestInvoiceRef === "string"
      ? latestInvoiceRef
      : (latestInvoiceRef?.id ?? null);
  if (latestInvoiceId) {
    try {
      const invoice = await stripe().invoices.retrieve(latestInvoiceId);
      amount_cents = invoice.amount_paid ?? 0;
      currency = invoice.currency ?? currency;
      const pi = (invoice as unknown as { payment_intent?: string | Stripe.PaymentIntent | null }).payment_intent;
      stripe_payment_intent_id = typeof pi === "string" ? pi : (pi?.id ?? "");
    } catch (err) {
      console.warn(
        `[stripe-webhook] purchase_completed invoice retrieve failed for ${sub.id}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  const tier: HubspotTier | null = toHubspotTier(ctx.tier);

  const additionalContactPatch = await buildInstallContactPatch({
    email: hsCtx.email,
    appName: "debrief",
    customerId,
  });

  await trackEvents(hsCtx.email, [
    {
      type: "purchase_completed",
      properties: {
        app_name: "debrief",
        portal_id: ref.portalId,
        dunamis_account_id: hsCtx.accountId,
        amount_cents,
        currency,
        license_type: "subscription",
        tier,
        stripe_payment_intent_id,
      },
      additionalContactPatch,
    } satisfies EventSpec<"purchase_completed">,
  ]);
}

/**
 * Fire subscription_renewed for an invoice.paid with
 * billing_reason=subscription_cycle. Retrieves the subscription to
 * resolve metadata (invoices don't inherit subscription metadata).
 */
async function fireSubscriptionRenewedForInvoice(
  invoice: Stripe.Invoice,
): Promise<void> {
  const subRef = (invoice as unknown as { subscription?: string | Stripe.Subscription | null }).subscription;
  const subId = typeof subRef === "string" ? subRef : (subRef?.id ?? null);
  if (!subId) return;

  let sub: Stripe.Subscription;
  try {
    sub = await stripe().subscriptions.retrieve(subId);
  } catch (err) {
    console.warn(
      `[stripe-webhook] subscription_renewed sub retrieve failed for invoice ${invoice.id}:`,
      err instanceof Error ? err.message : err,
    );
    return;
  }

  const product = productFromMetadata(sub.metadata);
  if (product !== "debrief") return;
  const portalId = sub.metadata?.portalId;
  if (!portalId) {
    console.warn(
      `[stripe-webhook] subscription_renewed skipped for ${sub.id}: no portalId in metadata`,
    );
    return;
  }

  const customerId = customerIdFromSubscriptionOrInvoice(invoice);
  const accountIdMeta = sub.metadata?.dunamisAccountId;
  const hsCtx = await resolveHubspotContext({
    accountIdFromMetadata: accountIdMeta,
    customerId,
  });
  if (!hsCtx) {
    console.warn(
      `[stripe-webhook] skipping subscription_renewed for ${sub.id}: no HubSpot context`,
    );
    return;
  }

  const tierInternal = resolveTier(sub);
  const hsTier: HubspotTier = toHubspotTier(tierInternal) ?? "None";
  const credits_granted = tierInternal ? getTierAllotment(tierInternal) : 0;

  await trackEvents(hsCtx.email, [
    {
      type: "subscription_renewed",
      properties: {
        app_name: "debrief",
        portal_id: portalId,
        dunamis_account_id: hsCtx.accountId,
        tier: hsTier,
        amount_cents: invoice.amount_paid ?? 0,
        credits_granted,
        stripe_subscription_id: sub.id,
      },
    } satisfies EventSpec<"subscription_renewed">,
  ]);
}

/**
 * Fire subscription_payment_failed for invoice.payment_failed. Pulls
 * failure reason from the PaymentIntent's last_payment_error (the
 * invoice object carries a hint but the actionable detail is on the
 * PI). retry_attempt is invoice.attempt_count.
 */
async function fireSubscriptionPaymentFailedForInvoice(
  invoice: Stripe.Invoice,
): Promise<void> {
  const subRef = (invoice as unknown as { subscription?: string | Stripe.Subscription | null }).subscription;
  const subId = typeof subRef === "string" ? subRef : (subRef?.id ?? null);
  if (!subId) return;

  let sub: Stripe.Subscription;
  try {
    sub = await stripe().subscriptions.retrieve(subId);
  } catch (err) {
    console.warn(
      `[stripe-webhook] subscription_payment_failed sub retrieve failed for invoice ${invoice.id}:`,
      err instanceof Error ? err.message : err,
    );
    return;
  }

  if (productFromMetadata(sub.metadata) !== "debrief") return;
  const portalId = sub.metadata?.portalId;
  if (!portalId) return;

  const customerId = customerIdFromSubscriptionOrInvoice(invoice);
  const hsCtx = await resolveHubspotContext({
    accountIdFromMetadata: sub.metadata?.dunamisAccountId,
    customerId,
  });
  if (!hsCtx) return;

  let failure_reason = "unknown";
  const piRef = (invoice as unknown as { payment_intent?: string | Stripe.PaymentIntent | null }).payment_intent;
  const piId = typeof piRef === "string" ? piRef : (piRef?.id ?? null);
  if (piId) {
    try {
      const pi = await stripe().paymentIntents.retrieve(piId);
      const err = pi.last_payment_error;
      failure_reason = err?.code ?? err?.decline_code ?? err?.message ?? "unknown";
    } catch {
      // Non-fatal — event still fires with "unknown" reason.
    }
  }

  const tierInternal = resolveTier(sub);
  const hsTier: HubspotTier = toHubspotTier(tierInternal) ?? "None";

  await trackEvents(hsCtx.email, [
    {
      type: "subscription_payment_failed",
      properties: {
        app_name: "debrief",
        portal_id: portalId,
        dunamis_account_id: hsCtx.accountId,
        tier: hsTier,
        amount_cents: invoice.amount_due ?? 0,
        failure_reason,
        retry_attempt: invoice.attempt_count ?? 0,
        stripe_invoice_id: invoice.id ?? "",
      },
    } satisfies EventSpec<"subscription_payment_failed">,
  ]);
}

/**
 * Fire license_refunded for a charge.refunded event. Traces the charge
 * back to its origin metadata via the PaymentIntent (one-time PP /
 * credit-pack) or via PI → Invoice → Subscription (Debrief subscription
 * charges). Skips silently for non-Dunamis charges.
 */
async function fireLicenseRefundedForCharge(
  charge: Stripe.Charge,
): Promise<void> {
  const origin = await resolveRefundedChargeOrigin(charge);
  if (!origin) {
    console.log(
      `[stripe-webhook] charge.refunded ${charge.id}: no Dunamis origin metadata — skipping HubSpot event`,
    );
    return;
  }
  const { product, portalId, customerId, accountIdMeta } = origin;

  const hsCtx = await resolveHubspotContext({
    accountIdFromMetadata: accountIdMeta,
    customerId,
  });
  if (!hsCtx) {
    console.warn(
      `[stripe-webhook] skipping license_refunded for ${charge.id}: no HubSpot context`,
    );
    return;
  }

  const refundEntry = charge.refunds?.data?.[0];
  const refund_reason = refundEntry?.reason ?? "";
  const stripe_refund_id = refundEntry?.id ?? "";

  // days_since_install is intentionally omitted — the Stripe charge
  // object doesn't carry a purchase date we can trust, and sending a
  // lying 0 would pollute HubSpot reporting. The contact itself already
  // stores property_pulse_purchase_date / *_first_install_at, so the
  // analyst can compute this server-side from the contact record.
  //
  // TODO: when PP billing goes live, include purchaseDate=ISO on the PP
  // checkout PaymentIntent metadata. At that point compute
  // days_since_install = floor((now - metadata.purchaseDate) / 86_400_000)
  // and pass it through here. Same pattern would extend to Debrief if
  // subscription metadata gains a firstInstallAt field.
  await trackEvents(hsCtx.email, [
    {
      type: "license_refunded",
      properties: {
        app_name: product,
        portal_id: portalId,
        dunamis_account_id: hsCtx.accountId,
        refund_amount_cents: charge.amount_refunded ?? 0,
        refund_reason,
        stripe_refund_id,
      },
    } satisfies EventSpec<"license_refunded">,
  ]);
}

/**
 * Walk a refunded charge back to its origin metadata. Path A: the
 * PaymentIntent directly has product/portalId (one-time charges like
 * PP or credit packs). Path B: the PI was generated by a subscription
 * invoice; follow PI → invoice → subscription and read metadata there.
 * Returns null if neither path yields a Dunamis product.
 */
async function resolveRefundedChargeOrigin(
  charge: Stripe.Charge,
): Promise<{
  product: ProductAppName;
  portalId: string;
  customerId: string | null;
  accountIdMeta?: string;
} | null> {
  const customerId = typeof charge.customer === "string" ? charge.customer : (charge.customer?.id ?? null);

  const piRef = charge.payment_intent;
  const piId = typeof piRef === "string" ? piRef : (piRef?.id ?? null);
  if (!piId) return null;

  let pi: Stripe.PaymentIntent;
  try {
    pi = await stripe().paymentIntents.retrieve(piId);
  } catch (err) {
    console.warn(
      `[stripe-webhook] charge.refunded ${charge.id}: PI retrieve failed:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }

  // Path A: PI metadata names the product directly.
  const piProduct = productFromMetadata(pi.metadata);
  if (piProduct && pi.metadata?.portalId) {
    return {
      product: piProduct,
      portalId: pi.metadata.portalId,
      customerId,
      accountIdMeta: pi.metadata?.dunamisAccountId,
    };
  }

  // Path B: PI was invoice-generated → follow up the chain to sub metadata.
  const invoiceRef = (pi as unknown as { invoice?: string | Stripe.Invoice | null }).invoice;
  const invoiceId = typeof invoiceRef === "string" ? invoiceRef : (invoiceRef?.id ?? null);
  if (!invoiceId) return null;

  let invoice: Stripe.Invoice;
  try {
    invoice = await stripe().invoices.retrieve(invoiceId);
  } catch {
    return null;
  }
  const subRef = (invoice as unknown as { subscription?: string | Stripe.Subscription | null }).subscription;
  const subId = typeof subRef === "string" ? subRef : (subRef?.id ?? null);
  if (!subId) return null;

  let sub: Stripe.Subscription;
  try {
    sub = await stripe().subscriptions.retrieve(subId);
  } catch {
    return null;
  }
  const subProduct = productFromMetadata(sub.metadata);
  if (!subProduct) return null;
  const portalId = sub.metadata?.portalId;
  if (!portalId) return null;
  return {
    product: subProduct,
    portalId,
    customerId,
    accountIdMeta: sub.metadata?.dunamisAccountId,
  };
}

/**
 * Build the additionalContactPatch for install events (purchase_completed
 * Debrief/PP paths). Sets stripe_customer_id unconditionally, and sets
 * *_first_install_at only if the contact doesn't already have it —
 * read-before-write so re-subscribes or re-installs don't overwrite
 * the original install date.
 */
async function buildInstallContactPatch({
  email,
  appName,
  customerId,
}: {
  email: string;
  appName: ProductAppName;
  customerId: string | null;
}): Promise<Record<string, string>> {
  const firstInstallProp =
    appName === "debrief"
      ? "debrief_first_install_at"
      : "property_pulse_first_install_at";
  const patch: Record<string, string> = {};
  if (customerId) patch.stripe_customer_id = customerId;
  try {
    const existing = await getContactByEmail(email, [firstInstallProp]);
    if (!existing?.properties?.[firstInstallProp]) {
      patch[firstInstallProp] = new Date().toISOString();
    }
  } catch {
    // If the lookup fails (network blip, etc.) prefer to stamp the
    // first-install date over skipping it — a too-fresh date is a
    // better failure mode than a blank property the analyst has to
    // chase down. Subsequent successful lookups won't overwrite.
    patch[firstInstallProp] = new Date().toISOString();
  }
  return patch;
}
