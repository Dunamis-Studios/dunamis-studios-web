import type Stripe from "stripe";

import {
  getAccountById,
  getAccountIdByStripeCustomerId,
} from "../accounts";
import { redis } from "../redis";
import { stripe } from "../stripe";
import { issueExchangeCode } from "./auth";
import {
  setCustomerIdForAccount,
  upsertSyncCustomer,
} from "./customer";
import { SYNC_KEY } from "./redis-keys";
import {
  classifyPrice,
  lookupKeyForSession,
  lookupKeyForSubscription,
} from "./stripe-helpers";
import { SYNC_LOOKUP_KEYS, type SyncCustomerState } from "./types";

/**
 * Stripe webhook router for Dunamis Sync events. Returns true if the
 * event was a Sync event and was handled (or skipped intentionally),
 * false to indicate the parent dispatcher should continue with its
 * normal switch statement (Debrief, Property Pulse, etc.).
 *
 * The discriminator is `metadata.product === "dunamis-sync"` on the
 * Stripe object. The checkout, subscription, and payment_intent
 * payloads created by /api/sync/checkout always set this. If the
 * metadata is missing, the event is not Sync's and falls through.
 */
export async function tryHandleSyncEvent(
  event: Stripe.Event,
): Promise<boolean> {
  const obj = event.data.object as { metadata?: Stripe.Metadata | null };
  const product = obj.metadata?.product;
  if (product !== "dunamis-sync") return false;

  switch (event.type) {
    case "checkout.session.completed":
      await onSyncCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      return true;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await onSyncSubscriptionUpsert(event.data.object as Stripe.Subscription);
      return true;
    case "customer.subscription.deleted":
      await onSyncSubscriptionDeleted(event.data.object as Stripe.Subscription);
      return true;
    case "invoice.paid":
      await onSyncInvoicePaid(event.data.object as Stripe.Invoice);
      return true;
    case "invoice.payment_failed":
      // Dunning is Stripe's; entitlement state moves on the
      // subscription.updated event that follows. No-op here, but we
      // claim the event so the parent dispatcher doesn't try to handle
      // it as a Debrief event.
      return true;
    default:
      // We tagged this as a Sync event but don't handle this Stripe
      // type. Log and claim — Stripe stops retrying. The alternative
      // (returning false) would let the parent dispatcher's "unhandled
      // event type" logger fire, which is fine but noisier.
      console.log(
        `[sync-webhook] unhandled Sync-tagged event type ${event.type}`,
      );
      return true;
  }
}

const TRIAL_DAYS = 30;
const GRACE_DAYS = 30;

async function onSyncCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.payment_status !== "paid") {
    console.warn(
      `[sync-webhook] session ${session.id} payment_status=${session.payment_status}, skipping`,
    );
    return;
  }
  const customerId = customerIdFrom(session.customer);
  if (!customerId) {
    console.warn(`[sync-webhook] session ${session.id} has no customer id`);
    return;
  }
  const accountIdMeta = session.metadata?.dunamisAccountId ?? null;
  const lookupKey = await lookupKeyForSession(session);
  if (!lookupKey) {
    console.warn(
      `[sync-webhook] session ${session.id} has no Sync line-item lookup_key`,
    );
    return;
  }
  const email = await resolveEmail(customerId, accountIdMeta);

  await upsertSyncCustomer(customerId, email, (s) =>
    applyCheckoutCompletion(s, session, lookupKey),
  );

  // Maintain the account → customer reverse index for session-cookie
  // routes (portal, export, account-delete).
  if (accountIdMeta) {
    await setCustomerIdForAccount(accountIdMeta, customerId);
  } else {
    // Defensive — fall back to the existing reverse lookup.
    const accId = await getAccountIdByStripeCustomerId(customerId);
    if (accId) await setCustomerIdForAccount(accId, customerId);
  }

  // Mint a one-time exchange code so Atelier can deep-link from the
  // post-checkout marketing page directly into authenticated state.
  // Stored under both the consumable key (single-use atomic GET+DEL)
  // and a per-session-id lookup key (so the marketing page can
  // retrieve it from session_id without persisting it client-side).
  const { code } = await issueExchangeCode(customerId);
  await redis().set(SYNC_KEY.exchangeBySession(session.id), code, {
    ex: 10 * 60,
  });
}

function applyCheckoutCompletion(
  state: SyncCustomerState,
  session: Stripe.Checkout.Session,
  lookupKey: string,
): SyncCustomerState {
  const now = new Date();
  const next: SyncCustomerState = { ...state };
  next.customer_id = customerIdFrom(session.customer) ?? state.customer_id;

  if (lookupKey === SYNC_LOOKUP_KEYS.trial_month) {
    // Trial-month is a one-time charge with a server-tracked end date,
    // not a Stripe trial. The cron drives the T-3 / T-0 emails and the
    // transition to cancelled_in_grace at expiry.
    const trialEnd = new Date(now);
    trialEnd.setUTCDate(trialEnd.getUTCDate() + TRIAL_DAYS);
    next.sync_status = "trial_active";
    next.sync_trial_ends_at = trialEnd.toISOString();
    next.sync_grace_ends_at = null;
    next.sync_subscription_id = null;
    next.sync_activated_at = state.sync_activated_at ?? now.toISOString();
    next.sync_active_through = trialEnd.toISOString();
    next.trial_t3_email_sent_at = null;
    next.trial_t0_email_sent_at = null;
  } else {
    // Recurring (monthly / annual). The follow-up subscription.created
    // / .updated event will populate sync_subscription_id and
    // sync_active_through; we set sync_status here so the immediate
    // post-checkout poll from Atelier sees "active" instead of "none".
    next.sync_status = "active";
    next.sync_trial_ends_at = null;
    next.sync_grace_ends_at = null;
    next.sync_activated_at = state.sync_activated_at ?? now.toISOString();
  }
  return next;
}

