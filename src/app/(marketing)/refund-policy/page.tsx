import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Atelier refund window, how to request a refund, and how license deactivation works after refund approval.",
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
            This refund policy mirrors §6 of the{" "}
            <Link href="/terms" className="underline">
              Terms of Sale
            </Link>
            . The Terms of Sale are the controlling document; if anything on this page conflicts
            with the Terms of Sale, the Terms of Sale govern.
          </p>
        </div>

        <div className="mt-10 space-y-10 text-[var(--fg-muted)] leading-relaxed">
          <section>
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              Refund windows
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>14 days, no questions asked, on unactivated license keys.</strong> If you
                purchased an Atelier license and have not yet activated it on any device, email
                us within 14 days of purchase and we refund in full. No reason required.
              </li>
              <li>
                <strong>30 days, for reproducible defects, on activated licenses.</strong> If you
                have activated Atelier and encounter a reproducible defect, you must report the
                bug to{" "}
                <a className="underline" href="mailto:support@dunamisstudios.com">
                  support@dunamisstudios.com
                </a>{" "}
                before requesting a refund. If we cannot resolve the defect within reasonable
                time, you can request a refund within 30 days of the original purchase.
              </li>
              <li>
                <strong>After 30 days, refunds are at Dunamis Studios&rsquo; discretion.</strong>{" "}
                We do consider post-window refunds for material misunderstandings or duplicate
                purchases. Email us and we will respond honestly.
              </li>
            </ul>
          </section>

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
                Include your order number (from the purchase confirmation email Resend sends
                immediately after payment).
              </li>
              <li>
                For activated licenses: include a description of the defect and step-by-step
                instructions to reproduce it.
              </li>
              <li>For unactivated licenses: no description required.</li>
            </ol>
            <p className="mt-3">
              <strong>Approval decision</strong>: within 5 business days. We respond either way
              (yes, no, or &ldquo;let&rsquo;s talk&rdquo;).
            </p>
            <p className="mt-2">
              <strong>Processing</strong>: within 7 business days of approval, refund issued to
              the original payment method. Bank-side settlement takes another 3 to 5 business
              days depending on your card issuer.
            </p>
          </section>

          <section>
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              What happens to your license after refund approval
            </h2>
            <p className="mt-3">
              Refund approval triggers a license-revocation event on the server. The next time
              your activated Atelier instance fires its daily heartbeat (within 24 hours of
              approval), it receives the revocation and transitions to the in-app lockdown
              screen. The Atelier binary stops working at that point on every activated device.
            </p>
            <p className="mt-3">
              We ask you to uninstall Atelier from your machines as a courtesy. Per the EULA, the
              expectation is that you cease use of the software once the refund is issued.
            </p>
            <p className="mt-3">
              <strong>Your wedding data is yours.</strong> Atelier stores wedding, vendor, guest,
              and business data in a local SQLite file at{" "}
              <code className="font-mono text-sm">
                %APPDATA%\studios.dunamis.atelier\atelier.sqlite
              </code>
              . Refunding the license does not delete that file or entitle Dunamis Studios to
              access it. Back it up before uninstalling if you might want it later.
            </p>
          </section>

          <section>
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              What is not refundable
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                <strong>Custom-build engagements.</strong> Build Services projects are governed
                by a separate Master Services Agreement and Statement of Work. Cancellation and
                refund terms for custom-build engagements are set in those documents and are not
                covered by this page.
              </li>
              <li>
                <strong>Major-version upgrades that have already been activated.</strong> If you
                purchase a v2 upgrade and activate it, the 14-day no-questions window has
                already closed by the activation event. The 30-day reproducible-defect path is
                still available.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              Loyalty pricing forfeiture
            </h2>
            <p className="mt-3">
              A refund of your v1 license also forfeits the 30% major-version loyalty discount
              that v1 owners would otherwise be eligible for on v2 and later majors. The loyalty
              discount is tied to having an active (not refunded) license. If you re-purchase
              later, you start fresh: re-purchase price is full price, and the loyalty clock
              begins at the new purchase date.
            </p>
          </section>

          <section>
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              Chargebacks
            </h2>
            <p className="mt-3">
              If you initiate a chargeback through your bank or card issuer instead of
              contacting us first, we strongly prefer to handle the issue directly. Chargebacks
              are expensive on both sides: the merchant fee for a contested charge often exceeds
              the refund amount, and chargeback histories accumulate as record signals to the
              payment processor. Email us first; we would much rather refund and move on than
              fight a chargeback.
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
