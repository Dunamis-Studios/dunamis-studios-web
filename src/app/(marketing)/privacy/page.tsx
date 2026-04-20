import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Container, Section, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Dunamis Studios collects, uses, and protects personal data across our website, account system, and the Debrief HubSpot app.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "April 20, 2026";
const VERSION = "1.0";

interface Sec {
  n: string;
  id: string;
  title: string;
  body: ReactNode;
}

const SECTIONS: Sec[] = [
  {
    n: "1",
    id: "tldr",
    title: "TL;DR",
    body: (
      <>
        <p>
          Debrief reads the HubSpot CRM data your admin authorizes and sends it to
          Anthropic's Claude API over an encrypted connection to generate short
          handoff briefs. Your data is{" "}
          <strong>not used to train any AI model</strong> and is deleted from
          Anthropic within <strong>seven (7) days</strong>. We do not sell personal
          data, and we do not share it with advertising networks. The rest of this
          page explains exactly what we collect, why, for how long, and what rights
          you have.
        </p>
      </>
    ),
  },
  {
    n: "2",
    id: "scope",
    title: "Scope — who this policy applies to, and who is controller",
    body: (
      <>
        <div className="rounded-lg border border-[var(--fg-subtle)]/30 bg-[color-mix(in_oklch,var(--fg)_4%,transparent)] px-4 py-4 text-sm">
          <p className="font-medium">Important: two different roles.</p>
          <p className="mt-2">
            Dunamis Studios plays two different legal roles depending on which
            data is in question, and this policy is structured around that
            split.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>
              For <strong>Customer CRM Data</strong> — the contacts, companies,
              deals, tickets, and engagements that the Debrief HubSpot app reads
              from your HubSpot portal — <strong>your organization (the HubSpot
              admin) is the controller</strong> under GDPR and the
              “business” under CCPA/CPRA. Dunamis Studios is a{" "}
              <strong>processor</strong> (GDPR) / <strong>service
              provider</strong> (CCPA). If you are a data subject whose personal
              data sits in a Debrief customer's HubSpot portal, your rights
              requests should go to that customer; we will support them under
              our Data Processing Addendum.
            </li>
            <li>
              For data we collect directly — website visitors, trial signups,
              Dunamis account holders, billing contacts, support correspondents
              — <strong>Dunamis Studios is the controller</strong> under GDPR
              and the “business” under CCPA/CPRA. This policy
              governs that data.
            </li>
          </ul>
        </div>
        <p className="mt-4">
          References in this policy to “Dunamis Studios,”
          “Dunamis,” “we,” “us,” or
          “our” mean <strong>Joshua Robert Bradford</strong>, an
          individual resident of the State of Florida, United States, doing
          business under the name Dunamis Studios. See{" "}
          <a href="#contact" className="underline">
            §14 Contact
          </a>{" "}
          for postal address.
        </p>
      </>
    ),
  },
  {
    n: "3",
    id: "data-we-collect",
    title: "The three categories of data we touch",
    body: (
      <>
        <p>
          The table below lists every category of personal data Dunamis Studios
          collects, the source, the purpose, how long we keep it, and the
          relevant legal basis under GDPR. If a field is not in this table, we
          do not collect it.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--fg-subtle)]/40 text-left">
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="py-2 pr-4 font-medium">What's in it</th>
                <th className="py-2 pr-4 font-medium">Source</th>
                <th className="py-2 pr-4 font-medium">Purpose</th>
                <th className="py-2 pr-4 font-medium">Retention</th>
                <th className="py-2 font-medium">Legal basis (GDPR)</th>
              </tr>
            </thead>
            <tbody className="[&_td]:py-3 [&_td]:pr-4 [&_td]:align-top [&_tr]:border-b [&_tr]:border-[var(--fg-subtle)]/20">
              <tr>
                <td className="font-medium">Customer CRM Data</td>
                <td>
                  HubSpot records retrieved via OAuth: contact and company
                  names, emails, job titles; deal and ticket fields; engagement
                  content (emails, notes, call summaries) as authorized by
                  scopes
                </td>
                <td>Customer's HubSpot portal (OAuth)</td>
                <td>Generate handoff briefs on demand</td>
                <td>
                  In transit only for each request; cached briefly in Upstash
                  for the active session; deleted from our stack within 30 days
                  of subscription termination. Anthropic retains inputs/outputs
                  up to 7 days (see §5).
                </td>
                <td>
                  Processor — controller's basis governs (typically Art.
                  6(1)(b) / 6(1)(f))
                </td>
              </tr>
              <tr>
                <td className="font-medium">Account Data</td>
                <td>
                  Account holder name, email, hashed password or OAuth
                  identifier, entitlement state, subscription status, billing
                  contact, support correspondence
                </td>
                <td>You, directly (signup, checkout, support)</td>
                <td>
                  Operate the account, authenticate sessions, process billing,
                  provide support
                </td>
                <td>
                  Duration of the account + 90 days post-close; billing records
                  7 years (US tax); support tickets 2–3 years
                </td>
                <td>
                  <em>Art. 6(1)(b)</em> Contract; <em>Art. 6(1)(f)</em>{" "}
                  Legitimate interests (security); <em>Art. 6(1)(c)</em> Legal
                  obligation (tax)
                </td>
              </tr>
              <tr>
                <td className="font-medium">Visitor / Marketing Data</td>
                <td>
                  Page-view events from dunamisstudios.net, approximate country,
                  browser type; signup-form entries; emails you send us
                </td>
                <td>You, directly (browsing, forms)</td>
                <td>
                  Operate the site, measure aggregate traffic, respond to
                  inbound inquiries
                </td>
                <td>
                  Analytics events 13 months; form submissions 2 years from
                  last interaction
                </td>
                <td>
                  <em>Art. 6(1)(f)</em> Legitimate interests (site operation);{" "}
                  <em>Art. 6(1)(a)</em> Consent (marketing emails, EU cookies)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    n: "4",
    id: "legal-bases",
    title: "Legal bases for processing (GDPR / UK GDPR)",
    body: (
      <>
        <p>
          Where GDPR or UK GDPR applies, the legal basis for each processing
          purpose is annotated inline in italics below.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            Providing the Debrief app to paying customers and our website to
            visitors. <em>Art. 6(1)(b) Performance of a contract.</em>
          </li>
          <li>
            Keeping the service secure, detecting abuse, maintaining server
            logs, and improving the product. <em>Art. 6(1)(f) Legitimate
            interests</em> — our interest in operating a secure, reliable
            service, balanced against reasonable expectations of users.
          </li>
          <li>
            Sending transactional emails (verification, receipts, service
            notices). <em>Art. 6(1)(b) Contract.</em>
          </li>
          <li>
            Sending marketing emails where you have opted in, and setting
            non-essential cookies where required. <em>Art. 6(1)(a)
            Consent</em> — you can withdraw at any time without affecting
            processing that already happened.
          </li>
          <li>
            Complying with tax, accounting, and legal requests. <em>Art. 6(1)(c)
            Legal obligation.</em>
          </li>
          <li>
            Responding to support inquiries you send us. <em>Art. 6(1)(f)
            Legitimate interests</em> — our interest in helping you and
            yours.
          </li>
        </ul>
        <p className="mt-3">
          Where we rely on legitimate interests, you have the right to object
          (see <a href="#rights" className="underline">§9</a>).
        </p>
      </>
    ),
  },
  {
    n: "5",
    id: "ai",
    title: "How Debrief uses AI",
    body: (
      <>
        <p>
          Debrief uses artificial intelligence to generate handoff briefs — short
          written summaries of CRM records that help your team prepare for
          internal handoffs and customer meetings.
        </p>
        <p className="mt-3">
          <strong>What data is sent to AI.</strong> When you or your teammate
          requests a brief, Debrief retrieves the relevant contact, company,
          deal, and engagement records from your HubSpot portal under the OAuth
          authorization you granted, and transmits them to Anthropic's
          Claude API over an encrypted TLS 1.2+ connection.
        </p>
        <p className="mt-3">
          <strong>Who generates the brief.</strong> Briefs are generated by
          Anthropic PBC's Claude large language model, accessed via the
          Anthropic API. Anthropic is our sub-processor under a written Data
          Processing Addendum incorporating the EU Standard Contractual Clauses
          (Modules 2 and 3), the UK International Data Transfer Addendum, and
          the Swiss Addendum.
        </p>
        <p className="mt-3">
          <strong>What Anthropic does not do.</strong> Under Anthropic's
          Commercial Terms of Service, <strong>Anthropic does not use API data
          to train its models.</strong> Anthropic retains API inputs and outputs
          for up to seven (7) days for abuse monitoring, after which they are
          deleted. Flagged content may be retained longer solely for Trust
          & Safety purposes. See Anthropic's documentation at{" "}
          <a
            href="https://privacy.claude.com"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            privacy.claude.com
          </a>
          .
        </p>
        <p className="mt-3">
          <strong>No automated decisions with legal effect.</strong> Briefs are
          informational summaries intended to help a human on your team prepare
          for a conversation. Debrief does not perform automated decision-making
          with legal or similarly significant effects within the meaning of
          Article 22 of the GDPR or Article 12.1 of Quebec's Law 25, and
          is not a “high-risk” AI system under the EU AI Act.
        </p>
        <p className="mt-3">
          <strong>AI labeling and accuracy.</strong> Every brief is clearly
          labeled as AI-generated in the Debrief interface. Large language
          models can produce inaccurate, incomplete, or fabricated information.
          You are responsible for reviewing and verifying each brief before
          acting on it.
        </p>
        <p className="mt-3">
          <strong>Your controls.</strong> You can disable the AI feature in
          workspace settings, delete any generated brief at any time, and
          qualifying customers may request a zero-retention arrangement with
          Anthropic. We do not train AI or machine-learning models on your
          Customer Data for any purpose other than generating briefs for your
          own account.
        </p>
      </>
    ),
  },
  {
    n: "6",
    id: "subprocessors",
    title: "Sub-processors",
    body: (
      <>
        <p>
          Dunamis Studios relies on a short list of sub-processors to operate
          Debrief and the dunamisstudios.net website. The live list — including
          legal name, purpose, processing location, and transfer mechanism — is
          published at{" "}
          <Link href="/legal/subprocessors" className="underline">
            /legal/subprocessors
          </Link>
          .
        </p>
        <p className="mt-3">
          We commit to <strong>thirty (30) days' advance notice</strong>{" "}
          of any new sub-processor that will process Customer Personal Data.
          Customers may object on reasonable data-protection grounds; if the
          objection cannot be resolved, termination of the affected
          subscription is the remedy.
        </p>
        <p className="mt-3">
          Honest asymmetry to disclose: Anthropic, our AI sub-processor,
          commits to only <strong>fifteen (15) days' notice</strong> of
          changes to its own sub-processors upstream of us. We pass those
          changes through to customers as soon as practicable, which may be
          shorter than our 30-day commitment if Anthropic notifies us late.
        </p>
      </>
    ),
  },
  {
    n: "7",
    id: "international-transfers",
    title: "International transfers",
    body: (
      <>
        <p>
          Dunamis Studios is based in the United States, and most of our
          sub-processors operate primarily in the United States. If you are in
          the European Economic Area, the United Kingdom, or Switzerland,
          personal data we process about you will be transferred to, and
          processed in, the United States.
        </p>
        <p className="mt-3">
          We rely on the following transfer mechanisms:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>EU–US Data Privacy Framework</strong>, with the UK
            Extension and Swiss–US DPF where applicable, for sub-processors
            that are DPF-certified: Vercel, Upstash, Stripe, Resend, and
            HubSpot. The DPF remains valid following the CJEU's
            September 2025 Latombe ruling.
          </li>
          <li>
            <strong>EU Standard Contractual Clauses</strong> (Commission
            Implementing Decision 2021/914), Modules 2 (Controller-to-Processor)
            and 3 (Processor-to-Processor), plus the{" "}
            <strong>UK International Data Transfer Addendum</strong> and the{" "}
            <strong>Swiss Addendum</strong>, for Anthropic (not DPF-certified)
            and as a fallback mechanism for all other sub-processors.
          </li>
        </ul>
        <p className="mt-3">
          Supplementary measures consistent with EDPB recommendations: TLS 1.2
          or later in transit, AES-256 at rest, data minimization, role-based
          access controls, and a documented transfer impact assessment refreshed
          annually. Copies of the SCCs are available on request at{" "}
          <a href="mailto:privacy@dunamisstudios.net" className="underline">
            privacy@dunamisstudios.net
          </a>
          .
        </p>
      </>
    ),
  },
  {
    n: "8",
    id: "retention",
    title: "Data retention",
    body: (
      <>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--fg-subtle)]/40 text-left">
                <th className="py-2 pr-4 font-medium">Data type</th>
                <th className="py-2 font-medium">How long we keep it</th>
              </tr>
            </thead>
            <tbody className="[&_td]:py-3 [&_td]:pr-4 [&_td]:align-top [&_tr]:border-b [&_tr]:border-[var(--fg-subtle)]/20">
              <tr>
                <td>Customer CRM Data in transit to Anthropic</td>
                <td>
                  Not stored in Dunamis Studios systems after the API response
                  is returned. Anthropic retains inputs and outputs for up to
                  7 days for abuse monitoring per their Commercial Terms, with
                  longer retention only for content flagged under Trust &
                  Safety.
                </td>
              </tr>
              <tr>
                <td>Customer CRM Data cached in Upstash (brief metadata, session state)</td>
                <td>Duration of active subscription + 30 days post-termination</td>
              </tr>
              <tr>
                <td>Account Data (profile, entitlements)</td>
                <td>Duration of account + 90 days</td>
              </tr>
              <tr>
                <td>Billing records and invoices</td>
                <td>7 years (US tax obligation)</td>
              </tr>
              <tr>
                <td>Server logs (application, audit, security)</td>
                <td>30 days rolling</td>
              </tr>
              <tr>
                <td>Support tickets and correspondence</td>
                <td>2–3 years from last interaction</td>
              </tr>
              <tr>
                <td>Marketing contact records</td>
                <td>2 years from last interaction, or until you unsubscribe</td>
              </tr>
              <tr>
                <td>Website analytics events</td>
                <td>13 months</td>
              </tr>
              <tr>
                <td>Backups of the above</td>
                <td>
                  Rolling 30–90 days depending on system; deleted on natural
                  cycle after primary deletion
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    n: "9",
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>
          <strong>United States (19 state comprehensive privacy laws).</strong>{" "}
          If you reside in California, Colorado, Connecticut, Delaware,
          Florida, Indiana, Iowa, Kentucky, Maryland, Minnesota, Montana,
          Nebraska, New Hampshire, New Jersey, Oregon, Rhode Island, Tennessee,
          Texas, Utah, or Virginia (and other states as new laws come into
          force), you have the rights your state grants, which generally
          include: access, deletion, correction, portability; opt-out of
          sale/sharing/targeted advertising/profiling; limit use of sensitive
          personal information; non-discrimination for exercising rights; and
          where adopted (including California under 2026 regulations), opt-out
          of automated decision-making. We honor Global Privacy Control (GPC)
          signals. <strong>We do not sell or share your personal information,
          and we do not use it for cross-context behavioral advertising.</strong>
        </p>
        <p className="mt-3">
          <strong>European Economic Area / United Kingdom (GDPR / UK
          GDPR).</strong> You have the rights under Articles 15–22: access,
          rectification, erasure, restriction, portability, objection, and not
          to be subject to solely automated decision-making with legal or
          similarly significant effects. For Customer CRM Data, direct these
          requests to the Debrief customer whose portal contains the data (the
          controller); we will assist them. For data we collect directly as
          controller, contact us at{" "}
          <a href="mailto:privacy@dunamisstudios.net" className="underline">
            privacy@dunamisstudios.net
          </a>
          . You may also lodge a complaint with your supervisory authority.
        </p>
        <p className="mt-3">
          <strong>Quebec (Law 25).</strong> We disclose that automated
          decision-making within the meaning of Article 12.1 is not used in the
          Debrief service. You may request information about cross-border
          transfers (see <a href="#international-transfers" className="underline">§7</a>).
        </p>
        <p className="mt-3">
          <strong>Australia (Privacy Act / APPs).</strong> Australian residents
          may request access and correction under APPs 12 and 13 via the same
          privacy email. Cross-border disclosures to the US are covered by
          APP 8 reasonable steps described in <a href="#security" className="underline">§10</a>.
        </p>
        <p className="mt-3">
          <strong>Brazil (LGPD).</strong> Brazilian data subjects may exercise
          rights under LGPD Articles 18 and 19 via the same channel.
        </p>
        <p className="mt-3">
          <strong>How to exercise rights.</strong> Email{" "}
          <a href="mailto:privacy@dunamisstudios.net" className="underline">
            privacy@dunamisstudios.net
          </a>{" "}
          with enough detail to identify you and the request. We will
          acknowledge within 10 business days and respond substantively within
          30 days (or the shorter period required by your jurisdiction,
          including 45 days under CCPA/CPRA with a 45-day extension available
          and 30 days under GDPR). We will verify your identity before
          disclosing or deleting data. You can also designate an authorized
          agent in jurisdictions that recognize one.
        </p>
      </>
    ),
  },
  {
    n: "10",
    id: "security",
    title: "Security",
    body: (
      <>
        <p>
          We apply technical and organizational measures appropriate to the
          risks of processing, including: TLS 1.2+ encryption in transit;
          AES-256 encryption at rest; encrypted OAuth tokens with per-portal
          isolation; role-based access controls with principle of least
          privilege; secrets management; audit logging; dependency vulnerability
          monitoring; and a documented incident-response procedure.
        </p>
        <p className="mt-3">
          No system is perfectly secure. If a personal-data breach affects your
          data, we will notify affected controllers without undue delay and no
          later than is consistent with our obligations under GDPR Article
          33(2) and applicable US state breach-notification laws. For Customer
          CRM Data, the customer whose portal is affected will be notified
          first so that the customer, as the controller, can notify its own
          data subjects on the required timeline.
        </p>
      </>
    ),
  },
  {
    n: "11",
    id: "cookies",
    title: "Cookies, analytics, and in-app tracking",
    body: (
      <>
        <p>
          <strong>dunamisstudios.net.</strong> The marketing website uses
          Vercel Analytics, which is cookieless by default but still receives
          minimal request metadata (IP, user agent, referrer) to count
          aggregate traffic. We do not set advertising cookies and do not share
          site data with ad networks. Visitors from the EU, UK, or
          Switzerland are shown a consent banner for any non-essential
          cookies; essential cookies used to operate the site (session,
          CSRF) are deployed without consent under the strictly-necessary
          exemption.
        </p>
        <p className="mt-3">
          <strong>Debrief in-HubSpot iframe.</strong> The Debrief UI runs as a
          HubSpot CRM card inside your HubSpot portal and does not set its
          own cookies. Any cookies present in that frame are HubSpot's.
        </p>
      </>
    ),
  },
  {
    n: "12",
    id: "children",
    title: "Children's data",
    body: (
      <>
        <p>
          Debrief is a B2B product directed at business users. It is not
          directed at children under 16, and we do not knowingly collect
          personal data from children. Customers must not submit personal data
          of children to the service (see our{" "}
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>
          ). If you believe a child's personal data has been submitted to
          us in error, contact{" "}
          <a href="mailto:privacy@dunamisstudios.net" className="underline">
            privacy@dunamisstudios.net
          </a>{" "}
          and we will delete it.
        </p>
      </>
    ),
  },
  {
    n: "13",
    id: "changes",
    title: "Changes to this policy",
    body: (
      <>
        <p>
          We may update this Privacy Policy as our practices change or as law
          requires. For material changes, we will email the administrative
          contact on each active account at least <strong>thirty (30) days</strong>{" "}
          before the change takes effect. The effective date at the top of this
          page reflects the current version, and prior versions are available
          on request.
        </p>
      </>
    ),
  },
  {
    n: "14",
    id: "contact",
    title: "Contact",
    body: (
      <>
        <p>
          Privacy inquiries, rights requests, and subpoenas:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            Email:{" "}
            <a href="mailto:privacy@dunamisstudios.net" className="underline">
              privacy@dunamisstudios.net
            </a>
          </li>
          <li>
            Postal address: Joshua Robert Bradford d/b/a Dunamis Studios, 2269
            Twin Fox Trail, St. Augustine, FL 32086, United States.
          </li>
        </ul>
        <p className="mt-3">
          For support or product questions unrelated to privacy, use{" "}
          <a href="mailto:support@dunamisstudios.net" className="underline">
            support@dunamisstudios.net
          </a>
          .
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <Section>
      <Container size="md">
        <PageHeader
          eyebrow="Legal"
          title="Privacy Policy"
          description={`Last updated ${LAST_UPDATED} · Version ${VERSION}`}
        />

        <nav
          aria-label="On this page"
          className="mt-8 rounded-lg border border-[var(--fg-subtle)]/30 bg-[color-mix(in_oklch,var(--fg)_3%,transparent)] px-4 py-4 text-sm"
        >
          <p className="font-medium">On this page</p>
          <ol className="mt-2 grid list-none gap-1 sm:grid-cols-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-[var(--fg-muted)] underline-offset-2 hover:underline"
                >
                  <span className="font-mono text-xs text-[var(--fg-subtle)]">
                    §{s.n}
                  </span>{" "}
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12 space-y-12">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-[var(--fg-subtle)]">
                  §{s.n}
                </span>
                <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight">
                  {s.title}
                </h2>
              </div>
              <div className="mt-3 space-y-3 text-[var(--fg-muted)] leading-relaxed">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </Section>
  );
}