async function onSyncSubscriptionUpsert(
  sub: Stripe.Subscription,
): Promise<void> {
  const customerId = customerIdFrom(sub.customer);
  if (!customerId) return;
  const accountIdMeta = sub.metadata?.dunamisAccountId ?? null;
  const lookupKey = lookupKeyForSubscription(sub);
  if (!lookupKey) return;
  const email = await resolveEmail(customerId, accountIdMeta);

  await upsertSyncCustomer(customerId, email, (s) =>
    applySubscriptionState(s, sub, lookupKey),
  );

  if (accountIdMeta) {
    await setCustomerIdForAccount(accountIdMeta, customerId);
  }
}

function applySubscriptionState(
  state: SyncCustomerState,
  sub: Stripe.Subscription,
  lookupKey: string,
): SyncCustomerState {
  const next: SyncCustomerState = { ...state };
  next.sync_subscription_id = sub.id;

  const periodEnd = subscriptionPeriodEnd(sub);
  if (periodEnd) next.sync_active_through = periodEnd;

  switch (sub.status) {
    case "active":
    case "trialing":
      next.sync_status = "active";
      next.sync_grace_ends_at = null;
      break;
    case "past_due":
    case "unpaid":
      // Past-due is functionally still active for Sync's purposes —
      // dunning handles re-charge. We hold sync_status at "active" so
      // the customer's data stays accessible until the subscription
      // actually cancels.
      next.sync_status = "active";
      break;
    case "canceled":
    case "incomplete_expired":
      enterGrace(next);
      break;
    default:
      // incomplete / paused — reflect as-is via sync_status="active"
      // until a deletion or final-state event arrives.
      next.sync_status = state.sync_status === "expired" ? "expired" : "active";
  }

  void lookupKey; // currently unused; spec leaves room for tier-aware behavior
  return next;
}

async function onSyncSubscriptionDeleted(
  sub: Stripe.Subscription,
): Promise<void> {
  const customerId = customerIdFrom(sub.customer);
  if (!customerId) return;
  const email = await resolveEmail(customerId, sub.metadata?.dunamisAccountId);

  await upsertSyncCustomer(customerId, email, (s) => {
    const next = { ...s };
    next.sync_subscription_id = sub.id;
    enterGrace(next);
    return next;
  });
}

async function onSyncInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  // Renewal payments. The price drives lookup_key resolution; we re-
  // read the subscription so we have the current Stripe-side period
  // end. (Subscription metadata gets us the product gate.)
  const billing = invoice.billing_reason;
  if (billing !== "subscription_cycle" && billing !== "subscription_create") {
    return;
  }
  const subRef = (invoice as unknown as {
    subscription?: string | Stripe.Subscription | null;
  }).subscription;
  const subId = typeof subRef === "string" ? subRef : (subRef?.id ?? null);
  if (!subId) return;
  let sub: Stripe.Subscription;
  try {
    sub = await stripe().subscriptions.retrieve(subId);
  } catch (err) {
    console.warn(
      `[sync-webhook] invoice.paid sub retrieve failed for ${subId}:`,
      err instanceof Error ? err.message : err,
    );
    return;
  }
  if (sub.metadata?.product !== "dunamis-sync") return;
  await onSyncSubscriptionUpsert(sub);
}

function enterGrace(state: SyncCustomerState): void {
  // Idempotent — if already in grace, leave the existing
  // sync_grace_ends_at in place. A second cancellation event after the
  // customer briefly reactivated then cancelled again resets the
  // window; the reactivation path resets sync_status back to "active"
  // before this runs.
  if (state.sync_status === "cancelled_in_grace" && state.sync_grace_ends_at) {
    return;
  }
  const graceEnd = new Date();
  graceEnd.setUTCDate(graceEnd.getUTCDate() + GRACE_DAYS);
  state.sync_status = "cancelled_in_grace";
  state.sync_grace_ends_at = graceEnd.toISOString();
}

function subscriptionPeriodEnd(sub: Stripe.Subscription): string | null {
  const item = sub.items.data[0];
  const subAny = sub as unknown as Record<string, number | undefined>;
  const end =
    item?.current_period_end ?? subAny.current_period_end ?? null;
  if (!end) return null;
  return new Date(end * 1000).toISOString();
}

function customerIdFrom(
  c: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
): string | null {
  if (!c) return null;
  return typeof c === "string" ? c : c.id;
}

async function resolveEmail(
  customerId: string,
  accountIdHint?: string | null,
): Promise<string> {
  // Preferred: account-id from Stripe metadata. Falls back to the
  // customer→account reverse index, then to the Stripe customer's own
  // email field. Returns empty string only if all three fail (which
  // would be a Stripe consistency bug — the customer must have at
  // least an email on the Stripe side).
  if (accountIdHint) {
    const acc = await getAccountById(accountIdHint);
    if (acc?.email) return acc.email;
  }
  const accId = await getAccountIdByStripeCustomerId(customerId);
  if (accId) {
    const acc = await getAccountById(accId);
    if (acc?.email) return acc.email;
  }
  try {
    const c = await stripe().customers.retrieve(customerId);
    if (!c.deleted && c.email) return c.email;
  } catch {
    // Fall through.
  }
  console.warn(
    `[sync-webhook] could not resolve email for customer ${customerId}; storing empty string`,
  );
  return "";
}

// Re-export for stripe-webhook.ts dispatch. Also re-export
// classifyPrice so the parent file can use it without re-importing
// from stripe-helpers (kept in this module to keep the public surface
// tight).
export { classifyPrice };
