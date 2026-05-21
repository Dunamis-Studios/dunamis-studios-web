/**
 * Tiny session + active-product probe for the support
 * verification-key widget. Lets the widget choose Mode A vs Mode B
 * at hydration time without forcing the host page (specifically
 * statically-prerendered KB articles) to become dynamic. The
 * standalone /help/contact-support page already resolves the user
 * prop server-side and does not call this.
 */
import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/session";
import { hasActiveProduct } from "@/lib/verification-key/active-product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/support/verification-key/whoami
 *
 * Tiny session + active-product lookup for the verification key
 * widget. Lets the widget render Mode A (auth + generate) or Mode B
 * (public + email) without the page that hosts it being a dynamic
 * server component.
 *
 * The standalone /help/contact-support page is already dynamic and
 * resolves the user prop server-side, so it does not need this
 * endpoint. The KB article inline form (rendered from the
 * statically-prerendered article template) does: every article would
 * otherwise have to be dynamic just to know who is viewing it. The
 * one-shot whoami call costs the widget a single round-trip on mount
 * and keeps the article pages cacheable.
 *
 * Response shape mirrors the widget's VerificationKeyWidgetProps user
 * shape so the widget can drop the body straight into state.
 *
 * No cache header: the result depends on the session cookie, and a
 * signed-in customer who signs out / signs back in mid-session needs
 * the next render to reflect that.
 */
export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { user: null },
      { headers: { "cache-control": "no-store" } },
    );
  }
  const active = await hasActiveProduct(
    session.account.accountId,
    session.account.email,
  );
  return NextResponse.json(
    {
      user: {
        email: session.account.email,
        hasActiveProduct: active,
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
