import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { REFUND_ADDENDUMS } from "@/content/legal/addendums";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Dunamis Studios master refund framework. Product-specific windows and conditions are set in per-product refund addendums.",
  alternates: { canonical: "/refund-policy" },
};

const LAST_UPDATED = "May 11, 2026";

export default function RefundPolicyPage() {
  return (
    <Section>
      <Container size="md">
        <PageHeader
          eyebrow="Legal"
          title="Refund Policy"
          description={`Last updated ${LAST_UPDATED}`}
        />

        <div className="mt-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="font-medium">Draft, not final.</p>
          <p className="mt-2">
            This refund policy mirrors §15 of the{" "}
            <Link href="/terms" className="underline">
              Terms of Sale
            </Link>
            . The Terms of Sale are the controlling document; if anything on this page
            conflicts with the Terms of Sale, the Terms of Sale govern.
          </p>
        </div>

        <nav
          aria-label="Product-specific refund addendums"
          className="mt-6 rounded-lg border border-[var(--fg-subtle)]/30 bg-[color-mix(in_oklch,var(--fg)_3%,transparent)] px-4 py-4 text-sm"
        >
          <p className="font-medium">Product-specific refund windows</p>
          <p className="mt-2 text-[var(--fg-muted)]">
            This page describes the master refund framework applicable to every product.
            Each product has its own refund window and conditions in a per-product addendum:
          </p>
          <ul className="mt-3 list-none space-y-1">
            {REFUND_ADDENDUMS.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={`/refund-policy/${entry.slug}`}
                  className="text-[var(--fg-muted)] underline-offset-2 hover:underline"
                >
                  <span className="font-mono text-xs text-[var(--fg-subtle)]">
                    /refund-policy/{entry.slug}
                  </span>{" "}
                  &mdash; {entry.productLabel} ({entry.windowSummary})
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-10 space-y-10 text-[var(--fg-muted)] leading-relaxed">
          <section>
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              How to request a refund
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                Email{" "}
                <a className="underline" href="mailto:support@dunamisstudios.com">
                  support@dunamisstudios.com
                </a>{" "}
                from the email address used to purchase.
              </li>
              <li>
                Include your order number from the purchase confirmation email Resend sent
                immediately after payment.
              </li>
              <li>
                Identify the product and, where the product-specific addendum requires it,
                include any additional information (defect description, install date, etc.)
                described in the addendum.
              </li>
            </ol>
            <p className="mt-3">
              <strong>Approval decision</strong>: within 5 business days. We respond either
              way (yes, no, or &ldquo;let&rsquo;s talk&rdquo;).
            </p>
            <p className="mt-2">
              <strong>Processing</strong>: within 7 business days of approval, refund issued
              to the original payment method through Stripe. Bank-side settlement takes
              another 3 to 5 business days depending on your card issuer.
            </p>
          </section>

          <section>
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              Payment-method handling
            </h2>
            <p className="mt-3">
              All refunds are issued to the original payment method through Stripe, the
              payment processor of record. Dunamis Studios does not issue refunds in cash,
              store credit (unless explicitly requested by Customer and agreed by Dunamis
              Studios), or alternative payment instruments. Where the original payment
              method is no longer valid (expired card, closed account), Customer should
              contact{" "}
              <a className="underline" href="mailto:support@dunamisstudios.com">
                support@dunamisstudios.com
              </a>{" "}
              to coordinate an alternative refund destination subject to verification.
            </p>
          </section>

          <section>
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              How license revocation works in general
            </h2>
            <p className="mt-3">
              Refund approval for a licensed software product triggers a license-revocation
              event on the Dunamis Studios entitlement system. The product&rsquo;s next
              heartbeat or activation check picks up the revocation and the product
              transitions to its in-app lockdown state for that license. Customer&rsquo;s
              local data (where the product stores data locally) is not deleted by
              revocation and remains on Customer&rsquo;s device. The product-specific
              addendum describes the heartbeat cadence, the offline-grace behavior, and the
              expected user experience after revocation.
            </p>
            <p className="mt-3">
              For subscription products, refund approval (where the addendum permits) ends
              the current billing period and stops future renewals. Access to the hosted
              service ends consistent with the addendum&rsquo;s description of subscription
              termination.
            </p>
          </section>

          <section>
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              What is not refundable under the master framework
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                <strong>Custom-build engagements.</strong> Build Services projects are
                governed by a separate Master Services Agreement and Statement of Work.
                Cancellation and refund terms for custom-build engagements are set in those
                documents and are not covered by this page.
              </li>
              <li>
                <strong>Fees outside the applicable addendum&rsquo;s refund window.</strong>{" "}
                After the window in the product addendum has elapsed, refunds are at Dunamis
                Studios&rsquo;s discretion and are considered case-by-case for material
                misunderstandings, duplicate purchases, or other equitable reasons.
              </li>
              <li>
                <strong>Fees Customer disputes via chargeback before contacting Dunamis
                Studios.</strong> See <a href="#chargebacks" className="underline">Chargebacks</a>{" "}
                below.
              </li>
            </ul>
          </section>

          <section id="chargebacks" className="scroll-mt-24">
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              Chargebacks
            </h2>
            <p className="mt-3">
              If Customer initiates a chargeback through its bank or card issuer instead of
              contacting Dunamis Studios first, Dunamis Studios strongly prefers to handle
              the issue directly. Chargebacks are expensive on both sides: the merchant fee
              for a contested charge often exceeds the refund amount, and chargeback
              histories accumulate as record signals to the payment processor. Email us
              first; we would much rather refund and move on than fight a chargeback.
            </p>
            <p className="mt-3">
              For chargebacks initiated without prior contact, Dunamis Studios reserves the
              right to (a) contest the chargeback with evidence of delivery and Customer
              acceptance, (b) terminate the affected account and licenses on receipt of the
              chargeback notice, and (c) decline future purchases from the disputing
              Customer.
            </p>
          </section>

          <section>
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              Consumer law
            </h2>
            <p className="mt-3">
              Nothing in this Refund Policy or in a product addendum limits rights Customer
              has under applicable consumer law that cannot be waived by contract.
            </p>
          </section>

          <section>
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              Contact
            </h2>
            <p className="mt-3">
              Refund requests, chargeback discussions, and any related questions:{" "}
              <a className="underline" href="mailto:support@dunamisstudios.com">
                support@dunamisstudios.com
              </a>
              .
            </p>
          </section>
        </div>
      </Container>
    </Section>
  );
}
