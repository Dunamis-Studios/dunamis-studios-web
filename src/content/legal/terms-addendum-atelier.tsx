import Link from "next/link";
import { LEGAL_METADATA } from "./metadata";
import type { LegalDocument } from "./types";

const CALLOUT =
  "mt-4 rounded-md border border-[var(--fg-subtle)]/40 bg-[color-mix(in_oklch,var(--fg)_4%,transparent)] px-4 py-4 text-sm";

export const termsAddendumAtelier: LegalDocument = {
  ...LEGAL_METADATA.atelierAddendum,
  idPrefix: "a-",
  sections: [
    {
      n: "A0",
      id: "a-precedence",
      title: "Order of precedence",
      body: (
        <>
          <p>
            This Atelier Terms Addendum (this &ldquo;<strong>Addendum</strong>&rdquo;)
            supplements the Dunamis Studios{" "}
            <Link href="/terms" className="underline">
              Terms of Sale
            </Link>{" "}
            (the &ldquo;<strong>Master Terms</strong>&rdquo;), which apply to all products
            and services sold on dunamisstudios.com. In the event of a conflict between
            this Addendum and the Master Terms, this Addendum controls for Atelier. On all
            other topics, the Master Terms govern.
          </p>
          <p className="mt-3">
            This Addendum is in addition to the Atelier End-User License Agreement
            presented on first activation of Atelier, which governs the licensed use of the
            Atelier software itself.
          </p>
          <div className={CALLOUT}>
            <p>
              <strong>Draft, not final.</strong> This Addendum is in draft form pending
              review by outside counsel.
            </p>
          </div>
        </>
      ),
    },
    {
      n: "A1",
      id: "a-product",
      title: "Product description",
      body: (
        <p>
          Atelier is a desktop application for wedding photographers and small studios
          covering wedding, vendor, guest, and business workflow management. Atelier is
          distributed as a one-time-purchase perpetual license for the current major
          version. The software runs locally on Customer&rsquo;s device and stores
          wedding, vendor, guest, and business data in a local SQLite file under the
          Customer&rsquo;s user profile.
        </p>
      ),
    },
    {
      n: "A2",
      id: "a-license",
      title: "License grant",
      body: (
        <>
          <p>
            Subject to this Addendum, the Master Terms, the Atelier EULA, and
            Customer&rsquo;s payment of the applicable fee, Dunamis Studios grants
            Customer a perpetual, non-exclusive, non-transferable, non-sublicensable
            license to install and use the licensed major version of Atelier for
            Customer&rsquo;s internal business purposes.
          </p>
          <p className="mt-3">
            <strong>Device cap.</strong> The license permits activation on up to{" "}
            <strong>three (3) Customer-controlled devices</strong> simultaneously. Customer
            may deactivate a device through the Atelier account dashboard or by contacting{" "}
            <a className="underline" href="mailto:support@dunamisstudios.com">
              support@dunamisstudios.com
            </a>{" "}
            to free up an activation slot. Hardware replacement, device loss, or platform
            reinstall does not consume an additional license; Customer should deactivate
            the prior device.
          </p>
          <p className="mt-3">
            <strong>Major version scope.</strong> The license covers the major version
            Customer purchased and all minor and patch updates within that major version
            line. Subsequent major versions are separate licenses; see{" "}
            <a className="underline" href="#a-majors">§A5</a>.
          </p>
        </>
      ),
    },
    {
      n: "A3",
      id: "a-refunds",
      title: "Refund policy",
      body: (
        <>
          <p>
            <strong>14 days, no questions asked, on unactivated licenses.</strong> If
            Customer purchased an Atelier license and has not activated it on any device,
            Customer may request a refund within fourteen (14) days of purchase. No reason
            is required.
          </p>
          <p className="mt-3">
            <strong>30 days, for reproducible defects, on activated licenses.</strong> If
            Customer has activated Atelier and encounters a reproducible defect, Customer
            must report the defect to{" "}
            <a className="underline" href="mailto:support@dunamisstudios.com">
              support@dunamisstudios.com
            </a>{" "}
            before requesting a refund. If Dunamis Studios cannot resolve the defect within
            a reasonable time, Customer may request a refund within thirty (30) days of the
            original purchase.
          </p>
          <p className="mt-3">
            <strong>After 30 days.</strong> Post-window refunds are at Dunamis
            Studios&rsquo;s discretion and are considered for material misunderstandings
            and duplicate purchases.
          </p>
          <p className="mt-3">
            The full refund process, including post-refund license deactivation and
            chargeback handling, is described at{" "}
            <Link href="/refund-policy/atelier" className="underline">
              /refund-policy/atelier
            </Link>
            .
          </p>
        </>
      ),
    },
    {
      n: "A4",
      id: "a-free-bug-fixes",
      title: "Free bug fixes within a major version",
      body: (
        <p>
          During the lifetime of the licensed major version, Dunamis Studios issues bug
          fixes, security patches, and compatibility updates at no additional charge.
          Customer&rsquo;s perpetual license includes the right to install and run those
          updates. Dunamis Studios does not commit to a release schedule and may, in its
          discretion, decline to fix non-defect issues, decline to back-port fixes from
          later major versions, or end maintenance for a major version after a successor
          major version has been generally available for at least twelve (12) months. The
          end-of-maintenance window for each major version is announced on the Atelier
          product page and by email to active license holders.
        </p>
      ),
    },
    {
      n: "A5",
      id: "a-majors",
      title: "Major version upgrades",
      body: (
        <>
          <p>
            New major versions of Atelier are released as separate paid licenses. A major
            version is a release that, in Dunamis Studios&rsquo;s reasonable judgment,
            introduces material new functionality, schema changes that require migration,
            architecture changes, or other changes that materially alter the
            then-current Atelier experience. Minor and patch updates within a major
            version line do not require a new purchase and are covered by{" "}
            <a className="underline" href="#a-free-bug-fixes">§A4</a>.
          </p>
          <p className="mt-3">
            Customer may continue using the licensed major version perpetually under this
            Addendum and the applicable EULA even after a new major version is released.
            Dunamis Studios is not obligated to back-port new-major features to prior
            majors.
          </p>
        </>
      ),
    },
    {
      n: "A6",
      id: "a-loyalty-discount",
      title: "Major version loyalty discount",
      body: (
        <>
          <p>
            Holders of a paid Atelier license that has not been refunded are eligible for a{" "}
            <strong>thirty percent (30%) loyalty discount</strong> off the list price of
            the next major version at launch. The discount is applied at checkout when
            Customer is signed in to the Dunamis Studios account that holds the prior
            major&rsquo;s license.
          </p>
          <p className="mt-3">
            <strong>Forfeiture on refund.</strong> If Customer refunds the prior
            major&rsquo;s license at any time (including under{" "}
            <a className="underline" href="#a-refunds">§A3</a> or otherwise), the loyalty
            discount is forfeited as to that license. If Customer later re-purchases at
            full price, the loyalty clock restarts from the re-purchase date.
          </p>
          <p className="mt-3">
            <strong>Cumulation.</strong> The loyalty discount does not cumulate across
            promotions or coupons. Customer receives the better of the loyalty discount or
            an applicable promotional code at checkout, not both.
          </p>
        </>
      ),
    },
    {
      n: "A7",
      id: "a-offline-grace",
      title: "Offline grace period",
      body: (
        <p>
          Atelier validates its license by a daily online heartbeat to the Dunamis Studios
          activation server. If the device cannot reach the activation server,
          Atelier&rsquo;s license remains valid for a{" "}
          <strong>thirty (30) day offline grace period</strong> from the last successful
          heartbeat. After the grace period elapses without a successful heartbeat,
          Atelier transitions to the in-app lockdown screen and remains locked until the
          device can reach the activation server and validate the license. Locked Atelier
          installations do not lose Customer&rsquo;s local data; the lockdown affects
          access to the software only.
        </p>
      ),
    },
    {
      n: "A8",
      id: "a-revocation",
      title: "License revocation",
      body: (
        <p>
          On refund approval (see <a className="underline" href="#a-refunds">§A3</a>) or
          termination for cause (see Master Terms{" "}
          <Link href="/terms#m-term" className="underline">
            §13
          </Link>
          ), Dunamis Studios issues a license-revocation event on the server. The next
          activated Atelier instance to reach the activation server (within the daily
          heartbeat window) receives the revocation and transitions to the in-app
          lockdown screen on every activated device. Customer&rsquo;s local data remains
          on Customer&rsquo;s device and is not deleted by revocation. Customer agrees
          to cease use of the Atelier software upon revocation, consistent with the
          Atelier EULA.
        </p>
      ),
    },
    {
      n: "A9",
      id: "a-customer-data",
      title: "Local data ownership",
      body: (
        <p>
          Atelier stores wedding, vendor, guest, and business data in a local SQLite file
          at <code className="font-mono text-sm">%APPDATA%\studios.dunamis.atelier\atelier.sqlite</code>
          {" "}(or the platform-equivalent path on macOS and Linux). The contents of that
          file are Customer Data under the Master Terms and remain with Customer at all
          times. Dunamis Studios does not receive, access, or process Atelier wedding
          data. Refund, revocation, or end of maintenance does not delete that file and
          does not entitle Dunamis Studios to access it. Customer is responsible for
          backing up that file.
        </p>
      ),
    },
    {
      n: "A10",
      id: "a-telemetry",
      title: "Telemetry and activation data",
      body: (
        <p>
          The activation server receives, at minimum, the license key, an opaque device
          identifier, a truncated client IP address (for rate-limiting and abuse
          response), a coarse client version string, and a heartbeat timestamp. The full
          list of Atelier-related data Dunamis Studios collects, the lawful basis, and the
          retention schedule are described in the{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          . Atelier does not transmit wedding, vendor, guest, or business data to Dunamis
          Studios as part of normal operation.
        </p>
      ),
    },
    {
      n: "A11",
      id: "a-no-sla",
      title: "Activation server availability",
      body: (
        <p>
          Atelier requires the activation server for initial activation and for periodic
          heartbeats during the offline-grace cycle. Dunamis Studios operates the
          activation server on commercially reasonable efforts under Master Terms{" "}
          <Link href="/terms#m-sla" className="underline">
            §18
          </Link>
          . If the activation server is unreachable, the offline grace period in{" "}
          <a className="underline" href="#a-offline-grace">§A7</a> applies. Persistent or
          extended outages that prevent Customer from activating new installations are
          handled by support; contact{" "}
          <a className="underline" href="mailto:support@dunamisstudios.com">
            support@dunamisstudios.com
          </a>
          .
        </p>
      ),
    },
  ],
};
