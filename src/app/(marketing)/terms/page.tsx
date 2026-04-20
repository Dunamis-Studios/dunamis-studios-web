import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { DEBRIEF_TIERS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Dunamis Studios apps — the Debrief HubSpot app, the dunamisstudios.net website, and any related services.",
  alternates: { canonical: "/terms" },
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
    id: "acceptance",
    title: "Acceptance and contracting party",
    body: (
      <>
        <p>
          These Terms of Service (this “<strong>Agreement</strong>”)
          govern your access to and use of the services offered by{" "}
          <strong>Joshua Robert Bradford</strong>, an individual resident of
          the State of Florida, United States, doing business under the name{" "}
          <strong>Dunamis Studios</strong> (“<strong>Company</strong>
          ,” “<strong>Dunamis Studios</strong>,” “
          <strong>we</strong>,” “<strong>us</strong>,” or
          “<strong>our</strong>”), including the Debrief HubSpot
          app, the dunamisstudios.net website, the Dunamis Studios account
          system, and any related APIs or documentation (collectively, the
          “<strong>Service</strong>”).
        </p>
        <p className="mt-3">
          By clicking “I agree,” creating an account, installing
          the Debrief HubSpot app, or using the Service, you agree to this
          Agreement, the{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          , and the{" "}
          <Link href="/legal/dpa" className="underline">
            Data Processing Addendum
          </Link>
          , which is incorporated by reference. If you are entering this
          Agreement on behalf of an entity, you represent that you have
          authority to bind that entity and “<strong>Customer</strong>
          ” or “<strong>you</strong>” refers to that entity.
          If you do not have authority, or if you do not agree, do not use the
          Service.
        </p>
      </>
    ),
  },
  {
    n: "2",
    id: "definitions",
    title: "Definitions",
    body: (
      <>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            “<strong>Anthropic</strong>” means Anthropic, PBC, the
            operator of the Claude large language model API used by the
            Service.
          </li>
          <li>
            “<strong>Brief</strong>” or “<strong>Output</strong>
            ” means the AI-generated written summaries Debrief produces
            from Customer Data.
          </li>
          <li>
            “<strong>Customer Data</strong>” means the data,
            including personal data, that Customer or its users cause to be
            transmitted into the Service, including HubSpot Data, prompts,
            configuration, and Output Customer chooses to persist.
          </li>
          <li>
            “<strong>Documentation</strong>” means the user-facing
            product documentation published at{" "}
            <Link href="/help" className="underline">
              dunamisstudios.net/help
            </Link>{" "}
            and in the Debrief app, as updated from time to time.
          </li>
          <li>
            “<strong>HubSpot Data</strong>” means data retrieved
            from Customer's HubSpot portal via the OAuth authorization
            Customer grants at install, including contacts, companies, deals,
            tickets, engagements, and associated properties within the scopes
            Customer approved.
          </li>
          <li>
            “<strong>Sub-processor</strong>” means a third party
            engaged by Dunamis Studios that processes Customer Data as part of
            delivering the Service, as listed at{" "}
            <Link href="/legal/subprocessors" className="underline">
              /legal/subprocessors
            </Link>
            .
          </li>
          <li>
            “<strong>Usage Policy</strong>” means Anthropic's
            Usage Policy, currently at{" "}
            <a
              href="https://www.anthropic.com/legal/aup"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              anthropic.com/legal/aup
            </a>
            , as updated by Anthropic from time to time.
          </li>
        </ul>
      </>
    ),
  },
  {
    n: "3",
    id: "service",
    title: "Service description and license grant",
    body: (
      <>
        <p>
          The Service reads Customer's HubSpot Data under the OAuth
          authorization Customer grants at install, transmits the relevant
          records to Anthropic's Claude API over an encrypted connection,
          and returns Briefs to Customer inside Customer's HubSpot portal.
        </p>
        <p className="mt-3">
          Subject to this Agreement and Customer's payment of applicable
          fees, Dunamis Studios grants Customer a limited, non-exclusive,
          non-transferable, non-sublicensable right during the subscription
          term to access and use the Service solely for Customer's
          internal business purposes. All rights not expressly granted are
          reserved.
        </p>
      </>
    ),
  },
  {
    n: "4",
    id: "customer-responsibilities",
    title: "Customer responsibilities",
    body: (
      <>
        <p>
          Customer represents, warrants, and covenants that:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            Customer has the right and lawful basis (including any required
            consents, notices, and legitimate interests) to share HubSpot Data
            and any other Customer Data with Dunamis Studios, Anthropic, and
            the Sub-processors, for the purposes described in the{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>{" "}
            and DPA.
          </li>
          <li>
            Customer will maintain the confidentiality of its account
            credentials and is responsible for all activity under its
            account and within its HubSpot portal as to the Service.
          </li>
          <li>
            Customer will comply with all applicable laws in its access and
            use of the Service, including export-control, sanctions, data
            protection, consumer protection, anti-spam, and employment laws.
          </li>
          <li>
            <strong>Sensitive-data prohibition.</strong> Customer will not
            submit or cause the Service to process any of the following:
            (a) “special categories of personal data” under
            GDPR Article 9 (health, genetic, biometric, racial or ethnic
            origin, political opinions, religious or philosophical beliefs,
            trade-union membership, sex life or sexual orientation data);
            (b) “sensitive personal information” under the CCPA
            as amended by the CPRA (including government-issued
            identifiers, financial account, precise geolocation, genetic,
            biometric identification, health, sex life or sexual
            orientation, mail/email/text-message content, and union
            membership); (c) protected health information (PHI) subject to
            HIPAA; (d) payment card data within the scope of PCI DSS;
            (e) information about individuals known or reasonably believed
            to be under age 16; or (f) any other category of sensitive,
            restricted, or regulated personal data for which Customer
            lacks the legal right to transfer to a US processor under the
            Service's described data flow.
          </li>
          <li>
            Customer will not use the Service in any HubSpot-restricted
            industry or in a way that would cause Customer or Dunamis
            Studios to breach HubSpot's Customer Terms of Service,
            Acceptable Use Policy, or Data Processing Agreement.
          </li>
          <li>
            Customer is solely responsible for its HubSpot configuration,
            including which users have access, which properties are
            populated, which are considered sensitive, and for keeping its
            HubSpot account in good standing.
          </li>
        </ul>
      </>
    ),
  },
  {
    n: "5",
    id: "subscriptions",
    title: "Subscriptions, billing, renewal, and cancellation",
    body: (
      <>
        <p>
          <strong>Plans.</strong> Debrief is offered on monthly subscription
          tiers published at{" "}
          <Link href="/pricing" className="underline">
            /pricing
          </Link>{" "}
          and defined in the Dunamis Studios pricing registry. Current tiers
          are <strong>{DEBRIEF_TIERS.starter.label}</strong> (
          {DEBRIEF_TIERS.starter.monthlyAllotment} credits per month),{" "}
          <strong>{DEBRIEF_TIERS.pro.label}</strong> (
          {DEBRIEF_TIERS.pro.monthlyAllotment} credits per month), and{" "}
          <strong>{DEBRIEF_TIERS.enterprise.label}</strong> (
          {DEBRIEF_TIERS.enterprise.monthlyAllotment} credits per month).
          Fees, credit allotments, and feature sets are governed by the
          pricing page and may be updated on notice as described below.
        </p>
        <p className="mt-3">
          <strong>First-month bonus.</strong> Each tier includes a one-time
          first-month bonus equal to two (2) times the monthly credit
          allotment for that tier (currently{" "}
          {DEBRIEF_TIERS.starter.firstMonthBonus},{" "}
          {DEBRIEF_TIERS.pro.firstMonthBonus}, and{" "}
          {DEBRIEF_TIERS.enterprise.firstMonthBonus} credits respectively for
          Starter, Pro, and Enterprise). The bonus applies to the first
          billing period only, is not pro-rated on mid-cycle tier changes,
          and is not redeemable for cash or credit toward future periods.
        </p>
        <p className="mt-3">
          <strong>Auto-renewal.</strong> Subscriptions renew automatically at
          the end of each billing period at the then-current rate unless
          cancelled. At checkout, Customer provides affirmative consent to
          this auto-renewal, and will receive a retainable confirmation email
          summarizing the plan, price, renewal cadence, and the cancellation
          path. Customer may cancel auto-renewal at any time from the Dunamis
          Studios account dashboard — the cancellation path is at least as
          easy as signup. Dunamis Studios implements this practice to comply
          with ROSCA and applicable state automatic-renewal laws (ARLs),
          notwithstanding the 8th Circuit's July 2025 vacatur of the
          FTC's “Click-to-Cancel” rule.
        </p>
        <p className="mt-3">
          <strong>Annual plans and reminders.</strong> If annual plans are
          offered, Dunamis Studios will send a pre-renewal reminder 15 to 45
          days before the renewal date, as required by applicable ARLs and
          card-network rules.
        </p>
        <p className="mt-3">
          <strong>Price changes.</strong> Dunamis Studios may change fees for
          a subscription tier on at least thirty (30) days' email notice
          to the administrative contact on the account. Price changes take
          effect at the next renewal; if Customer does not agree, Customer may
          cancel before the renewal date.
        </p>
        <p className="mt-3">
          <strong>Cancellation.</strong> Customer may cancel at any time. The
          subscription remains active, and the applicable credit allotment
          remains available, through the end of the current paid period. No
          pro-rata refunds are issued for partial periods except as required
          by law.
        </p>
        <p className="mt-3">
          <strong>Payment processing and taxes.</strong> Payments are
          processed by <strong>Stripe, Inc.</strong>; Customer's payment
          is subject to Stripe's terms. Fees are stated exclusive of
          applicable taxes. Customer is responsible for all VAT, GST, sales
          tax, use tax, and similar taxes levied on the subscription,
          excluding taxes on Dunamis Studios's net income. Dunamis
          Studios uses <strong>Stripe Tax</strong> to calculate and collect
          these amounts where applicable. Business customers in the EU with
          a valid VAT identification number may be subject to the reverse
          charge, in which case Customer is responsible for self-accounting
          for VAT under its local rules.
        </p>
        <p className="mt-3">
          <strong>Non-payment.</strong> If a charge is declined or fails,
          Dunamis Studios may suspend the Service after reasonable notice and
          may terminate the subscription for cause if the failure persists
          (see <a href="#term" className="underline">§13</a>).
        </p>
      </>
    ),
  },
  {
    n: "6",
    id: "aup",
    title: "Acceptable Use Policy",
    body: (
      <>
        <p>
          <strong>Anthropic flow-through.</strong> Anthropic's Usage
          Policy (available at{" "}
          <a
            href="https://www.anthropic.com/legal/aup"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            anthropic.com/legal/aup
          </a>
          ) is incorporated into this Agreement by reference. Customer will
          comply with it as if Customer were a direct Anthropic customer.
        </p>
        <p className="mt-3">
          In addition, Customer will not, and will not permit its users or
          any third party to:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            use the Service for any unlawful purpose, or to infringe or
            misappropriate the intellectual property, privacy, publicity, or
            other rights of any person;
          </li>
          <li>
            reverse engineer, decompile, disassemble, or otherwise attempt to
            derive the source code, model weights, prompts, or underlying
            components of the Service, except to the extent permitted by
            non-waivable law;
          </li>
          <li>
            share credentials, resell, sublicense, or provide the Service to
            any third party on a service-bureau basis;
          </li>
          <li>
            use the Service in a manner that imposes an unreasonable or
            disproportionately large load on the Service or any Sub-processor
            infrastructure, or that interferes with or disrupts Service
            integrity or performance;
          </li>
          <li>
            use any Output or data obtained from the Service to develop,
            train, fine-tune, or improve any artificial-intelligence or
            machine-learning model that competes with Anthropic's models
            or the Service (flow-through of Anthropic Commercial Terms §D.4);
          </li>
          <li>
            attempt to circumvent, jailbreak, or prompt-inject the Service, or
            induce the Service to generate content that violates the Usage
            Policy or applicable law;
          </li>
          <li>
            use the Service to generate, transmit, or facilitate child sexual
            abuse material; non-consensual intimate imagery; election
            disinformation; harassment or targeted intimidation of
            individuals; impersonation of a person or entity; malicious
            cyber-operations (malware, phishing, intrusions); or
            terror-facilitating content;
          </li>
          <li>
            use any Brief as the sole basis for an employment, credit,
            healthcare, insurance, housing, education, legal-advice, or
            similarly significant decision about an identifiable individual
            without qualified human review (see{" "}
            <a href="#ai-output" className="underline">
              §7
            </a>
            );
          </li>
          <li>
            submit data in violation of the sensitive-data prohibition in{" "}
            <a href="#customer-responsibilities" className="underline">
              §4
            </a>
            .
          </li>
        </ul>
        <p className="mt-3">
          Violation of this Acceptable Use Policy is a material breach and
          grounds for immediate suspension or termination under{" "}
          <a href="#term" className="underline">
            §13
          </a>
          .
        </p>
      </>
    ),
  },
  {
    n: "7",
    id: "ai-output",
    title: "AI Output terms",
    body: (
      <>
        <p>
          <strong>Ownership.</strong> As between the parties, and subject to
          Customer's payment of applicable fees and compliance with this
          Agreement, Customer owns the Briefs generated for its account.
          Dunamis Studios assigns to Customer all right, title, and interest
          (if any) Dunamis Studios may have in and to the Briefs. Customer
          grants Dunamis Studios a worldwide, non-exclusive, royalty-free
          license to host, store, transmit, and display the Briefs solely as
          necessary to operate the Service and to comply with law. Dunamis
          Studios does not claim any ownership or proprietary right in the
          HubSpot Data or other Customer Data used to generate Briefs.
        </p>
        <p className="mt-3">
          <strong>No exclusivity.</strong> Large language models generate
          probabilistically. Substantially similar Outputs may be generated
          for other customers operating on comparable input. Customer does
          not have an exclusive right to any specific phrasing, fact, or
          structural element of a Brief except to the extent of the copyright
          or other right Customer independently holds in the underlying
          material.
        </p>
        <p className="mt-3">
          <strong>Copyrightability caveat.</strong> Briefs that lack
          meaningful human creative contribution may not be protectable by
          copyright under <em>Thaler v. Perlmutter</em> (D.C. Cir. 2025) and
          the US Copyright Office's January 2025 report on AI-assisted
          authorship. If Customer wants copyright protection, Customer
          should add human creative editing to the Brief before use.
        </p>
        <p className="mt-3">
          <strong>No training of competing models.</strong> Customer will not
          use the Briefs, or any data obtained from the Service, to develop,
          train, fine-tune, or improve any AI or machine-learning model that
          competes with Anthropic's models or the Service. This
          restriction is a flow-through of Anthropic Commercial Terms §D.4.
        </p>
        <div className="mt-4 rounded-md border border-[var(--fg-subtle)]/40 bg-[color-mix(in_oklch,var(--fg)_4%,transparent)] px-4 py-4 text-sm">
          <p>
            <strong>AI OUTPUT DISCLAIMER.</strong>
          </p>
          <p className="mt-2 uppercase">
            BRIEFS ARE GENERATED BY ARTIFICIAL INTELLIGENCE MODELS (INCLUDING
            ANTHROPIC'S CLAUDE) BASED ON CRM DATA CUSTOMER PROVIDES. AI
            OUTPUTS MAY CONTAIN ERRORS, INACCURACIES, OMISSIONS, OR
            FABRICATED INFORMATION (“HALLUCINATIONS”). CUSTOMER
            IS SOLELY RESPONSIBLE FOR REVIEWING, VERIFYING, AND EDITING
            BRIEFS BEFORE RELYING ON OR ACTING UPON THEM. CUSTOMER WILL NOT
            USE BRIEFS AS THE SOLE BASIS FOR ANY LEGALLY BINDING DECISION,
            REGULATORY FILING, FINANCIAL TRANSACTION, MEDICAL, LEGAL, OR
            EMPLOYMENT DETERMINATION, OR ANY DECISION HAVING A SIGNIFICANT
            EFFECT ON ANY INDIVIDUAL, WITHOUT QUALIFIED HUMAN REVIEW.
            DUNAMIS EXPRESSLY DISCLAIMS ALL WARRANTIES REGARDING THE
            ACCURACY, COMPLETENESS, RELIABILITY, OR FITNESS FOR PURPOSE OF
            AI OUTPUTS. DUNAMIS'S LIABILITY FOR ANY CLAIM ARISING FROM
            INACCURATE OR MISLEADING AI OUTPUT IS LIMITED TO THE LESSER OF
            (A) FEES PAID BY CUSTOMER IN THE THREE MONTHS PRECEDING THE
            CLAIM, OR (B) US$500.
          </p>
        </div>
      </>
    ),
  },
  {
    n: "8",
    id: "data-protection",
    title: "Data protection and DPA",
    body: (
      <>
        <p>
          To the extent Dunamis Studios processes personal data on behalf of
          Customer in providing the Service, the{" "}
          <Link href="/legal/dpa" className="underline">
            Dunamis Studios Data Processing Addendum
          </Link>{" "}
          (the “<strong>DPA</strong>”) is incorporated into this
          Agreement by reference. The DPA governs Dunamis Studios's
          processing of personal data as a processor / service provider,
          including international transfer mechanisms (EU Standard
          Contractual Clauses Modules 2 and 3, UK International Data
          Transfer Addendum, Swiss Addendum, and the Data Privacy Framework
          for DPF-certified Sub-processors).
        </p>
        <p className="mt-3">
          Dunamis Studios publishes its current list of Sub-processors at{" "}
          <Link href="/legal/subprocessors" className="underline">
            /legal/subprocessors
          </Link>{" "}
          and commits to thirty (30) days' advance notice of new
          Sub-processors that will process Customer Personal Data, subject to
          the upstream asymmetry disclosed on that page.
        </p>
        <p className="mt-3">
          Dunamis Studios will assist Customer with data-subject requests as
          required by the DPA, notify Customer of any personal-data breach
          without undue delay and in any event within 48 hours of confirmed
          discovery (see DPA §9), and, on termination, delete or return
          Customer Data as described in <a href="#term" className="underline">§13</a>.
        </p>
      </>
    ),
  },
  {
    n: "9",
    id: "confidentiality",
    title: "Confidentiality",
    body: (
      <>
        <p>
          Each party (the “<strong>Receiving Party</strong>”) may
          be exposed to non-public information of the other party (the
          “<strong>Disclosing Party</strong>”) that is marked or
          identified as confidential, or that a reasonable person would
          understand to be confidential given its nature and the
          circumstances of disclosure (“<strong>Confidential
          Information</strong>”). Confidential Information includes
          Customer Data, non-public business and technical information,
          pricing, and roadmap.
        </p>
        <p className="mt-3">
          The Receiving Party will: (a) protect the Confidential Information
          using at least the same degree of care it uses to protect its own
          confidential information of like importance, but in no event less
          than reasonable care; (b) use it only as necessary to exercise
          rights and perform obligations under this Agreement; and (c) limit
          access to personnel and contractors who need to know it and who
          are bound by confidentiality obligations at least as protective as
          this Section.
        </p>
        <p className="mt-3">
          Obligations of confidentiality continue for <strong>five (5) years</strong>{" "}
          after disclosure, except that obligations as to trade secrets
          continue for so long as the information qualifies as a trade secret
          under applicable law.
        </p>
        <p className="mt-3">
          Customary exceptions apply: information that is or becomes public
          without breach; was rightfully in the Receiving Party's
          possession without obligation of confidentiality; is independently
          developed without use of Confidential Information; or is rightfully
          obtained from a third party without restriction. Either party may
          disclose Confidential Information to the extent required by law or
          lawful process, provided that, where legally permitted, it gives
          the Disclosing Party prompt notice and reasonable cooperation to
          seek a protective order.
        </p>
      </>
    ),
  },
  {
    n: "10",
    id: "warranties",
    title: "Warranties and disclaimers",
    body: (
      <>
        <p>
          <strong>Limited service warranty.</strong> Dunamis Studios warrants
          that the Service will perform in material conformance with the
          Documentation during the subscription term. Customer's sole
          and exclusive remedy, and Dunamis Studios's entire liability,
          for breach of this warranty is, at Dunamis Studios's option,
          (a) re-performance of the non-conforming Service, or (b) refund of
          the pro-rated fees for the non-conformance period. This warranty
          is void to the extent non-conformance is caused by Customer's
          breach, third-party products, force majeure, or use outside the
          Documentation.
        </p>
        <div className="mt-4 rounded-md border border-[var(--fg-subtle)]/40 bg-[color-mix(in_oklch,var(--fg)_4%,transparent)] px-4 py-4 text-sm">
          <p className="uppercase">
            Except for the limited service warranty above, the service is
            provided “as is” and “as available.”
            Dunamis studios disclaims all warranties, express or implied,
            including implied warranties of merchantability, fitness for a
            particular purpose, title, non-infringement, and any warranty
            arising from course of dealing or usage of trade. Dunamis
            studios does not warrant that the service will be uninterrupted
            or error-free, that it will meet customer's requirements,
            or that defects will be corrected. Dunamis studios does not
            warrant that AI-generated outputs will be accurate, complete,
            reliable, non-infringing, or fit for any particular purpose.
          </p>
        </div>
      </>
    ),
  },
  {
    n: "11",
    id: "indemnification",
    title: "Indemnification",
    body: (
      <>
        <p>
          <strong>Customer indemnity.</strong> Customer will defend,
          indemnify, and hold harmless Dunamis Studios, Joshua Robert
          Bradford personally, and their respective affiliates, officers,
          employees, contractors, and agents from and against any third-party
          claim, action, proceeding, or demand, and all resulting damages,
          fines, judgments, settlements, and reasonable attorneys' fees,
          arising out of or relating to: (a) Customer's Customer Data,
          including claims that such data was collected, used, or shared
          without legal basis or required consents; (b) Customer's
          breach of <a href="#customer-responsibilities" className="underline">§4</a>{" "}
          or <a href="#aup" className="underline">§6</a>, including any
          submission of sensitive data categories; (c) Customer's or its
          users' reliance on or acting upon AI Output without qualified
          human review; (d) Customer's combination of the Service with
          any product, service, data, or content not provided by Dunamis
          Studios; or (e) Customer's violation of applicable law.
        </p>
        <p className="mt-3">
          <strong>Dunamis IP indemnity (narrow).</strong> Dunamis Studios
          will defend Customer from and against any third-party claim that
          Customer's authorized use of the Service, strictly in
          accordance with this Agreement and the Documentation, infringes
          that third party's US patent, copyright, trademark, or trade
          secret, and will pay resulting damages finally awarded against
          Customer by a court of competent jurisdiction or a settlement
          Dunamis Studios agrees to in writing. This obligation does not
          apply to claims arising from or related to: (i) Customer Data, AI
          Output, or any combination thereof; (ii) use of the Service after
          notice to discontinue; (iii) Customer's modifications or use
          not in accordance with the Documentation; (iv) combinations with
          non-Dunamis products, services, or data; or (v) Customer's
          specifications or instructions. <strong>AI Outputs are expressly
          excluded from the Dunamis IP indemnity</strong>; upstream Anthropic
          does not indemnify Dunamis Studios for Output IP claims at this
          tier, and Customer acknowledges that Dunamis Studios cannot offer
          an indemnity it does not itself hold.
        </p>
        <p className="mt-3">
          <strong>Dunamis options on an IP claim.</strong> If the Service, or
          any component, is or in Dunamis Studios's reasonable opinion
          is likely to become the subject of an IP claim, Dunamis Studios
          may, at its option and expense: (x) procure the right for Customer
          to continue using the Service; (y) modify the Service to be
          non-infringing while substantially preserving its functionality; or
          (z) terminate the affected subscription and refund any unused
          pre-paid fees for the period after termination. The preceding
          options and the defense described in this Section state the entire
          liability of Dunamis Studios, and Customer's exclusive remedy,
          for IP infringement claims.
        </p>
        <p className="mt-3">
          <strong>Procedure.</strong> The indemnified party will promptly
          notify the indemnifying party of the claim, give the indemnifying
          party sole control of the defense and settlement (provided the
          settlement does not impose monetary obligations or admissions of
          liability on the indemnified party without its consent), and
          provide reasonable cooperation at the indemnifying party's
          expense.
        </p>
      </>
    ),
  },
  {
    n: "12",
    id: "liability",
    title: "Limitation of liability",
    body: (
      <>
        <div className="rounded-md border border-[var(--fg-subtle)]/40 bg-[color-mix(in_oklch,var(--fg)_4%,transparent)] px-4 py-4 text-sm">
          <p className="uppercase">
            To the maximum extent permitted by applicable law, neither party
            will be liable to the other for any indirect, incidental,
            consequential, special, exemplary, or punitive damages; loss of
            profits; loss of revenue; loss of data; loss of goodwill; or
            cost of procurement of substitute goods or services, arising
            out of or relating to this agreement or the service, whether in
            contract, tort (including negligence), strict liability, or
            otherwise, and whether or not the party has been advised of the
            possibility of such damages.
          </p>
          <p className="mt-3 uppercase">
            Each party's aggregate liability arising out of or relating
            to this agreement is capped at the greater of (a) US$100, or
            (b) the total fees paid by customer to dunamis studios for the
            service in the twelve (12) months preceding the event giving
            rise to the liability (the “general cap”).
          </p>
          <p className="mt-3 uppercase">
            Notwithstanding the general cap, dunamis studios's
            aggregate liability for any claim arising out of or relating to
            inaccurate, incomplete, misleading, or fabricated AI output
            (including any brief) is capped at the lesser of (a) the fees
            paid by customer in the three (3) months preceding the claim,
            or (b) US$500 (the “AI output sub-cap”). The AI
            output sub-cap is included within, and not in addition to, the
            general cap.
          </p>
        </div>
        <p className="mt-4">
          <strong>Carve-outs from the cap.</strong> The foregoing limits do
          not apply to: (i) a party's indemnification obligations under{" "}
          <a href="#indemnification" className="underline">§11</a>;
          (ii) breach of <a href="#confidentiality" className="underline">§9</a>{" "}
          (Confidentiality); (iii) Customer's failure to pay undisputed
          fees; (iv) Customer's breach of <a href="#aup" className="underline">§6</a>{" "}
          (Acceptable Use Policy) or the sensitive-data prohibition in{" "}
          <a href="#customer-responsibilities" className="underline">§4</a>;
          (v) infringement or misappropriation of the other party's
          intellectual property; or (vi) liability that, under Florida law
          or other applicable non-waivable law, cannot be limited or
          excluded, including liability for{" "}
          <strong>fraud, gross negligence, or willful misconduct</strong>,
          and liability for personal injury or death. For those carve-outs,
          liability is determined by applicable law without the above caps.
        </p>
        <p className="mt-3">
          <strong>Non-waivable consumer rights.</strong> Nothing in this
          Section limits any non-waivable right of a consumer under
          applicable law. Where a consumer law of a jurisdiction (including
          UK UCTA, EU consumer law, or a US state consumer-protection law)
          requires broader liability than stated above, that law governs to
          the minimum extent required.
        </p>
        <p className="mt-3">
          <strong>Basis of the bargain.</strong> Customer acknowledges that
          the limits and allocations of risk in this Agreement are
          fundamental elements of the bargain between the parties and a
          material inducement to Dunamis Studios to provide the Service at
          the fees charged.
        </p>
      </>
    ),
  },
  {
    n: "13",
    id: "term",
    title: "Term, termination, and effect of termination",
    body: (
      <>
        <p>
          <strong>Term.</strong> This Agreement begins when Customer first
          accepts it and continues until all subscriptions have expired or
          been terminated.
        </p>
        <p className="mt-3">
          <strong>Customer cancellation.</strong> Customer may cancel any
          subscription from the account dashboard at any time. The
          subscription remains active through the end of the current paid
          period; no pro-rata refunds are issued except as required by law.
        </p>
        <p className="mt-3">
          <strong>Termination by Dunamis Studios.</strong> Dunamis Studios
          may terminate this Agreement or any subscription: (a) for cause on{" "}
          <strong>fifteen (15) days' notice</strong> of non-payment
          that remains uncured after the notice period; (b) for cause on{" "}
          <strong>thirty (30) days' notice</strong> of any other
          material breach that remains uncured after the notice period;
          (c) for convenience on thirty (30) days' notice, with a
          refund of any unused, pre-paid fees for the period after
          termination; or (d) <strong>immediately</strong> on notice for a
          violation of{" "}
          <a href="#aup" className="underline">§6</a>{" "}
          (Acceptable Use Policy), for a security risk presented by
          Customer's use, or if required by Anthropic or any other
          Sub-processor or by law.
        </p>
        <p className="mt-3">
          <strong>Effect of termination — data.</strong> On termination or
          expiration, Customer has a <strong>thirty (30)-day export
          window</strong> during which Customer may export its Briefs
          through the Service's export tooling. After the export
          window, Dunamis Studios will delete Customer Data from active
          production systems within sixty (60) days of termination; data
          residing in backups is deleted on its natural backup-rotation
          cycle (generally within 30–90 days). Customer retains ownership
          of Briefs it has previously exported; those exports are outside
          the Service and are Customer's responsibility.
        </p>
        <p className="mt-3">
          <strong>Survival.</strong> The following Sections survive
          termination or expiration:{" "}
          <a href="#definitions" className="underline">§2</a> (Definitions, as
          needed to interpret surviving Sections),{" "}
          <a href="#ai-output" className="underline">§7</a> (AI Output,
          including the sub-cap),{" "}
          <a href="#confidentiality" className="underline">§9</a>{" "}
          (Confidentiality),{" "}
          <a href="#warranties" className="underline">§10</a> (Warranty
          disclaimer),{" "}
          <a href="#indemnification" className="underline">§11</a>{" "}
          (Indemnification),{" "}
          <a href="#liability" className="underline">§12</a>{" "}
          (Limitation of Liability),{" "}
          <a href="#governing-law" className="underline">§15</a>{" "}
          (Governing Law and Disputes),{" "}
          <a href="#assignment" className="underline">§16</a>{" "}
          (Assignment), and{" "}
          <a href="#general" className="underline">§18</a>{" "}
          (General).
        </p>
      </>
    ),
  },
  {
    n: "14",
    id: "hubspot",
    title: "HubSpot-specific terms",
    body: (
      <>
        <p>
          <strong>Non-affiliation.</strong> HubSpot® is a registered
          trademark of HubSpot, Inc. Debrief is independently developed and
          operated by Dunamis Studios and is not affiliated with, endorsed
          by, sponsored by, or certified by HubSpot, Inc.
        </p>
        <p className="mt-3">
          <strong>Customer HubSpot obligations.</strong> Customer agrees
          that its use of the Service, including the OAuth authorization
          Customer grants at install, will not cause Customer or Dunamis
          Studios to breach HubSpot's Customer Terms of Service,
          Acceptable Use Policy, or Data Processing Agreement. Customer
          will not use the Service in any industry or manner HubSpot has
          restricted or prohibited.
        </p>
        <p className="mt-3">
          <strong>OAuth authorization lifecycle.</strong> Customer's
          HubSpot Super Admin authorizes Debrief via HubSpot OAuth at
          install and may revoke authorization at any time through the
          HubSpot Connected Apps interface. On uninstall or revocation,
          Dunamis Studios will treat the event as termination of the
          subscription for the affected portal and will follow the deletion
          process described in{" "}
          <a href="#term" className="underline">§13</a>.
        </p>
      </>
    ),
  },
  {
    n: "15",
    id: "governing-law",
    title: "Governing law, dispute resolution, and arbitration",
    body: (
      <>
        <p>
          <strong>Governing law.</strong> This Agreement is governed by the
          laws of the <strong>State of Florida</strong>, United States,
          without regard to its conflict-of-laws principles. The United
          Nations Convention on Contracts for the International Sale of
          Goods does not apply.
        </p>
        <p className="mt-3">
          <strong>Informal dispute resolution (mandatory prerequisite).</strong>{" "}
          Before initiating arbitration or court proceedings, the party
          raising the dispute will send a written notice to the other party
          describing the claim in reasonable detail. The parties will then
          attempt in good faith, for at least <strong>thirty (30) days</strong>,
          to resolve the dispute through direct discussion between
          authorized representatives. Written notice to Dunamis Studios
          goes to{" "}
          <a href="mailto:legal@dunamisstudios.net" className="underline">
            legal@dunamisstudios.net
          </a>
          ; notice to Customer goes to the administrative contact on the
          account.
        </p>
        <p className="mt-3">
          <strong>Binding arbitration.</strong> Any dispute, claim, or
          controversy arising out of or relating to this Agreement or the
          Service that is not resolved through the informal process will
          be resolved by <strong>binding arbitration administered by the
          American Arbitration Association (AAA) under its Commercial
          Arbitration Rules</strong>. The seat and legal place of
          arbitration is <strong>Florida, United States</strong>. The
          arbitration will be conducted by one arbitrator selected in
          accordance with AAA rules. The arbitrator's award is
          final and binding, and judgment on the award may be entered in
          any court of competent jurisdiction.
        </p>
        <p className="mt-3">
          <strong>Class-action waiver.</strong> Each party agrees that
          disputes will be resolved individually, on a non-class,
          non-representative basis. <strong>Neither party will seek to
          have any dispute heard as a class action, collective action, or
          mass action, or to join or consolidate its claim with the claim
          of any other person.</strong> If this waiver is held
          unenforceable as to any particular claim, that claim will be
          severed and litigated in the courts identified below, while the
          balance of this Section continues to apply.
        </p>
        <p className="mt-3">
          <strong>Injunctive relief in court (carve-out).</strong>{" "}
          Notwithstanding the arbitration agreement, either party may
          seek injunctive or other equitable relief in a court of
          competent jurisdiction to prevent or enjoin actual or threatened
          infringement, misappropriation, or violation of intellectual
          property rights or breach of confidentiality obligations. The
          exclusive courts for such actions are the state and federal
          courts located in the State of Florida, and the parties consent
          to personal jurisdiction and venue in those courts.
        </p>
        <p className="mt-3">
          <strong>Contractual statute of limitations.</strong> Any claim
          or action arising out of or relating to this Agreement must be
          brought, whether in arbitration or in court (for the injunctive
          carve-out above), within <strong>one (1) year</strong> after the
          cause of action accrues. Claims not brought within that period
          are permanently barred.
        </p>
      </>
    ),
  },
  {
    n: "16",
    id: "assignment",
    title: "Assignment",
    body: (
      <>
        <p>
          Customer may not assign this Agreement or any of its rights or
          obligations under it, in whole or in part, by operation of law or
          otherwise, without Dunamis Studios's prior written consent.
          Any attempted assignment without that consent is void.
        </p>
        <p className="mt-3">
          <strong>Assignment by Company.</strong>{" "}
          <strong>
            Dunamis Studios (and Joshua Robert Bradford personally) may
            assign this Agreement, in whole or in part, without Customer's
            consent, to (a) an affiliate; (b) a successor entity formed by
            Company, including upon incorporation of Company as a limited
            liability company or corporation in any US state;
            or (c) any acquirer of all or substantially all of the assets,
            equity, or business relating to the Service.
          </strong>{" "}
          On any such assignment, Dunamis Studios will notify Customer by
          email, and the assignee will step into Dunamis Studios's
          rights and obligations going forward. Subject to the foregoing,
          this Agreement binds and benefits the parties and their permitted
          successors and assigns.
        </p>
      </>
    ),
  },
  {
    n: "17",
    id: "sla",
    title: "Service levels",
    body: (
      <>
        <p>
          Dunamis Studios uses commercially reasonable efforts to make the
          Service available and performant, but <strong>does not commit to
          any uptime percentage or service-level credit regime under this
          Agreement</strong>. Any formal service-level agreement (SLA) with
          uptime commitments or service credits must be executed in a
          separate, signed enterprise agreement.
        </p>
        <p className="mt-3">
          Any availability or performance commitment Dunamis Studios makes
          <strong> expressly excludes</strong> events and conditions outside
          its direct control, including outages, degradations, rate limits,
          or terms changes imposed by HubSpot, Anthropic, Vercel, Upstash,
          Stripe, Resend, or any other Sub-processor; internet,
          telecommunications, or utility failures; and Customer's
          systems or actions.
        </p>
      </>
    ),
  },
  {
    n: "18",
    id: "general",
    title: "General",
    body: (
      <>
        <p>
          <strong>Notices.</strong> Notices to Dunamis Studios must be sent
          to{" "}
          <a href="mailto:legal@dunamisstudios.net" className="underline">
            legal@dunamisstudios.net
          </a>{" "}
          with postal copy to Joshua Robert Bradford d/b/a Dunamis Studios,
          2269 Twin Fox Trail, St. Augustine, FL 32086, United States.
          Notices to Customer may be sent to the administrative email on the
          account and are deemed given on transmission.
        </p>
        <p className="mt-3">
          <strong>Severability.</strong> If any provision of this Agreement
          is held invalid or unenforceable, the remaining provisions
          continue in full force, and the invalid provision will be
          modified to the minimum extent necessary to be enforceable while
          preserving the parties' original intent.
        </p>
        <p className="mt-3">
          <strong>Entire agreement.</strong> This Agreement, together with
          the Privacy Policy, the DPA, the Sub-processors list, and any
          signed order forms, constitutes the entire agreement between the
          parties regarding the Service and supersedes any prior or
          contemporaneous communications. Pre-printed terms on a
          Customer-issued purchase order are rejected and have no effect.
        </p>
        <p className="mt-3">
          <strong>No waiver.</strong> A failure or delay in exercising any
          right is not a waiver of that right.
        </p>
        <p className="mt-3">
          <strong>Force majeure.</strong> Neither party is liable for any
          failure or delay in performance, other than the obligation to
          pay, caused by events beyond its reasonable control, including
          acts of God, war, terrorism, civil unrest, pandemics, labor
          disputes, governmental action, internet or telecommunications
          failures, and outages or terms changes imposed by HubSpot,
          Anthropic, Vercel, Upstash, Stripe, Resend, Amazon Web Services,
          Google Cloud, or any other underlying provider.
        </p>
        <p className="mt-3">
          <strong>Export control and sanctions.</strong> Customer will
          comply with all US export-control, sanctions, and anti-boycott
          laws, including those administered by OFAC and BIS. Customer
          represents it is not located in, under the control of, or a
          national or resident of any country or entity subject to
          comprehensive US sanctions.
        </p>
        <p className="mt-3">
          <strong>Relationship of the parties.</strong> The parties are
          independent contractors. This Agreement creates no partnership,
          joint venture, agency, or employment relationship.
        </p>
        <p className="mt-3">
          <strong>Headings.</strong> Section headings are for convenience
          and do not affect interpretation. References to “including”
          mean “including without limitation.”
        </p>
        <p className="mt-3">
          <strong>Updates to this Agreement.</strong> Dunamis Studios may
          update this Agreement from time to time. For material changes,
          Dunamis Studios will provide at least thirty (30) days'
          email notice to the administrative contact; the updated Agreement
          takes effect on the stated effective date. If Customer does not
          agree to the update, Customer may cancel under{" "}
          <a href="#term" className="underline">§13</a>{" "}
          before the effective date.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <Section>
      <Container size="md">
        <PageHeader
          eyebrow="Legal"
          title="Terms of Service"
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
