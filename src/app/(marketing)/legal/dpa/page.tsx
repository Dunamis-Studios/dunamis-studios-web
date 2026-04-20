import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Container, Section, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Data Processing Addendum",
  description:
    "Dunamis Studios Data Processing Addendum (DPA) for processing of personal data on behalf of customers, incorporating the EU Standard Contractual Clauses, UK IDTA, and Swiss Addendum.",
  alternates: { canonical: "/legal/dpa" },
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
    n: "0",
    id: "preamble",
    title: "Preamble",
    body: (
      <>
        <p>
          This Data Processing Addendum (the “<strong>DPA</strong>”)
          forms part of the agreement between the customer (“
          <strong>Customer</strong>” or “<strong>Controller</strong>
          ”) and <strong>Joshua Robert Bradford</strong>, an individual
          resident of the State of Florida, United States, doing business
          under the name <strong>Dunamis Studios</strong> (“
          <strong>Dunamis Studios</strong>,” “<strong>Company</strong>
          ,” or “<strong>Processor</strong>”) for
          Customer’s use of the Debrief HubSpot application and related
          services (the “<strong>Service</strong>”) under the
          Dunamis Studios{" "}
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>{" "}
          (the “<strong>Master Agreement</strong>”). Capitalized
          terms not defined here have the meanings given in the Master
          Agreement.
        </p>
        <p className="mt-3">
          This DPA applies to Dunamis Studios’s processing of Personal
          Data on behalf of Customer in connection with the Service. It
          supplements, does not replace, any consent-based data-collection
          terms in the{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          . Where Dunamis Studios processes personal data for its own
          purposes as controller (account administration, billing, security,
          website analytics), the Privacy Policy governs instead.
        </p>
        <p className="mt-3">
          By executing the Master Agreement or otherwise accepting the
          Dunamis Studios Terms of Service, Customer enters into and agrees
          to this DPA as of the Effective Date of the Master Agreement.
        </p>
      </>
    ),
  },
  {
    n: "1",
    id: "definitions",
    title: "Definitions",
    body: (
      <>
        <p>
          Terms used in this DPA have the meanings given below. Where a term
          is defined in the GDPR or UK GDPR and not below, the statutory
          definition applies.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            “<strong>Data Protection Laws</strong>” means all
            laws applicable to the processing of Personal Data under this
            DPA, including the EU General Data Protection Regulation
            (Regulation 2016/679) (“<strong>GDPR</strong>”), the
            UK Data Protection Act 2018 and UK GDPR, the Swiss Federal Act
            on Data Protection (“<strong>FADP</strong>”), the
            California Consumer Privacy Act as amended by the California
            Privacy Rights Act (“<strong>CCPA</strong>”), and
            other comparable state, federal, or national privacy laws.
          </li>
          <li>
            “<strong>Personal Data</strong>” has the meaning
            given in GDPR Article 4(1): any information relating to an
            identified or identifiable natural person. Under CCPA, this
            term is interchangeable with “personal information.”
          </li>
          <li>
            “<strong>Customer Personal Data</strong>” means
            Personal Data that Dunamis Studios processes on Customer’s
            behalf in providing the Service, including HubSpot Data
            transmitted under the OAuth authorization Customer grants at
            install and any Personal Data embedded in Briefs.
          </li>
          <li>
            “<strong>Processing</strong>,” “
            <strong>Controller</strong>,” “<strong>Processor</strong>
            ,” “<strong>Data Subject</strong>,” and “
            <strong>Supervisory Authority</strong>” have the meanings
            given in GDPR Article 4 and UK GDPR Article 4.
          </li>
          <li>
            “<strong>Sub-processor</strong>” means any third
            party engaged by Dunamis Studios to process Customer Personal
            Data, as listed at{" "}
            <Link href="/legal/subprocessors" className="underline">
              /legal/subprocessors
            </Link>
            .
          </li>
          <li>
            “<strong>SCCs</strong>” means the Standard
            Contractual Clauses approved by the European Commission in
            Implementing Decision (EU) 2021/914, as amended from time to
            time.
          </li>
          <li>
            “<strong>UK IDTA</strong>” means the International
            Data Transfer Addendum to the SCCs issued by the UK Information
            Commissioner’s Office, version B1.0 or any successor.
          </li>
          <li>
            “<strong>Swiss Addendum</strong>” means an addendum
            to the SCCs amending them to cover transfers subject to Swiss
            FADP, consistent with guidance from the Swiss Federal Data
            Protection and Information Commissioner.
          </li>
          <li>
            “<strong>DPF</strong>” means the EU–US Data Privacy
            Framework, including the UK Extension and the Swiss–US Data
            Privacy Framework.
          </li>
          <li>
            “<strong>Personal Data Breach</strong>” has the
            meaning given in GDPR Article 4(12): a breach of security
            leading to the accidental or unlawful destruction, loss,
            alteration, unauthorized disclosure of, or access to, Personal
            Data transmitted, stored, or otherwise processed.
          </li>
        </ul>
      </>
    ),
  },
  {
    n: "2",
    id: "processing-details",
    title: "Processing details and roles",
    body: (
      <>
        <p>
          As between the parties, <strong>Customer is the Controller</strong>{" "}
          (or Business under CCPA) of Customer Personal Data, and{" "}
          <strong>Dunamis Studios is the Processor</strong> (or Service
          Provider under CCPA) acting on Customer’s documented
          instructions.
        </p>
        <p className="mt-3">
          The subject matter, duration, nature, purpose, types of Personal
          Data, and categories of Data Subjects are described in{" "}
          <a href="#annex-2" className="underline">
            Annex 2
          </a>
          .
        </p>
      </>
    ),
  },
  {
    n: "3",
    id: "obligations",
    title: "Processor obligations (GDPR Article 28)",
    body: (
      <>
        <p>
          Dunamis Studios will, in connection with Customer Personal Data:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>Documented instructions.</strong> Process Customer
            Personal Data only on Customer’s documented instructions,
            including with regard to international transfers, unless
            required to process for another purpose by Union or Member State
            law to which Dunamis Studios is subject, in which case Dunamis
            Studios will inform Customer of that legal requirement before
            processing, unless that law prohibits the notice on important
            grounds of public interest. Customer’s instructions are
            set out in the Master Agreement, this DPA, the Documentation,
            and any subsequent written instructions Customer sends through
            its configured channels.
          </li>
          <li>
            <strong>Confidentiality of personnel.</strong> Ensure that
            personnel authorized to process Customer Personal Data are
            bound by confidentiality obligations or statutory duties of
            confidentiality.
          </li>
          <li>
            <strong>Security measures.</strong> Implement and maintain
            appropriate technical and organizational measures to protect
            Customer Personal Data, including those described in{" "}
            <a href="#annex-3" className="underline">
              Annex 3
            </a>
            , taking into account the state of the art, the cost of
            implementation, and the nature, scope, context, and purposes
            of processing as well as the risk to Data Subjects.
          </li>
          <li>
            <strong>Data Subject requests.</strong> Taking into account the
            nature of the processing, assist Customer by appropriate
            technical and organizational measures, insofar as possible,
            for the fulfilment of Customer’s obligation to respond to
            requests from Data Subjects to exercise rights under Chapter
            III of the GDPR (see <a href="#dsar" className="underline">§8</a>).
          </li>
          <li>
            <strong>Breach notification.</strong> Notify Customer of a
            Personal Data Breach affecting Customer Personal Data within
            48 hours of Dunamis Studios confirming the breach (see{" "}
            <a href="#breach" className="underline">§9</a>).
          </li>
          <li>
            <strong>DPIA assistance.</strong> Assist Customer in ensuring
            compliance with obligations under GDPR Articles 32 to 36,
            taking into account the nature of processing and the
            information available to Dunamis Studios.
          </li>
          <li>
            <strong>Return or deletion.</strong> At Customer’s choice,
            delete or return all Customer Personal Data after the end of
            the provision of services relating to processing, and delete
            existing copies unless Union or Member State law requires
            storage (see{" "}
            <a href="#return" className="underline">§11</a>).
          </li>
          <li>
            <strong>Audit support.</strong> Make available to Customer all
            information necessary to demonstrate compliance with Article 28
            and allow for and contribute to audits conducted by Customer or
            another auditor mandated by Customer (see{" "}
            <a href="#audit" className="underline">§10</a>).
          </li>
          <li>
            <strong>Instructions that infringe.</strong> Immediately inform
            Customer if, in Dunamis Studios’s opinion, an instruction
            from Customer infringes the GDPR or other Data Protection Law.
          </li>
        </ul>
      </>
    ),
  },
  {
    n: "4",
    id: "subprocessors",
    title: "Sub-processors",
    body: (
      <>
        <p>
          <strong>General written authorization.</strong> Customer grants
          Dunamis Studios general written authorization to engage
          Sub-processors, subject to this Section. Dunamis Studios’s
          current Sub-processors are listed at{" "}
          <Link href="/legal/subprocessors" className="underline">
            /legal/subprocessors
          </Link>
          , which is incorporated by reference.
        </p>
        <p className="mt-3">
          <strong>Notice of new Sub-processors.</strong> Dunamis Studios
          will provide Customer with at least thirty (30) days’ prior
          written notice (which may be by email to the administrative
          contact or by updating the Sub-processors page with an email-list
          notification) of any intended addition or replacement of a
          Sub-processor that will process Customer Personal Data.
        </p>
        <p className="mt-3">
          <strong>Upstream asymmetry.</strong> Anthropic, the upstream LLM
          provider, commits to only fifteen (15) days’ notice of its
          own sub-processor changes. Where Dunamis Studios receives shorter
          upstream notice, Dunamis Studios will pass through the change as
          soon as practicable, which may mean less than 30 days’ notice
          to Customer. This is a known asymmetry, not a breach of this
          DPA.
        </p>
        <p className="mt-3">
          <strong>Right to object.</strong> Within the notice period,
          Customer may object to a proposed new Sub-processor on reasonable
          data-protection grounds by written notice to{" "}
          <a href="mailto:legal@dunamisstudios.net" className="underline">
            legal@dunamisstudios.net
          </a>
          . The parties will discuss the objection in good faith. If the
          parties cannot resolve it, Customer’s sole remedy is to
          terminate the affected subscription under the Master Agreement,
          with a pro-rata refund of unused prepaid fees.
        </p>
        <p className="mt-3">
          <strong>Flow-down.</strong> Dunamis Studios will impose on each
          Sub-processor, by written contract, data-protection obligations
          that are substantially the same as those imposed on Dunamis
          Studios under this DPA and that meet the requirements of GDPR
          Article 28(4). Dunamis Studios remains fully liable to Customer
          for each Sub-processor’s performance of its data-protection
          obligations.
        </p>
      </>
    ),
  },
  {
    n: "5",
    id: "transfers",
    title: "International transfers",
    body: (
      <>
        <p>
          Where Customer Personal Data is transferred from the EEA, UK,
          or Switzerland to a country that does not benefit from an
          adequacy decision, the parties rely on the following, in order of
          applicability:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>DPF.</strong> For Sub-processors certified under the
            EU–US DPF, the UK Extension, and the Swiss–US DPF (Vercel,
            Upstash, Stripe, Resend, HubSpot), transfers are made under
            the applicable DPF certifications.
          </li>
          <li>
            <strong>EU SCCs (Implementing Decision 2021/914).</strong> For
            Sub-processors that are not DPF-certified (notably Anthropic)
            and as a fallback mechanism for any DPF transfer that
            subsequently becomes unavailable, the parties incorporate the
            SCCs, <strong>Module 2 (Controller-to-Processor)</strong> where
            Customer is a Controller and Dunamis Studios is a Processor,
            and <strong>Module 3 (Processor-to-Processor)</strong> where
            Customer acts as a Processor on behalf of its own controllers,
            as follows:
            <ul className="mt-2 list-[circle] space-y-1 pl-5">
              <li>
                Clause 7 (docking clause): applies.
              </li>
              <li>
                Clause 9(a) (sub-processing): Option 2 applies, general
                written authorization with the notice period in{" "}
                <a href="#subprocessors" className="underline">§4</a>.
              </li>
              <li>
                Clause 11 (redress): the optional language is not
                included.
              </li>
              <li>
                Clause 17 (governing law): the laws of Ireland apply.
              </li>
              <li>
                Clause 18 (choice of forum and jurisdiction): the courts
                of Ireland have jurisdiction.
              </li>
              <li>
                Annex I.A (List of Parties) is populated by{" "}
                <a href="#annex-1" className="underline">
                  Annex 1
                </a>
                ; Annex I.B (Description of Transfer) is populated by{" "}
                <a href="#annex-2" className="underline">
                  Annex 2
                </a>
                ; Annex I.C (Competent Supervisory Authority) is the
                Irish Data Protection Commission unless another is
                specifically designated; Annex II (Technical and
                Organizational Measures) is populated by{" "}
                <a href="#annex-3" className="underline">
                  Annex 3
                </a>
                ; Annex III (Sub-processors) is populated by the list at{" "}
                <Link href="/legal/subprocessors" className="underline">
                  /legal/subprocessors
                </Link>
                .
              </li>
            </ul>
          </li>
          <li>
            <strong>UK IDTA.</strong> Transfers subject to UK GDPR are
            governed by the UK International Data Transfer Addendum to the
            SCCs, incorporated by reference and populated consistent with
            the Annexes to this DPA.
          </li>
          <li>
            <strong>Swiss Addendum.</strong> Transfers subject to the Swiss
            FADP are governed by the SCCs as amended by the Swiss Addendum,
            with references to EEA Supervisory Authorities read as the
            Swiss Federal Data Protection and Information Commissioner
            where appropriate.
          </li>
        </ul>
        <p className="mt-3">
          <strong>Supplementary measures.</strong> Consistent with
          EDPB Recommendations 01/2020, Dunamis Studios implements the
          supplementary measures described in{" "}
          <a href="#annex-3" className="underline">Annex 3</a>, including
          TLS 1.2+ encryption in transit, AES-256 encryption at rest, data
          minimization, role-based access controls, and a documented
          transfer impact assessment refreshed annually.
        </p>
        <p className="mt-3">
          <strong>Order of precedence.</strong> To the extent of conflict
          between the SCCs and any other provision of this DPA or the
          Master Agreement, the SCCs prevail.
        </p>
      </>
    ),
  },
  {
    n: "6",
    id: "security",
    title: "Security measures",
    body: (
      <>
        <p>
          Dunamis Studios implements and maintains technical and
          organizational measures appropriate to the risks of processing
          Customer Personal Data, as described in{" "}
          <a href="#annex-3" className="underline">
            Annex 3
          </a>
          . Dunamis Studios reviews those measures periodically and may
          update them, provided the overall level of security is not
          materially diminished.
        </p>
      </>
    ),
  },
  {
    n: "7",
    id: "confidentiality",
    title: "Confidentiality of personnel",
    body: (
      <>
        <p>
          Dunamis Studios restricts access to Customer Personal Data to
          personnel and approved contractors who need access to perform
          their duties, and binds them to written confidentiality
          obligations or appropriate statutory duties of confidentiality.
        </p>
      </>
    ),
  },
  {
    n: "8",
    id: "dsar",
    title: "Data Subject rights assistance",
    body: (
      <>
        <p>
          Dunamis Studios will, taking into account the nature of the
          processing and insofar as technically and commercially reasonable,
          assist Customer in responding to Data Subject requests under
          GDPR Articles 15–22 (access, rectification, erasure, restriction,
          portability, objection, automated decision-making) and comparable
          rights under UK GDPR, Swiss FADP, CCPA, and other Data Protection
          Laws.
        </p>
        <p className="mt-3">
          Where a Data Subject contacts Dunamis Studios directly with a
          request about Customer Personal Data, Dunamis Studios will
          refer the request to Customer without disclosing Personal Data
          beyond what is necessary to identify the relevant customer,
          unless prohibited by law.
        </p>
        <p className="mt-3">
          Customer is responsible for verifying the identity of requestors
          and for the substantive response. Dunamis Studios will provide
          reasonable technical assistance (including export and deletion
          tooling available through the Service) without additional charge.
        </p>
      </>
    ),
  },
  {
    n: "9",
    id: "breach",
    title: "Personal Data Breach notification",
    body: (
      <>
        <p>
          Dunamis Studios will notify Customer of a Personal Data Breach
          affecting Customer Personal Data{" "}
          <strong>within 48 hours of Dunamis Studios confirming the
          breach</strong>.
        </p>
        <p className="mt-3">
          The notice will include, to the extent known at the time of
          notice and consistent with GDPR Article 33(3):
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            a description of the nature of the Personal Data Breach,
            including the categories and approximate number of Data
            Subjects concerned and the categories and approximate number
            of Personal Data records concerned;
          </li>
          <li>
            the name and contact details of the Dunamis Studios point of
            contact for further information;
          </li>
          <li>
            a description of the likely consequences of the Personal Data
            Breach; and
          </li>
          <li>
            a description of the measures taken or proposed to address the
            Personal Data Breach, including, where appropriate, measures
            to mitigate its possible adverse effects.
          </li>
        </ul>
        <p className="mt-3">
          Where the full information is not available at the time of initial
          notification, Dunamis Studios will provide updates as information
          becomes available, without undue further delay. Notification of a
          Personal Data Breach is not an acknowledgment by Dunamis Studios
          of fault or liability.
        </p>
      </>
    ),
  },
  {
    n: "10",
    id: "audit",
    title: "Audit rights",
    body: (
      <>
        <p>
          To enable Customer to verify compliance with this DPA, Dunamis
          Studios will, upon reasonable written request and no more than
          once per calendar year (or more frequently where required by a
          Supervisory Authority or after a confirmed Personal Data Breach
          materially affecting Customer’s data):
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            respond to a reasonable written questionnaire regarding its
            information security program and compliance with this DPA; and
          </li>
          <li>
            where the questionnaire does not reasonably resolve
            Customer’s compliance inquiries, permit, with at least
            thirty (30) days’ advance written notice and at mutually
            agreed times during normal business hours, an on-site audit
            conducted by Customer or by an independent third-party auditor
            (not a competitor of Dunamis Studios) bound by confidentiality
            obligations at least as protective as those in the Master
            Agreement. On-site audits are conducted at Customer’s
            expense.
          </li>
        </ul>
        <p className="mt-3">
          Audits must not unreasonably interfere with Dunamis Studios’s
          business, must respect the confidentiality of other
          customers’ data and Dunamis Studios’s own confidential
          information, and must not include access to premises, systems, or
          data of any Sub-processor (for which Dunamis Studios will request
          Sub-processor audit reports or other evidence on Customer’s
          behalf consistent with its Sub-processor contracts).
        </p>
      </>
    ),
  },
  {
    n: "11",
    id: "return",
    title: "Return or deletion on termination",
    body: (
      <>
        <p>
          On termination or expiration of the Master Agreement, or earlier
          on Customer’s written request:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            Customer has a thirty (30)-day export window (as described in
            Master Agreement §13) to retrieve its Briefs through the
            Service’s export tooling;
          </li>
          <li>
            Dunamis Studios will delete Customer Personal Data from active
            production systems within <strong>sixty (60) days</strong> of
            termination;
          </li>
          <li>
            Customer Personal Data residing in backups will be deleted on
            its natural backup-rotation cycle (generally within 30–90 days
            after deletion from primary systems); and
          </li>
          <li>
            on written request, Dunamis Studios will provide a written
            certification of deletion within a reasonable period after
            completion.
          </li>
        </ul>
        <p className="mt-3">
          Dunamis Studios may retain Customer Personal Data to the extent,
          and for as long as, required by applicable law, provided that
          Dunamis Studios will continue to protect that data in accordance
          with this DPA and will limit processing to the storage purpose.
        </p>
      </>
    ),
  },
  {
    n: "12",
    id: "liability",
    title: "Liability",
    body: (
      <>
        <p>
          Each party’s liability under this DPA is subject to the
          limitations and exclusions of liability set out in the Master
          Agreement. This DPA does not expand any party’s liability
          beyond those limitations. To the extent the SCCs require
          otherwise for a particular transfer, the SCCs prevail for that
          transfer only.
        </p>
      </>
    ),
  },
  {
    n: "13",
    id: "term",
    title: "Term",
    body: (
      <>
        <p>
          This DPA takes effect on the Effective Date of the Master
          Agreement and continues for so long as Dunamis Studios processes
          Customer Personal Data. Provisions that, by their nature, should
          survive termination (including return/deletion, confidentiality,
          and liability) survive.
        </p>
      </>
    ),
  },
  {
    n: "Annex 1",
    id: "annex-1",
    title: "Annex 1 — List of Parties",
    body: (
      <>
        <p>
          <strong>Data Exporter (Controller)</strong> — the customer
          identified on the account that accepted the Master Agreement and
          this DPA, including the account administrative contact, as
          recorded in Dunamis Studios’s account system.
        </p>
        <p className="mt-3">
          Activities relevant to the data transferred under this DPA:
          Customer uses the Service to generate AI-assisted handoff briefs
          from its HubSpot CRM data.
        </p>
        <p className="mt-3">
          Role: Controller (or, where Customer is itself a processor of its
          own controllers’ data, Processor).
        </p>
        <p className="mt-6">
          <strong>Data Importer (Processor)</strong>
        </p>
        <p className="mt-2">
          Joshua Robert Bradford, an individual resident of the State of
          Florida, United States, doing business under the name{" "}
          <strong>Dunamis Studios</strong>.
        </p>
        <address className="mt-2 not-italic">
          2269 Twin Fox Trail
          <br />
          St. Augustine, FL 32086
          <br />
          United States
        </address>
        <p className="mt-2">
          Contact for data-protection matters:{" "}
          <a href="mailto:legal@dunamisstudios.net" className="underline">
            legal@dunamisstudios.net
          </a>{" "}
          and{" "}
          <a href="mailto:privacy@dunamisstudios.net" className="underline">
            privacy@dunamisstudios.net
          </a>
          .
        </p>
        <p className="mt-3">
          Activities relevant to the data transferred: operating the
          Debrief HubSpot application, transmitting Customer Personal Data
          to Anthropic’s Claude API for brief generation, hosting the
          Service on Vercel, caching metadata on Upstash, processing
          billing via Stripe, and sending transactional email via Resend.
        </p>
        <p className="mt-3">
          Role: Processor (Service Provider under CCPA).
        </p>
      </>
    ),
  },
  {
    n: "Annex 2",
    id: "annex-2",
    title: "Annex 2 — Description of Processing",
    body: (
      <>
        <p>
          <strong>Subject matter.</strong> Generation of AI-assisted
          handoff briefs and related Service functions, as described in
          the Master Agreement and Documentation.
        </p>
        <p className="mt-3">
          <strong>Duration.</strong> For the duration of the Master
          Agreement plus the retention periods described in the Privacy
          Policy and in{" "}
          <a href="#return" className="underline">§11</a>.
        </p>
        <p className="mt-3">
          <strong>Nature and purpose.</strong> Read Customer’s HubSpot
          CRM records under OAuth authorization, transmit relevant records
          to Anthropic’s Claude API over encrypted connection, receive
          the generated Brief, store Brief metadata, and return the Brief
          to Customer within Customer’s HubSpot portal. Related
          processing includes account administration, authentication,
          billing, support, logging, and security monitoring.
        </p>
        <p className="mt-3">
          <strong>Types of Personal Data.</strong> HubSpot CRM record
          fields within the OAuth scopes Customer approved at install,
          which may include: names, business email addresses, job titles,
          phone numbers, company names and company metadata, deal and
          ticket content, engagement content (emails, notes, call
          summaries) as authorized; Dunamis Studios account holder
          identifiers (name, email, hashed password or OAuth identifier);
          billing contact information. Customer must not submit sensitive
          data categories as defined in Master Agreement §4.
        </p>
        <p className="mt-3">
          <strong>Categories of Data Subjects.</strong> Customer’s
          own customers, prospects, contacts, and business counterparties
          whose data is stored in Customer’s HubSpot portal;
          Customer’s authorized users of the Service; and
          Customer’s billing representatives.
        </p>
        <p className="mt-3">
          <strong>Frequency of transfer.</strong> Continuous, on demand as
          Customer’s users request Briefs.
        </p>
        <p className="mt-3">
          <strong>Retention.</strong> As described in the Privacy Policy and{" "}
          <a href="#return" className="underline">§11</a> of this DPA.
        </p>
        <p className="mt-3">
          <strong>Recipients.</strong> Dunamis Studios’s Sub-processors
          as listed at{" "}
          <Link href="/legal/subprocessors" className="underline">
            /legal/subprocessors
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    n: "Annex 3",
    id: "annex-3",
    title: "Annex 3 — Technical and Organizational Measures",
    body: (
      <>
        <p>
          Dunamis Studios maintains the following technical and
          organizational measures. The measures are updated as the Service
          evolves; the overall level of protection will not be materially
          diminished without Customer’s consent.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>Encryption in transit.</strong> TLS 1.2 or later for
            all connections to the Service, to Sub-processor APIs
            (Anthropic, Vercel, Upstash, Stripe, Resend, HubSpot), and to
            administrative consoles.
          </li>
          <li>
            <strong>Encryption at rest.</strong> AES-256 (or equivalent
            modern cipher) for Customer Personal Data cached or stored in
            Sub-processor systems (Upstash Redis, Vercel storage, Stripe).
          </li>
          <li>
            <strong>Access controls.</strong> Role-based access with
            principle of least privilege; multi-factor authentication on
            administrative accounts; secrets stored in a dedicated secrets
            manager and rotated on schedule or on suspected exposure.
          </li>
          <li>
            <strong>OAuth token handling.</strong> HubSpot OAuth tokens
            encrypted at rest, scoped per portal, never logged in
            plaintext, and invalidated on uninstall or revocation.
          </li>
          <li>
            <strong>Network and application security.</strong>{" "}
            Sub-processors selected for their security posture (DPF
            certification or SOC 2 Type II where available); HTTPS-only
            public endpoints; CSRF protections on state-changing requests;
            parameterized queries to prevent SQL injection; dependency
            vulnerability scanning; runtime error monitoring.
          </li>
          <li>
            <strong>Logging and monitoring.</strong> Audit and application
            logs retained for a rolling period (generally 30 days) with
            access restricted to authorized operators; alerting on
            anomalous access patterns and on upstream API failures.
          </li>
          <li>
            <strong>Incident response.</strong> Documented playbook for
            identifying, containing, eradicating, and recovering from
            security incidents; post-incident review with remediation
            tracking; breach-notification paths aligned with{" "}
            <a href="#breach" className="underline">§9</a>.
          </li>
          <li>
            <strong>Personnel.</strong> Personnel and approved contractors
            with access to Customer Personal Data are subject to
            confidentiality obligations, receive periodic security and
            privacy training, and have access removed on role change or
            departure.
          </li>
          <li>
            <strong>Data minimization.</strong> Only Personal Data within
            the OAuth scopes Customer approved is retrieved; only data
            relevant to a requested brief is transmitted to the LLM API;
            Brief metadata retained only as needed for the Service.
          </li>
          <li>
            <strong>Sub-processor oversight.</strong> Written contracts
            with each Sub-processor that flow down data-protection
            obligations substantially equivalent to this DPA; annual
            review of Sub-processor posture and transfer mechanisms.
          </li>
          <li>
            <strong>Business continuity.</strong> Sub-processors provide
            backup, redundancy, and disaster-recovery capabilities
            documented in their own DPAs and security documentation, on
            which Dunamis Studios relies.
          </li>
          <li>
            <strong>Transfer Impact Assessment.</strong> Documented TIA
            covering transfers to the US under SCCs and DPF; reviewed at
            least annually and on any material change in Sub-processor,
            legal landscape, or Service architecture.
          </li>
        </ul>
      </>
    ),
  },
  {
    n: "Annex 4",
    id: "annex-4",
    title: "Annex 4 — Sub-processors",
    body: (
      <>
        <p>
          The list of current Sub-processors and their roles, processing
          locations, and transfer mechanisms is published at{" "}
          <Link href="/legal/subprocessors" className="underline">
            /legal/subprocessors
          </Link>{" "}
          and is incorporated into this DPA as Annex 4. That page is the
          authoritative live list, governed by the notice and objection
          process in <a href="#subprocessors" className="underline">§4</a>.
        </p>
      </>
    ),
  },
];

export default function DPAPage() {
  return (
    <Section>
      <Container size="md">
        <PageHeader
          eyebrow="Legal"
          title="Data Processing Addendum"
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
