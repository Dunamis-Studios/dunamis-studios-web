import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { REFUND_ADDENDUMS, findRefundAddendumBySlug } from "@/content/legal/addendums";

interface PageProps {
  params: Promise<{ product: string }>;
}

interface AddendumBody {
  lastUpdated: string;
  body: ReactNode;
}

const BODIES: Record<string, AddendumBody> = {
  atelier: {
    lastUpdated: "May 11, 2026",
    body: (
      <>
        <section>
          <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
            Refund windows
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>14 days, no questions asked, on unactivated license keys.</strong>{" "}
              If you purchased an Atelier license and have not yet activated it on any
              device, email us within 14 days of purchase and we refund in full. No reason
              required.
            </li>
            <li>
              <strong>30 days, for reproducible defects, on activated licenses.</strong>{" "}
              If you have activated Atelier and encounter a reproducible defect, you must
              report the bug to{" "}
              <a className="underline" href="mailto:support@dunamisstudios.net">
                support@dunamisstudios.net
              </a>{" "}
              before requesting a refund. If we cannot resolve the defect within
              reasonable time, you can request a refund within 30 days of the original
              purchase.
            </li>
            <li>
              <strong>
                After 30 days, refunds are at Dunamis Studios&rsquo; discretion.
              </strong>{" "}
              We do consider post-window refunds for material misunderstandings or
              duplicate purchases. Email us and we will respond honestly.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
            What happens to your license after refund approval
          </h2>
          <p className="mt-3">
            Refund approval triggers a license-revocation event on the server. The next
            time your activated Atelier instance fires its daily heartbeat (within 24 hours
            of approval), it receives the revocation and transitions to the in-app
            lockdown screen. The Atelier binary stops working at that point on every
            activated device.
          </p>
          <p className="mt-3">
            We ask you to uninstall Atelier from your machines as a courtesy. Per the
            EULA, the expectation is that you cease use of the software once the refund is
            issued.
          </p>
          <p className="mt-3">
            <strong>Your wedding data is yours.</strong> Atelier stores wedding, vendor,
            guest, and business data in a local SQLite file at{" "}
            <code className="font-mono text-sm">
              %APPDATA%\studios.dunamis.atelier\atelier.sqlite
            </code>
            . Refunding the license does not delete that file or entitle Dunamis Studios
            to access it. Back it up before uninstalling if you might want it later.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
            What is not refundable
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>
              <strong>Major-version upgrades that have already been activated.</strong>{" "}
              If you purchase a v2 upgrade and activate it, the 14-day no-questions window
              has already closed by the activation event. The 30-day
              reproducible-defect path is still available.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
            Loyalty pricing forfeiture
          </h2>
          <p className="mt-3">
            A refund of your v1 license also forfeits the 30% major-version loyalty
            discount that v1 owners would otherwise be eligible for on v2 and later
            majors. The loyalty discount is tied to having an active (not refunded)
            license. If you re-purchase later, you start fresh: re-purchase price is full
            price, and the loyalty clock begins at the new purchase date.
          </p>
        </section>
      </>
    ),
  },
  debrief: {
    lastUpdated: "May 11, 2026",
    body: (
      <>
        <section>
          <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
            Refund window
          </h2>
          <p className="mt-3">
            Debrief subscriptions are billed monthly in advance. Debrief does not issue
            pro-rata refunds for partial periods, except as required by law or as set
            forth in the master Terms of Sale §10 (limited service warranty remedy) or
            §13 (termination for convenience remedy). Customer may cancel at any time at{" "}
            <Link href="/account" className="underline">
              dunamisstudios.com/account
            </Link>
            ; cancellation takes effect at the end of the current billing period and the
            account retains access through that date.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
            Credits
          </h2>
          <p className="mt-3">
            <strong>Monthly allotment credits do not roll over</strong> and are not
            refundable as unused balance. <strong>Add-on credits do not expire</strong>{" "}
            during an active subscription and are not refundable as unused balance; on
            termination, unused add-on credits expire with the subscription and are not
            refunded. See the{" "}
            <Link href="/terms/debrief" className="underline">
              Debrief Service Addendum
            </Link>{" "}
            for the full credit framework.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
            What happens after cancellation
          </h2>
          <p className="mt-3">
            Cancellation ends future renewals. The subscription continues through the end
            of the current paid billing period; Briefs may be generated until that date
            using available credits. After the period ends, Briefs cannot be generated
            and remaining add-on credits expire.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
            HubSpot data
          </h2>
          <p className="mt-3">
            Cancellation does not delete data in Customer&rsquo;s HubSpot portal. Briefs
            previously written to HubSpot remain in HubSpot under Customer&rsquo;s
            control. Dunamis Studios deletes Customer-side stored OAuth tokens and
            entitlement records consistent with the Privacy Policy retention schedule.
          </p>
        </section>
      </>
    ),
  },
  "property-pulse": {
    lastUpdated: "May 11, 2026",
    body: (
      <>
        <section>
          <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
            Refund window
          </h2>
          <p className="mt-3">
            Customer may request a full refund of the one-time Property Pulse license fee
            within <strong>seven (7) days</strong> of the original install date by
            contacting{" "}
            <a className="underline" href="mailto:support@dunamisstudios.net">
              support@dunamisstudios.net
            </a>
            . After the seven-day window, no refund is issued, except as required by law
            or as set forth in the master Terms of Sale §10 (limited service warranty
            remedy) or §13 (termination for convenience remedy).
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
            What happens after refund approval
          </h2>
          <p className="mt-3">
            Refund of the one-time fee terminates the Property Pulse license for the
            affected HubSpot portal. Dunamis Studios disables app access for that portal
            and follows the data-deletion process described in the master Terms of Sale
            §13. The Property Pulse app is unaffected in other portals Customer continues
            to own a license for.
          </p>
          <p className="mt-3">
            No Customer CRM data is held by Dunamis Studios infrastructure to delete:
            Property Pulse reads HubSpot data on demand and does not persist it. OAuth
            tokens, entitlement metadata, and app-configuration data stored by Dunamis
            Studios in connection with the affected portal are deleted under the Privacy
            Policy retention schedule.
          </p>
        </section>

        <section>
          <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
            Beta period
          </h2>
          <p className="mt-3">
            During the Property Pulse beta period, the app is provided free of charge. The
            seven-day refund window does not apply during the beta period because no fee
            is collected. The Property Pulse Service Addendum §P7 describes how the beta
            transition to general availability is handled.
          </p>
        </section>
      </>
    ),
  },
};

