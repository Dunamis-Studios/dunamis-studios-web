import type { Metadata } from "next";

import { PostCheckoutLauncher } from "./post-checkout-launcher";

export const metadata: Metadata = {
  title: "Atelier — completing your purchase",
  description:
    "Returning to the Atelier desktop app. If the app does not open automatically, the page below has manual instructions.",
  robots: { index: false, follow: false },
};

interface SearchParamsShape {
  session_id?: string;
}

/**
 * Stripe success URL after a /api/atelier/checkout payment.
 *
 * The page reads the Stripe Checkout session_id from the query string
 * and tries to deep-link the customer's machine back into the Atelier
 * desktop app via `atelier://atelier/post-checkout?session_id=…`. The
 * desktop's deep-link handler picks that up, re-fetches entitlements,
 * finds the freshly-minted license, and runs auto-activation against
 * the existing /api/atelier/activate endpoint (same 3-device cap +
 * 2-of-3 hardware match logic as the manual flow).
 *
 * The license itself is created server-side by the Stripe webhook
 * handler (`stripe-webhook.ts onCheckoutSessionCompleted` for
 * `metadata.product === "atelier"`), so the deep-link works whether
 * or not the customer has Atelier already running — the entitlements
 * fetch on the desktop side picks it up either way.
 *
 * This page renders no payment / sensitive details. The session_id is
 * passed straight to the desktop, which validates it through its own
 * authenticated bearer-channel back to /api/atelier/entitlements.
 */
export default async function AtelierPostCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsShape>;
}) {
  const sp = await searchParams;
  const sessionId =
    typeof sp.session_id === "string" && sp.session_id.length > 0
      ? sp.session_id
      : null;

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-[var(--font-display)] text-3xl font-medium tracking-tight">
        Thanks for your purchase.
      </h1>
      <p className="mt-4 text-[var(--fg-muted)] leading-relaxed">
        Atelier should reopen on this computer in a moment. If nothing
        happens, the desktop app may be closed — open it from your Start
        menu and sign in again. Your license is waiting on your account.
      </p>

      <PostCheckoutLauncher sessionId={sessionId} />

      <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-5 text-sm leading-relaxed text-[var(--fg-muted)]">
        <p className="font-medium text-[var(--fg)]">What happens next?</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            We&apos;ve emailed your license string and a copy of your
            receipt. Keep them somewhere safe — they&apos;re your proof of
            purchase.
          </li>
          <li>
            On this computer, Atelier auto-activates the moment the deep
            link below fires. No license-string typing required.
          </li>
          <li>
            On any other computer (up to three), sign into the same
            account from inside Atelier and pick this license — same auto-
            activation flow.
          </li>
        </ol>
      </div>
    </main>
  );
}
