/**
 * cleanup-incomplete-subscriptions.ts
 *
 * One-off cleanup for zombie `incomplete` Stripe subscriptions left behind
 * by earlier `payment_behavior: 'default_incomplete'` flows that never had
 * a PaymentIntent attached (API 2026-03-25.dahlia stopped auto-generating
 * one on the invoice, so those subscriptions could never be confirmed).
 *
 * Safety: any incomplete subscription whose latest invoice has a PI in
 * status=succeeded is skipped. We only cancel the truly stuck ones.
 *
 * Usage:
 *   npx tsx scripts/cleanup-incomplete-subscriptions.ts
 *   npm run stripe:cleanup-incomplete
 */

import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is not set. Pull env from Vercel or add to .env.local.");
  process.exit(1);
}

const mode = process.env.STRIPE_MODE === "live" ? "live" : "test";
if (mode === "live" && !process.argv.includes("--yes-live")) {
  console.error(
    "Refusing to run against LIVE Stripe without explicit --yes-live flag.",
  );
  process.exit(1);
}

const stripe = new Stripe(key, {
  apiVersion: "2026-03-25.dahlia",
  appInfo: { name: "dunamis-studios-web/cleanup-incomplete" },
});

interface LatestInvoiceWithPI {
  payment_intent?: Stripe.PaymentIntent | string | null;
}

async function main() {
  console.log(`Scanning Stripe (${mode} mode) for incomplete subscriptions...`);

  let canceled = 0;
  let skipped = 0;
  let scanned = 0;
  let startingAfter: string | undefined;

  for (;;) {
    const resp: Stripe.ApiList<Stripe.Subscription> =
      await stripe.subscriptions.list({
        status: "incomplete",
        limit: 100,
        starting_after: startingAfter,
        expand: ["data.latest_invoice"],
      });
    if (resp.data.length === 0) break;

    for (const sub of resp.data) {
      scanned++;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      // The expand above gets us the invoice; fetch the PI separately
      // since nested expands beyond one level are unreliable on list.
      const invoice =
        sub.latest_invoice && typeof sub.latest_invoice !== "string"
          ? (sub.latest_invoice as Stripe.Invoice & LatestInvoiceWithPI)
          : null;

      let piStatus: string | null = null;
      let piId: string | null = null;
      if (invoice?.payment_intent) {
        const pi =
          typeof invoice.payment_intent === "string"
            ? await stripe.paymentIntents
                .retrieve(invoice.payment_intent)
                .catch(() => null)
            : invoice.payment_intent;
        piStatus = pi?.status ?? null;
        piId = pi?.id ?? null;
      }

      if (piStatus === "succeeded") {
        console.log(
          `  SKIP ${sub.id} — PI ${piId} succeeded, do not cancel`,
        );
        skipped++;
        continue;
      }

      process.stdout.write(
        `  CANCEL ${sub.id} (customer=${customerId}, pi=${piStatus ?? "none"}) ... `,
      );
      try {
        await stripe.subscriptions.cancel(sub.id);
        process.stdout.write("ok\n");
        canceled++;
      } catch (err) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "unknown error";
        process.stdout.write(`failed: ${msg}\n`);
      }
    }

    if (!resp.has_more) break;
    startingAfter = resp.data[resp.data.length - 1]?.id;
    if (!startingAfter) break;
  }

  console.log(
    `\nDone. Scanned ${scanned}, canceled ${canceled}, skipped ${skipped}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