export function generateStaticParams() {
  return REFUND_ADDENDUMS.map((entry) => ({ product: entry.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { product } = await params;
  const entry = findRefundAddendumBySlug(product);
  if (!entry) return {};
  return {
    title: `${entry.productLabel} Refund Policy`,
    description: `Refund window and process for ${entry.productLabel}. Supplements the Dunamis Studios master refund framework.`,
    alternates: { canonical: `/refund-policy/${entry.slug}` },
  };
}

export default async function RefundAddendumPage({ params }: PageProps) {
  const { product } = await params;
  const entry = findRefundAddendumBySlug(product);
  if (!entry) notFound();
  const body = BODIES[entry.slug];
  if (!body) notFound();

  return (
    <Section>
      <Container size="md">
        <PageHeader
          eyebrow="Legal · Refund addendum"
          title={`${entry.productLabel} Refund Policy`}
          description={`Last updated ${body.lastUpdated}`}
        />

        <div className="mt-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="font-medium">Draft, not final.</p>
          <p className="mt-2">
            This addendum supplements the Dunamis Studios{" "}
            <Link href="/refund-policy" className="underline">
              master refund framework
            </Link>
            . In the event of a conflict between this addendum and the master refund
            framework, this addendum controls for {entry.productLabel}.
          </p>
        </div>

        <div className="mt-10 space-y-10 text-[var(--fg-muted)] leading-relaxed">
          {body.body}
        </div>

        <div className="mt-12 border-t border-[var(--fg-subtle)]/20 pt-6 text-sm">
          <p>
            Return to the{" "}
            <Link href="/refund-policy" className="underline">
              master Refund Policy
            </Link>
            .
          </p>
        </div>
      </Container>
    </Section>
  );
}
