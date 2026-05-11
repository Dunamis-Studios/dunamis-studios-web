import Link from "next/link";
import { LEGAL_METADATA } from "./metadata";
import type { LegalDocument } from "./types";

export const privacyPolicy: LegalDocument = {
  ...LEGAL_METADATA.privacy,
  idPrefix: "pp-",
  sections: [
    {
      n: "0",
      id: "pp-draft-banner",
      title: "Draft, not final",
      body: (
        <>
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            <p className="font-medium">This policy is a working draft.</p>
            <p className="mt-2">
              It describes Dunamis Studios&rsquo; current data-handling practices for the
              marketing site, customer accounts, the Atelier desktop app, and our HubSpot
              marketplace apps. It will be finalized once the underlying Dunamis Studios LLC
              entity formation completes and counsel reviews the final draft. Where this draft
              differs from a future final version, the final version controls from its effective
              date forward.
            </p>
          </div>
        </>
      ),
    },
    {
      n: "1",
      id: "pp-effective-date",
      title: "Effective date",
      body: (
        <>
          <p>
            This Privacy Policy is effective <strong>May 11, 2026</strong> and supersedes the
            April 23, 2026 version (2.0).
          </p>
          <p className="mt-3">
            Material changes are subject to the notification process in{" "}
            <a href="#pp-changes" className="underline">
              §14 Changes to this policy
            </a>
            .
          </p>
        </>
      ),
    },
    {
      n: "2",
      id: "pp-who-we-are",
      title: "Who we are",
      body: (
        <>
          <p>
            References to &ldquo;Dunamis Studios,&rdquo; &ldquo;Dunamis,&rdquo; &ldquo;we,&rdquo;
            &ldquo;us,&rdquo; or &ldquo;our&rdquo; mean <strong>Joshua Robert Bradford</strong>,
            an individual resident of the State of Florida, United States, doing business under
            the name Dunamis Studios. Upon completion of formation, the LLC named{" "}
            <strong>Dunamis Studios LLC</strong>, a Florida limited liability company, will
            assume this Privacy Policy and all associated commitments by operation of law and
            internal transfer.
          </p>
          <p className="mt-3">
            Postal address and contact channels are listed in{" "}
            <a href="#pp-contact" className="underline">
              §13 Contact
            </a>
            .
          </p>
        </>
      ),
    },
    {
      n: "3",
      id: "pp-what-we-collect",
      title: "What we collect, by surface",
      body: (
        <>
          <p>
            Different products and surfaces collect different data. This section enumerates
            every collection point.
          </p>

          <p className="mt-4 font-medium">Marketing site (dunamisstudios.com)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Vercel-default access logs (request IP truncated per{" "}
              <a href="#pp-fingerprint" className="underline">
                §6
              </a>
              , User-Agent, request path, status code, timing). 30-day retention.
            </li>
            <li>No web analytics tools. No advertising or tracking pixels.</li>
            <li>
              No cookies set by Dunamis Studios. Vercel may set a session cookie strictly to
              route requests to the correct edge region.
            </li>
          </ul>

          <p className="mt-4 font-medium">Atelier desktop app (local-only)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Nothing transmitted</strong> from Atelier except the license-related calls
              below. Wedding data, vendor data, client PII, business data: never leave the
              customer&rsquo;s machine.
            </li>
          </ul>

          <p className="mt-4 font-medium">Atelier license activation</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>License ID, device fingerprint hash, Atelier version, optional device label.</li>
            <li>Request IP (truncated per §6) and User-Agent.</li>
          </ul>

          <p className="mt-4 font-medium">Atelier license heartbeat (once per day)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>License ID, device fingerprint hash, Atelier version. Request IP truncated.</li>
            <li>Payload is approximately 1 KB. No business data, no usage data.</li>
          </ul>

          <p className="mt-4 font-medium">Atelier crash reports</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              None. Atelier ships with no crash reporter, no telemetry, no analytics. If this
              ever changes, it will require an explicit opt-in surface in Settings.
            </li>
          </ul>

          <p className="mt-4 font-medium">Atelier auto-update check (opt-out)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Standard HTTP GET to{" "}
              <code className="font-mono text-sm">
                github.com/Dunamis-Studios/atelier/releases/latest/download/latest.json
              </code>
              . No payload beyond what every HTTP request carries (request IP, User-Agent).
              GitHub, not Dunamis Studios, sees and logs this request. Disabled in Atelier
              Settings to Software Updates.
            </li>
          </ul>

          <p className="mt-4 font-medium">Dunamis Sync (opt-in only)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Off by default. When the customer activates Sync, Atelier exchanges
              client-encrypted opaque blobs with{" "}
              <code className="font-mono text-sm">dunamisstudios.net/api/sync/*</code> and{" "}
              <code className="font-mono text-sm">sync.dunamisstudios.net</code>. The encryption
              key lives in Windows Credential Manager and never crosses the network.
            </li>
            <li>
              Detailed practices, including blob metadata, retention, and rotation, are
              documented separately when Dunamis Sync launches as a separately-sold product.
              Until then, Sync is not available to customers.
            </li>
          </ul>

          <p className="mt-4 font-medium">Stripe Checkout (license purchase, custom-build invoicing)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Stripe is the controller for payment data (card details, billing address). Dunamis
              Studios receives a Stripe customer ID, a payment intent reference, and the
              customer email used at checkout. Card numbers do not transit Dunamis-controlled
              infrastructure. See Stripe&rsquo;s Privacy Policy.
            </li>
          </ul>

          <p className="mt-4 font-medium">Customer accounts on dunamisstudios.com</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Email address, hashed password (bcrypt), name, optional company name.</li>
            <li>
              Account creation IP (truncated per §6), account creation timestamp, last-login
              timestamp.
            </li>
            <li>
              License history: every license ID associated with the account plus its issuance
              date, current status (active / refunded / revoked), and per-device activation
              records.
            </li>
            <li>EULA acceptance history: a record of every EULA version accepted on this account.</li>
          </ul>

          <p className="mt-4 font-medium">HubSpot marketplace apps (Debrief, Property Pulse)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              For Customer CRM data accessed by these apps, the customer organization is the
              controller and Dunamis Studios is a processor. See the Data Processing Addendum
              (linked from{" "}
              <a href="/legal/dpa" className="underline">
                /legal/dpa
              </a>
              ) for the full processor terms.
            </li>
          </ul>
        </>
      ),
    },
    {
      n: "4",
      id: "pp-lawful-basis",
      title: "Why we collect each piece (GDPR lawful basis)",
      body: (
        <>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>License validation and enforcement</strong>: Article 6(1)(b),{" "}
              <em>performance of a contract</em>. The license is the contract; validation is the
              performance.
            </li>
            <li>
              <strong>Anti-abuse logging on activation and heartbeat endpoints</strong>: Article
              6(1)(f), <em>legitimate interests</em>. Detecting and blocking license-key sharing,
              automated activation tooling, and endpoint scanning protects the perpetual-license
              commercial model and the operational availability of the licensing service. A
              Legitimate Interests Assessment is on file internally and is summarized in our
              public statements; data subjects may object via{" "}
              <code className="font-mono text-sm">dsr@dunamisstudios.com</code>.
            </li>
            <li>
              <strong>Account creation and management</strong>: Article 6(1)(b), contract
              performance (customer-account contract enabling license management, EULA
              acceptance, refund handling, license-deactivation self-service).
            </li>
            <li>
              <strong>EULA acceptance recording</strong>: Article 6(1)(c),{" "}
              <em>legal obligation</em>, plus 6(1)(b) contract performance. Acceptance records
              are the legal artifact establishing the contract.
            </li>
            <li>
              <strong>Marketing emails (if any in the future)</strong>: Article 6(1)(a),{" "}
              <em>consent</em>. No marketing email program is operating today; if one is
              introduced, opt-in is required and opt-out is one click.
            </li>
            <li>
              <strong>Stripe-administered payment processing</strong>: Article 6(1)(b),
              performance of the sales contract. Stripe is a joint controller for payment data.
            </li>
          </ul>
        </>
      ),
    },
    {
      n: "5",
      id: "pp-do-not-collect",
      title: "What we explicitly DO NOT collect",
      body: (
        <>
          <ul className="list-disc space-y-1 pl-5">
            <li>Wedding data, vendor data, client PII, or any business data from inside Atelier.</li>
            <li>
              Telemetry, analytics, or behavioral tracking inside Atelier. The binary has no
              such code paths.
            </li>
            <li>Cross-site tracking cookies on the marketing site. No third-party trackers.</li>
            <li>Advertising or marketing pixels of any kind.</li>
            <li>Health data, financial account numbers, or government-issued identification.</li>
            <li>Biometric identifiers.</li>
            <li>Precise geolocation. (Coarse country-level inference from IP only, used for tax-routing during Stripe Checkout.)</li>
            <li>Data about minors. Our products are not directed to children under 16.</li>
          </ul>
        </>
      ),
    },
    {
      n: "6",
      id: "pp-fingerprint",
      title: "Device fingerprint composition",
      body: (
        <>
          <p>
            Your device is identified by a fingerprint generated from your computer&rsquo;s
            hardware identifiers. We hash these locally on your machine before transmitting; the
            hash cannot be reversed to identify your computer&rsquo;s components or to track you
            across other software. The hash is purpose-bound to license-slot enforcement and is
            not combined with any other dataset.
          </p>
          <p className="mt-3">
            <strong>IP truncation.</strong> Request IPs received at any
            Dunamis-Studios-operated endpoint are truncated before persistence. IPv4 addresses
            are truncated to a /24 (the last octet replaced with zero); IPv6 addresses are
            truncated to a /48. Truncation occurs at ingest, prior to any log write.
          </p>
        </>
      ),
    },
    {
      n: "7",
      id: "pp-retention",
      title: "Data retention",
      body: (
        <>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>License activation and heartbeat records</strong>: lifetime of the license
              plus seven (7) years for tax and audit. Contains license ID, hashed device
              fingerprints of activated devices, first-activation and last-heartbeat timestamps,
              and Atelier versions observed.
            </li>
            <li>
              <strong>Truncated IPs in access and abuse-detection logs</strong>: 30 days, then
              automatically deleted by Redis TTL.
            </li>
            <li>
              <strong>Customer account record</strong>: until deletion request, or 3 years after
              last login activity, whichever comes first.
            </li>
            <li>
              <strong>EULA acceptance records</strong>: retained permanently. These are the
              legal artifact establishing the contract; deletion would void the contractual
              evidence record. Includes the verbatim rendered EULA text the customer accepted.
            </li>
            <li>
              <strong>Stripe payment records</strong>: retained by Stripe per Stripe&rsquo;s
              own policy and applicable payment-card-industry regulations.
            </li>
            <li>
              <strong>Support correspondence</strong>: 3 years from the last message in the
              thread.
            </li>
          </ul>
        </>
      ),
    },
    {
      n: "8",
      id: "pp-gdpr-rights",
      title: "Your rights under GDPR",
      body: (
        <>
          <p>
            If you are located in the European Economic Area, the United Kingdom, or
            Switzerland, you have the following rights:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Right to access</strong>: request a copy of the personal data we hold
              about you. Email{" "}
              <a href="mailto:dsr@dunamisstudios.com" className="underline">
                dsr@dunamisstudios.com
              </a>
              . 30-day response SLA.
            </li>
            <li>
              <strong>Right to portability</strong>: receive your data in a machine-readable
              JSON format. Use the in-app Export feature inside Atelier for local business data;
              for account-level data including license history, EULA acceptances, and activation
              records, use the &ldquo;Download my data&rdquo; button on{" "}
              <Link href="/account/atelier-licenses" className="underline">
                /account/atelier-licenses
              </Link>
              .
            </li>
            <li>
              <strong>Right to rectification</strong>: correct inaccurate personal data. Email{" "}
              <code className="font-mono text-sm">dsr@dunamisstudios.com</code>.
            </li>
            <li>
              <strong>Right to erasure</strong>: request deletion of your personal data. Email{" "}
              <code className="font-mono text-sm">dsr@dunamisstudios.com</code>. Some records
              (EULA acceptance, Stripe payment history) are retained under legal or contractual
              obligation and cannot be deleted on request; we will tell you which records are
              retained and why.
            </li>
            <li>
              <strong>Right to object to processing</strong>: object to processing based on
              legitimate interests (most notably the anti-abuse logging described above). Email{" "}
              <code className="font-mono text-sm">dsr@dunamisstudios.com</code>.
            </li>
            <li>
              <strong>Right to lodge a complaint</strong> with your local supervisory authority
              (e.g., your national Data Protection Authority).
            </li>
          </ul>
        </>
      ),
    },
    {
      n: "9",
      id: "pp-ccpa-rights",
      title: "Your rights under CCPA / CPRA",
      body: (
        <>
          <p>
            Dunamis Studios currently operates below CCPA/CPRA&rsquo;s revenue ($26,625,000),
            consumer (100,000 California residents), and data-sale (50% of revenue) thresholds,
            so the statute does not strictly apply. We voluntarily extend the substantive
            rights below to California residents.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Right to know</strong> what personal information we have collected, used,
              shared, or sold.
            </li>
            <li>
              <strong>Right to delete</strong> personal information we have collected.
            </li>
            <li>
              <strong>Right to opt out of sale or share</strong> for cross-context behavioral
              advertising. See{" "}
              <Link href="/privacy/do-not-sell" className="underline">
                Do Not Sell or Share My Personal Information
              </Link>
              . Dunamis Studios does not sell or share personal information for behavioral
              advertising and has no plans to.
            </li>
            <li>
              <strong>Right to non-discrimination</strong> for exercising any CCPA right.
            </li>
          </ul>
          <p className="mt-4">
            Exercise any of the above by emailing{" "}
            <a href="mailto:dsr@dunamisstudios.com" className="underline">
              dsr@dunamisstudios.com
            </a>
            . 45-day response under CCPA (we aim for 30).
          </p>
        </>
      ),
    },
    {
      n: "10",
      id: "pp-international",
      title: "International transfers",
      body: (
        <>
          <p>
            Personal data we hold is stored on infrastructure operated by Vercel (United
            States) and Upstash Redis (United States region). For personal data originating in
            the European Economic Area, United Kingdom, or Switzerland, transfers to the United
            States are made under Standard Contractual Clauses (Module 2: Controller to
            Processor) executed with our processors. SCCs are available on request to{" "}
            <code className="font-mono text-sm">privacy@dunamisstudios.com</code>.
          </p>
          <p className="mt-3">
            We do not transfer personal data to jurisdictions that have not received a European
            Commission adequacy decision, except under SCCs or another lawful transfer
            mechanism.
          </p>
        </>
      ),
    },
    {
      n: "11",
      id: "pp-breach",
      title: "Breach notification",
      body: (
        <>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>GDPR</strong>: notification to the relevant supervisory authority within
              72 hours of becoming aware of a personal-data breach. Affected data subjects
              notified without undue delay when the breach is likely to result in high risk to
              their rights and freedoms.
            </li>
            <li>
              <strong>Florida §501.171</strong>: notification to affected Florida residents
              within 30 days of determining that a breach has occurred.
            </li>
            <li>
              <strong>Customer contractual notification</strong>: 48 hours for enterprise
              customers under SOWs that include a notification clause; check your SOW.
            </li>
          </ul>
        </>
      ),
    },
    {
      n: "12",
      id: "pp-cookies",
      title: "Cookies and similar technologies",
      body: (
        <>
          <p>The marketing site sets the following cookies and only these:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Vercel session cookie</strong>: set by the hosting platform to route
              requests to the correct edge region. Session lifetime. No tracking.
            </li>
            <li>
              <strong>Stripe Checkout cookies</strong> (only when a customer enters a Stripe
              Checkout flow): set by Stripe&rsquo;s payment form to prevent fraud and complete
              the transaction. Governed by Stripe&rsquo;s privacy policy.
            </li>
          </ul>
          <p className="mt-4">
            No analytics cookies (Dunamis Studios uses no web analytics). No marketing or
            advertising cookies. No third-party cookies set directly by Dunamis Studios.
          </p>
        </>
      ),
    },
    {
      n: "13",
      id: "pp-contact",
      title: "Contact",
      body: (
        <>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>General privacy inquiries</strong>:{" "}
              <a href="mailto:privacy@dunamisstudios.com" className="underline">
                privacy@dunamisstudios.com
              </a>
            </li>
            <li>
              <strong>Data subject requests</strong> (access, deletion, portability, objection):{" "}
              <a href="mailto:dsr@dunamisstudios.com" className="underline">
                dsr@dunamisstudios.com
              </a>
            </li>
            <li>
              <strong>Security incidents</strong>:{" "}
              <a href="mailto:security@dunamisstudios.com" className="underline">
                security@dunamisstudios.com
              </a>{" "}
              (see also{" "}
              <Link href="/security" className="underline">
                /security
              </Link>{" "}
              for GPG-encrypted disclosure)
            </li>
            <li>
              <strong>Postal address</strong>: to be updated upon LLC formation. Until then,
              correspondence should go through the email channels above.
            </li>
          </ul>
        </>
      ),
    },
    {
      n: "14",
      id: "pp-changes",
      title: "Changes to this policy",
      body: (
        <>
          <p>
            We will provide thirty (30) days&rsquo; advance notice of any material change to
            this Privacy Policy. Notice is delivered via:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Email to all account holders at the address on file.</li>
            <li>On-site banner on dunamisstudios.com for the duration of the notice period.</li>
          </ul>
          <p className="mt-4">
            Non-material changes (typos, clarifications that do not change practices) are
            tracked in the version history but do not trigger the notification process.
          </p>
        </>
      ),
    },
  ],
};
