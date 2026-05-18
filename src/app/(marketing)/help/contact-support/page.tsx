/**
 * Support ticket page at /help/contact-support. Server component
 * that resolves the current session, checks
 * hasActiveProduct(account, email) for the Mode A verification-key
 * fast path, and renders the SupportForm with the resolved user
 * context. AnchorScrollOnMount aligns the form with the viewport
 * after hydration so a deep link to #support-form lands cleanly.
 *
 * Form submission posts to /api/support-submit which validates,
 * re-verifies Turnstile + verification key, then forwards into the
 * HubSpot helpdesk pipeline.
 */
import type { Metadata } from "next";

import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SupportForm } from "@/components/help/support-form";
import { AnchorScrollOnMount } from "@/components/help/anchor-scroll-on-mount";
import { getCurrentSession } from "@/lib/session";
import { hasActiveProduct } from "@/lib/verification-key/active-product";
import type { VerificationKeyUser } from "@/components/help/verification-key-widget";

export const metadata: Metadata = {
  title: "Contact Support · Dunamis Studios help center",
  description:
    "Can't find what you need in our help articles? Send us a ticket. We're a small studio, so a real person reads every one and writes back within 48 hours.",
  alternates: { canonical: "/help/contact-support" },
};

/**
 * Forces the page to render dynamically per request so the verification
 * key widget receives a server-resolved `user` prop instead of falling
 * back to the client whoami round-trip. The route is low-traffic
 * (customer reaches it via the footer link or 48h escalation path) so
 * paying the dynamic-render cost here is a fair trade for shipping the
 * Mode A vs Mode B chrome immediately in the SSR HTML.
 */
export const dynamic = "force-dynamic";

/**
 * Public-facing customer support entry point. Renders a static
 * header plus the SupportForm client component, which owns the
 * conditional field logic and POSTs to /api/support-submit. The
 * form section's #support-form anchor is the link target for
 * footer nav and external links into the support page; the
 * article-thumbs-down flow embeds SupportForm inline on the
 * article page itself, so it does not navigate here.
 *
 * Verification key context (user prop) is resolved server-side: a
 * signed-in customer with at least one active product sees Mode A
 * (one-click generate); everyone else sees Mode B (email + paste).
 * The KB article inline form does NOT pass user, leaving the widget
 * to self-resolve via /api/support/verification-key/whoami; that path
 * is statically prerendered and cannot SSR the user.
 */
export default async function ContactSupportPage() {
  const session = await getCurrentSession();
  let user: VerificationKeyUser | null = null;
  if (session) {
    const active = await hasActiveProduct(
      session.account.accountId,
      session.account.email,
    );
    user = { email: session.account.email, hasActiveProduct: active };
  }
  return (
    <>
      <Section className="pb-6">
        <Container size="prose">
          <Breadcrumbs
            items={[
              { label: "Help", href: "/help" },
              { label: "Contact Support" },
            ]}
            className="mb-5"
          />
          <PageHeader
            title="Contact Support"
            description="Can't find what you need in our help articles? Send us a ticket. We're a small studio, so a real person reads every one and writes back within 48 hours."
          />
        </Container>
      </Section>

      <Section className="!pt-2 !pb-20">
        <Container size="prose">
          <div
            id="support-form"
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-md)] sm:p-8"
          >
            <SupportForm user={user} />
            <AnchorScrollOnMount targetId="support-form" />
          </div>
        </Container>
      </Section>
    </>
  );
}
