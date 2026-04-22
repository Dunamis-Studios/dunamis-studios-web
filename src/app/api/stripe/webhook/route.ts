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
