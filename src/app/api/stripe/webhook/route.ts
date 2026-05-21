/**
 * POST /api/stripe/webhook: Stripe webhook receiver. Verifies the
 * signature against STRIPE_WEBHOOK_SECRET using the raw body, then
 * hands the event to the shared handleStripeEvent dispatcher in
 * @/lib/stripe-webhook (which owns the per-event-type fanout into
 * entitlement and credit ledger mutations).
 *
 * Errors are returned generically: a failed signature check is a
 * plain 400 because Stripe's own error strings can reveal which
 * check failed and give a scanner probe feedback. A handler throw
 * is a 500 so Stripe retries (200/2xx tells Stripe the event was
 * consumed and stops retries).
 */
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { handleStripeEvent } from "@/lib/stripe-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured");
    return new NextResponse("Webhook not configured", { status: 500 });
  }

  // Raw body is required for signature verification.
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(
      rawBody,
      signature,
      secret,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid signature";
    console.warn(`[stripe-webhook] signature verification failed: ${msg}`);
    // Don't reflect the underlying error to the caller — Stripe's own
    // verification error strings can describe which check failed
    // (timestamp vs signature vs encoding), giving a scanner actionable
    // probe feedback. A generic 400 is enough; operator gets the detail
    // via console.warn above.
    return new NextResponse("Webhook signature error", { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    // A handler throw (e.g. entitlement lock contention) should 5xx so
    // Stripe retries. An error in our code shouldn't tell Stripe the
    // event was consumed.
    console.error(`[stripe-webhook] handler error for ${event.type}`, err);
    return new NextResponse("Handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
