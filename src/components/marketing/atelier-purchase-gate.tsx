import Link from "next/link";
import { LogIn, ShoppingCart } from "lucide-react";

import { getCurrentSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { AtelierCheckoutButton } from "@/components/marketing/atelier-checkout-button";

/**
 * Purchase gate for the Atelier marketing page's #buy-atelier section.
 *
 * Atelier is sold as a perpetual license bound to a Dunamis Studios
 * account at the moment of payment. The site purchase flow therefore
 * gates checkout on a signed-in account: visitors must sign in before
 * they can hit Stripe Checkout. The signed-in account_id is forwarded
 * through metadata.dunamisAccountId on the Checkout Session and
 * picked up by the Stripe webhook to bind the resulting license.
 *
 * Server component: reads the session at request time and renders one
 * of two CTAs.
 *   - Signed-out: "Sign in to buy" → /login with a redirect back to
 *     the product page (#buy-atelier anchor) so the buyer lands at
 *     the same scroll position post-auth.
 *   - Signed-in: "Buy Atelier — $149" delegated to a small client
 *     button that POSTs to /api/atelier/checkout and navigates to the
 *     returned Stripe URL.
 *
 * The signed-in branch surfaces the purchasing account's email so
 * customers can confirm they're paying from the right account before
 * heading to Stripe. The "buy under a different account" path is
 * "sign out, sign in to the right one" — not a Stripe-side toggle.
 */
export async function AtelierPurchaseGate() {
  const session = await getCurrentSession();

  if (!session) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-[var(--fg-muted)]">
          Atelier licenses bind to your Dunamis Studios account, so we ask you
          to sign in before checkout. New here? Sign up takes a minute.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login?redirect=/build-services/products/atelier%23buy-atelier">
              <LogIn className="h-4 w-4" aria-hidden />
              Sign in to buy
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/signup?redirect=/build-services/products/atelier%23buy-atelier">
              Create an account
            </Link>
          </Button>
        </div>
        <p className="text-xs text-[var(--fg-subtle)]">
          $149 one-time. 30-day money-back guarantee.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-[var(--fg-muted)]">
        Buying as{" "}
        <span className="font-medium text-[var(--fg)]">
          {session.account.firstName}
        </span>{" "}
        ·{" "}
        <code className="rounded bg-[var(--bg-muted)] px-1.5 py-0.5 text-xs">
          {session.account.email}
        </code>
        . Wrong account?{" "}
        <Link
          href="/account"
          className="underline decoration-dotted underline-offset-2 hover:text-[var(--fg)]"
        >
          Switch from your dashboard
        </Link>
        .
      </p>
      <div className="flex justify-center">
        <AtelierCheckoutButton>
          <ShoppingCart className="h-4 w-4" aria-hidden />
          Buy Atelier — $149
        </AtelierCheckoutButton>
      </div>
      <p className="text-xs text-[var(--fg-subtle)]">
        One-time payment. Perpetual license. 30-day money-back guarantee.
      </p>
    </div>
  );
}
