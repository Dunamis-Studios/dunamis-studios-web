import Link from "next/link";
import type { LegalDocument } from "./types";

export const termsPropertyPulse: LegalDocument = {
  title: "Property Pulse Service Addendum",
  lastUpdated: "April 23, 2026",
  version: "2.0",
  idPrefix: "p-",
  sections: [
    {
      n: "P1",
      id: "p-service-description",
      title: "Service description",
      body: (
        <>
          <p>
            Property Pulse is a HubSpot CRM card application that displays property change
            history for HubSpot records (contacts, companies, deals, tickets, and custom
            objects) and enables inline property editing. For each tracked property, Property
            Pulse reads the current value, historical change log, and source attribution
            (including user attribution and CRM UI source) from Customer&rsquo;s HubSpot
            portal on demand and displays this information in a card on the HubSpot record.
          </p>
          <p className="mt-3">Property Pulse features include:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>(a)</strong> property change history display with source attribution,
              recency badges, and numeric deltas;
            </li>
            <li>
              <strong>(b)</strong> admin-configurable tracked-property selection per object
              type;
            </li>
            <li>
              <strong>(c)</strong> user-scoped additional tracked properties (where
              admin-enabled);
            </li>
            <li>
              <strong>(d)</strong> inline property editing for writable, admin-tracked
              properties, triggered only by explicit user save;
            </li>
            <li>
              <strong>(e)</strong> filterable change log by date range, source type, user, and
              search;
            </li>
            <li>
              <strong>(f)</strong> CSV export of property change history.
            </li>
          </ul>
        </>
      ),
    },
    {
      n: "P2",
      id: "p-no-ai",
      title: "No AI use",
      body: (
        <p>
          Property Pulse does not use artificial intelligence and does not transmit Customer
          Data to Anthropic or any other AI service provider. The AI Output provisions of
          Master Agreement <a className="underline" href="#m-ai-output">§7</a>, the AI Output
          sub-cap in Master Agreement <a className="underline" href="#m-liability">§12</a>, and
          the Anthropic Usage Policy flow-through in Master Agreement{" "}
          <a className="underline" href="#m-aup">§6</a> do not apply to Property Pulse.
        </p>
      ),
    },
    {
      n: "P3",
      id: "p-data-handling",
      title: "Data handling",
      body: (
        <>
          <p>
            Property Pulse reads property values, change history, owner/user directory data,
            property schemas, and pipeline stages from Customer&rsquo;s HubSpot portal on
            demand, as required to render each view. No
            Customer CRM Data is cached or persisted in Dunamis Studios infrastructure; all
            HubSpot Data is fetched live per user request and discarded after the response is
            returned.
          </p>
          <p className="mt-3">
            Dunamis Studios stores only the following in its infrastructure in connection with
            Property Pulse:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>(a)</strong> OAuth access and refresh tokens, stored in managed Redis
              (Upstash) with TLS in transit and provider-managed encryption at rest;
            </li>
            <li>
              <strong>(b)</strong> rate-limit counters (short-lived, seconds-scale TTL);
            </li>
            <li>
              <strong>(c)</strong> entitlement metadata (portal ID, license status, Stripe
              reference);
            </li>
            <li>
              <strong>(d)</strong> app-configuration data in HubDB (property names and display
              settings; no customer CRM values).
            </li>
          </ul>
          <p className="mt-3">
            Writes to HubSpot occur only via the inline-edit feature, triggered by an explicit
            user save action, and only to properties that are (i) writable (not read-only or
            calculated) and (ii) admin-tracked or user-added with admin opt-in.
          </p>
        </>
      ),
    },
    {
      n: "P4",
      id: "p-csv-export",
      title: "CSV export",
      body: (
        <p>
          The CSV export feature generates a file containing property change history (property
          values, sources, source details, and timestamps) for the requested property and
          record. The export is authenticated via a short-lived HMAC token (five-minute TTL)
          bound to the requesting portal, user, object, and property, and is hardened against
          CSV formula injection. Customer is responsible for the security of exported files
          once delivered.
        </p>
      ),
    },
    {
      n: "P5",
      id: "p-pricing",
      title: "Pricing",
      body: (
        <>
          <p>
            Property Pulse is offered as a one-time license per HubSpot portal, described at{" "}
            <Link href="/products/property-pulse" className="underline">
              /products/property-pulse
            </Link>
            .
          </p>
          <p className="mt-3">
            <strong>Current price: US$49 per HubSpot portal, one-time, paid at install.</strong>
          </p>
          <p className="mt-3">
            No recurring fees, subscription charges, or per-user fees apply. The license
            continues in perpetuity per HubSpot portal, subject to the Master Agreement, this
            Addendum, and the Customer&rsquo;s compliance with its terms.
          </p>
          <p className="mt-3">
            Future Property Pulse updates, bug fixes, and compatibility improvements to the
            then-current HubSpot API are included in the one-time fee during the ordinary
            course of Dunamis Studios&rsquo;s maintenance of Property Pulse. Significant new
            feature releases may be offered as paid upgrades at Dunamis Studios&rsquo;s
            discretion.
          </p>
        </>
      ),
    },
    {
      n: "P6",
      id: "p-refunds",
      title: "Refund policy",
      body: (
        <>
          <p>
            Customer may request a full refund of the one-time Property Pulse license fee
            within <strong>seven (7) days</strong> of the original install date by contacting{" "}
            <a href="mailto:support@dunamisstudios.net" className="underline">
              support@dunamisstudios.net
            </a>
            . After the seven-day window, no refund is issued, except as required by law or as
            set forth in the Master Agreement{" "}
            <a className="underline" href="#m-warranties">§10</a> (limited service warranty
            remedy) or <a className="underline" href="#m-term">§13</a> (termination for
            convenience remedy).
          </p>
          <p className="mt-3">
            Refund of the one-time fee terminates the license for the affected portal. Dunamis
            Studios will disable access and follow the data-deletion process described in
            Master Agreement <a className="underline" href="#m-term">§13</a>.
          </p>
        </>
      ),
    },
    {
      n: "P7",
      id: "p-beta",
      title: "Beta terms (applicable during beta period only)",
      body: (
        <>
          <p>
            During the beta period, Property Pulse is provided free of charge. Beta
            participation is subject to the Master Agreement and this Addendum. The beta-period
            pricing is <strong>$0</strong> and the <a className="underline" href="#p-refunds">§P6</a>{" "}
            refund policy does not apply (there being no fee to refund).
          </p>
          <p className="mt-3">
            When Property Pulse exits beta, existing beta installations will be notified at
            least <strong>thirty (30) days</strong> in advance. At general availability,
            existing beta installations will be offered the option to (a) convert to a paid
            license at the then-current one-time fee, or (b) uninstall without charge. No
            charges will be applied to a beta portal without Customer&rsquo;s explicit
            affirmative consent to convert.
          </p>
        </>
      ),
    },
    {
      n: "P8",
      id: "p-termination",
      title: "Service-specific termination",
      body: (
        <p>
          In addition to the termination rights in the Master Agreement{" "}
          <a className="underline" href="#m-term">§13</a>, if HubSpot terminates or restricts
          Dunamis Studios&rsquo;s access to its marketplace APIs such that Property Pulse
          cannot functionally operate, Dunamis Studios may terminate the license for affected
          portals and issue pro-rated refunds for licenses purchased within the then-current
          refund window.
        </p>
      ),
    },
    {
      n: "P9",
      id: "p-sla",
      title: "No SLA",
      body: (
        <p>
          Property Pulse operates on commercially reasonable efforts. No uptime guarantee,
          service credits, or failover arrangements apply, consistent with the Master Agreement{" "}
          <a className="underline" href="#m-sla">§17</a>. Property Pulse performance is
          materially dependent on HubSpot API availability and response times, which are
          outside Dunamis Studios&rsquo;s control.
        </p>
      ),
    },
  ],
};
