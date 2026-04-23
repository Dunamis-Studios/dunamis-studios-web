import Link from "next/link";
import type { LegalDocument } from "./types";

const CALLOUT =
  "mt-4 rounded-md border border-[var(--fg-subtle)]/40 bg-[color-mix(in_oklch,var(--fg)_4%,transparent)] px-4 py-4 text-sm";

const X = (id: string) => `#m-${id}`;

export const termsMaster: LegalDocument = {
  title: "Terms of Service",
  lastUpdated: "April 23, 2026",
  version: "2.0",
  idPrefix: "m-",
  sections: [
    {
      n: "1",
      id: "m-acceptance",
      title: "Acceptance and contracting party",
      body: (
        <>
          <p>
            These Terms of Service (this &ldquo;<strong>Agreement</strong>&rdquo;) govern your
            access to and use of the services offered by{" "}
            <strong>Joshua Robert Bradford</strong>, an individual resident of the State of
            Florida, United States, doing business under the name{" "}
            <strong>Dunamis Studios</strong> (&ldquo;<strong>Company</strong>,&rdquo;{" "}
            &ldquo;<strong>Dunamis Studios</strong>,&rdquo; &ldquo;<strong>we</strong>,&rdquo;{" "}
            &ldquo;<strong>us</strong>,&rdquo; or &ldquo;<strong>our</strong>&rdquo;),
            including the HubSpot marketplace applications published by Dunamis Studios (each
            a &ldquo;<strong>Service</strong>&rdquo; and collectively the{" "}
            &ldquo;<strong>Services</strong>&rdquo;), the dunamisstudios.net website, the
            Dunamis Studios account system, and any related APIs or documentation.
          </p>
          <p className="mt-3">
            The Services currently include <strong>Debrief</strong> and{" "}
            <strong>Property Pulse</strong>. Additional Services released by Dunamis Studios
            from time to time are covered by this Agreement upon their release. Service-specific
            terms for each Service are set forth in the applicable addendum incorporated by
            reference in <a className="underline" href={X("addenda")}>§19</a>.
          </p>
          <p className="mt-3">
            By clicking &ldquo;I agree,&rdquo; creating an account, installing any Service, or
            using any of the Services, you agree to this Agreement, the applicable Service
            addendum(a), the{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            , and the{" "}
            <Link href="/legal/dpa" className="underline">
              Data Processing Addendum
            </Link>
            , which are incorporated by reference. If you are entering this Agreement on behalf
            of an entity, you represent that you have authority to bind that entity and
            &ldquo;<strong>Customer</strong>&rdquo; or &ldquo;<strong>you</strong>&rdquo;
            refers to that entity. If you do not have authority, or if you do not agree, do not
            use the Services.
          </p>
        </>
      ),
    },
    {
      n: "2",
      id: "m-definitions",
      title: "Definitions",
      body: (
        <ul className="list-disc space-y-2 pl-5">
          <li>
            &ldquo;<strong>Anthropic</strong>&rdquo; means Anthropic, PBC, the operator of the
            Claude large language model API used by certain Services.
          </li>
          <li>
            &ldquo;<strong>Customer Data</strong>&rdquo; means the data, including personal
            data, that Customer or its users cause to be transmitted into a Service, including
            HubSpot Data, prompts, configuration, and Output Customer chooses to persist.
          </li>
          <li>
            &ldquo;<strong>Documentation</strong>&rdquo; means the user-facing product
            documentation published at{" "}
            <Link href="/help" className="underline">
              dunamisstudios.net/help
            </Link>{" "}
            and within each Service, as updated from time to time.
          </li>
          <li>
            &ldquo;<strong>HubSpot Data</strong>&rdquo; means data retrieved from Customer&rsquo;s
            HubSpot portal via the OAuth authorization Customer grants at install, within the
            scopes Customer approved.
          </li>
          <li>
            &ldquo;<strong>Output</strong>&rdquo; means data, content, or material a Service
            produces from Customer Data in the course of delivering its functionality,
            including AI-generated content where applicable. Service-specific forms of Output
            are defined in the applicable addendum.
          </li>
          <li>
            &ldquo;<strong>Service Addendum</strong>&rdquo; means the Service-specific terms
            incorporated into this Agreement under{" "}
            <a className="underline" href={X("addenda")}>§19</a>.
          </li>
          <li>
            &ldquo;<strong>Sub-processor</strong>&rdquo; means a third party engaged by Dunamis
            Studios that processes Customer Data as part of delivering a Service, as listed at{" "}
            <Link href="/legal/subprocessors" className="underline">
              /legal/subprocessors
            </Link>
            .
          </li>
          <li>
            &ldquo;<strong>Usage Policy</strong>&rdquo; means Anthropic&rsquo;s Usage Policy,
            currently at{" "}
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
      ),
    },
    {
      n: "3",
      id: "m-service",
      title: "Services and license grant",
      body: (
        <>
          <p>
            Each Service reads Customer&rsquo;s HubSpot Data under the OAuth authorization
            Customer grants at install and provides functionality as described in that
            Service&rsquo;s Documentation and addendum. Where a Service uses artificial
            intelligence, it transmits relevant records to Anthropic&rsquo;s Claude API over an
            encrypted connection, as described in{" "}
            <a className="underline" href={X("ai-output")}>§7</a> and the applicable addendum.
          </p>
          <p className="mt-3">
            Subject to this Agreement, the applicable Service addendum, and Customer&rsquo;s
            payment of applicable fees, Dunamis Studios grants Customer a limited,
            non-exclusive, non-transferable, non-sublicensable right during the subscription or
            license term to access and use the applicable Service solely for Customer&rsquo;s
            internal business purposes. All rights not expressly granted are reserved.
          </p>
        </>
      ),
    },
    {
      n: "4",
      id: "m-customer-responsibilities",
      title: "Customer responsibilities",
      body: (
        <>
          <p>Customer represents, warrants, and covenants that:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Customer has the right and lawful basis (including any required consents, notices,
              and legitimate interests) to share HubSpot Data and any other Customer Data with
              Dunamis Studios, Anthropic (where applicable), and the Sub-processors, for the
              purposes described in the{" "}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>{" "}
              and DPA.
            </li>
            <li>
              Customer will maintain the confidentiality of its account credentials and is
              responsible for all activity under its account and within its HubSpot portal as to
              each Service.
            </li>
            <li>
              Customer will comply with all applicable laws in its access and use of the
              Services, including export-control, sanctions, data protection, consumer
              protection, anti-spam, and employment laws.
            </li>
            <li>
              <strong>Sensitive-data prohibition.</strong> Customer will not submit or cause
              any Service to process any of the following: (a) &ldquo;special categories of
              personal data&rdquo; under GDPR Article 9 (health, genetic, biometric, racial or
              ethnic origin, political opinions, religious or philosophical beliefs,
              trade-union membership, sex life or sexual orientation data); (b) &ldquo;sensitive
              personal information&rdquo; under the CCPA as amended by the CPRA (including
              government-issued identifiers, financial account, precise geolocation, genetic,
              biometric identification, health, sex life or sexual orientation,
              mail/email/text-message content, and union membership); (c) protected health
              information (PHI) subject to HIPAA; (d) payment card data within the scope of
              PCI DSS; (e) information about individuals known or reasonably believed to be
              under age 16; or (f) any other category of sensitive, restricted, or regulated
              personal data for which Customer lacks the legal right to transfer to a US
              processor under the Services&rsquo; described data flow.
            </li>
            <li>
              Customer will not use any Service in any HubSpot-restricted industry or in a way
              that would cause Customer or Dunamis Studios to breach HubSpot&rsquo;s Customer
              Terms of Service, Acceptable Use Policy, or Data Processing Agreement.
            </li>
            <li>
              Customer is solely responsible for its HubSpot configuration, including which
              users have access, which properties are populated, which are considered sensitive,
              and for keeping its HubSpot account in good standing.
            </li>
          </ul>
        </>
      ),
    },
    {
      n: "5",
      id: "m-subscriptions",
      title: "Subscriptions, billing, renewal, and cancellation",
      body: (
        <>
          <p>
            <strong>Plans and pricing.</strong> Each Service is offered on pricing terms set
            forth in the applicable Service addendum and published at the Service&rsquo;s
            product page. Fees and plan structures may be updated on notice as described below.
          </p>
          <p className="mt-3">
            <strong>Recurring subscriptions.</strong> For Services sold on a recurring
            subscription basis (including Debrief), subscriptions renew automatically at the
            end of each billing period at the then-current rate unless cancelled. At checkout,
            Customer provides affirmative consent to auto-renewal and will receive a retainable
            confirmation email summarizing the plan, price, renewal cadence, and the
            cancellation path. Customer may cancel auto-renewal at any time from the Dunamis
            Studios account dashboard &mdash; the cancellation path is at least as easy as
            signup. Dunamis Studios implements this practice to comply with ROSCA and applicable
            state automatic-renewal laws (ARLs), notwithstanding the 8th Circuit&rsquo;s July
            2025 vacatur of the FTC&rsquo;s &ldquo;Click-to-Cancel&rdquo; rule.
          </p>
          <p className="mt-3">
            <strong>One-time licenses.</strong> For Services sold on a one-time fee basis
            (including Property Pulse), Customer pays a single fee per HubSpot portal at
            install. Service-specific refund terms are set forth in the applicable addendum.
          </p>
          <p className="mt-3">
            <strong>Annual plans and reminders.</strong> If annual plans are offered for any
            Service, Dunamis Studios will send a pre-renewal reminder 15 to 45 days before the
            renewal date, as required by applicable ARLs and card-network rules.
          </p>
          <p className="mt-3">
            <strong>Price changes.</strong> Dunamis Studios may change fees for a Service on at
            least thirty (30) days&rsquo; email notice to the administrative contact on the
            account. Price changes for recurring subscriptions take effect at the next renewal;
            if Customer does not agree, Customer may cancel before the renewal date. One-time
            license prices apply to new installations only; prior paid installations are not
            re-billed.
          </p>
          <p className="mt-3">
            <strong>Cancellation.</strong> For recurring subscriptions, Customer may cancel at
            any time. The subscription remains active, and any applicable usage allotment
            remains available, through the end of the current paid period. No pro-rata refunds
            are issued for partial periods except as required by law or as set forth in the
            applicable Service addendum. For one-time licenses, refund eligibility is defined in
            the applicable Service addendum.
          </p>
          <p className="mt-3">
            <strong>Payment processing and taxes.</strong> Payments are processed by{" "}
            <strong>Stripe, Inc.</strong>; Customer&rsquo;s payment is subject to Stripe&rsquo;s
            terms. Fees are stated exclusive of applicable taxes. Customer is responsible for
            all VAT, GST, sales tax, use tax, and similar taxes levied on the purchase,
            excluding taxes on Dunamis Studios&rsquo;s net income. Dunamis Studios uses{" "}
            <strong>Stripe Tax</strong> to calculate and collect these amounts where applicable.
            Business customers in the EU with a valid VAT identification number may be subject
            to the reverse charge, in which case Customer is responsible for self-accounting for
            VAT under its local rules.
          </p>
          <p className="mt-3">
            <strong>Non-payment.</strong> If a charge is declined or fails, Dunamis Studios may
            suspend the affected Service after reasonable notice and may terminate the
            subscription or license for cause if the failure persists (see{" "}
            <a className="underline" href={X("term")}>§13</a>).
          </p>
        </>
      ),
    },
    {
      n: "6",
      id: "m-aup",
      title: "Acceptable Use Policy",
      body: (
        <>
          <p>
            <strong>Anthropic flow-through.</strong> For any Service that transmits data to
            Anthropic&rsquo;s Claude API, Anthropic&rsquo;s Usage Policy (available at{" "}
            <a
              href="https://www.anthropic.com/legal/aup"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              anthropic.com/legal/aup
            </a>
            ) is incorporated into this Agreement by reference. Customer will comply with it as
            if Customer were a direct Anthropic customer. The applicable Service addendum
            identifies which Services transmit data to Anthropic.
          </p>
          <p className="mt-3">
            In addition, Customer will not, and will not permit its users or any third party to:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              use any Service for any unlawful purpose, or to infringe or misappropriate the
              intellectual property, privacy, publicity, or other rights of any person;
            </li>
            <li>
              reverse engineer, decompile, disassemble, or otherwise attempt to derive the
              source code, model weights, prompts, or underlying components of any Service,
              except to the extent permitted by non-waivable law;
            </li>
            <li>
              share credentials, resell, sublicense, or provide the Services to any third party
              on a service-bureau basis;
            </li>
            <li>
              use any Service in a manner that imposes an unreasonable or disproportionately
              large load on Service or Sub-processor infrastructure, or that interferes with or
              disrupts Service integrity or performance;
            </li>
            <li>
              use any Output or data obtained from a Service to develop, train, fine-tune, or
              improve any artificial-intelligence or machine-learning model that competes with
              Anthropic&rsquo;s models or any Service (flow-through of Anthropic Commercial
              Terms §D.4 where applicable);
            </li>
            <li>
              attempt to circumvent, jailbreak, or prompt-inject any AI-enabled Service, or
              induce such a Service to generate content that violates the Usage Policy or
              applicable law;
            </li>
            <li>
              use any Service to generate, transmit, or facilitate child sexual abuse material;
              non-consensual intimate imagery; election disinformation; harassment or targeted
              intimidation of individuals; impersonation of a person or entity; malicious
              cyber-operations (malware, phishing, intrusions); or terror-facilitating content;
            </li>
            <li>
              use any AI-generated Output as the sole basis for an employment, credit,
              healthcare, insurance, housing, education, legal-advice, or similarly significant
              decision about an identifiable individual without qualified human review (see{" "}
              <a className="underline" href={X("ai-output")}>§7</a>);
            </li>
            <li>
              submit data in violation of the sensitive-data prohibition in{" "}
              <a className="underline" href={X("customer-responsibilities")}>§4</a>.
            </li>
          </ul>
          <p className="mt-3">
            Violation of this Acceptable Use Policy is a material breach and grounds for
            immediate suspension or termination under{" "}
            <a className="underline" href={X("term")}>§13</a>.
          </p>
        </>
      ),
    },
    {
      n: "7",
      id: "m-ai-output",
      title: "AI Output terms",
      body: (
        <>
          <p>
            <strong>Scope.</strong> This Section applies only to Services that use artificial
            intelligence to generate Output. The applicable Service addendum identifies which
            Services use AI and defines the form of AI-generated Output for that Service.
          </p>
          <p className="mt-3">
            <strong>Ownership.</strong> As between the parties, and subject to Customer&rsquo;s
            payment of applicable fees and compliance with this Agreement, Customer owns the
            AI-generated Output produced for its account. Dunamis Studios assigns to Customer
            all right, title, and interest (if any) Dunamis Studios may have in such Output.
            Customer grants Dunamis Studios a worldwide, non-exclusive, royalty-free license to
            host, store, transmit, and display the Output solely as necessary to operate the
            applicable Service and to comply with law. Dunamis Studios does not claim any
            ownership or proprietary right in the HubSpot Data or other Customer Data used to
            generate Output.
          </p>
          <p className="mt-3">
            <strong>No exclusivity.</strong> Large language models generate probabilistically.
            Substantially similar Output may be generated for other customers operating on
            comparable input. Customer does not have an exclusive right to any specific
            phrasing, fact, or structural element of AI-generated Output except to the extent of
            the copyright or other right Customer independently holds in the underlying
            material.
          </p>
          <p className="mt-3">
            <strong>Copyrightability caveat.</strong> AI-generated Output that lacks meaningful
            human creative contribution may not be protectable by copyright under{" "}
            <em>Thaler v. Perlmutter</em> (D.C. Cir. 2025) and the US Copyright Office&rsquo;s
            January 2025 report on AI-assisted authorship. If Customer wants copyright
            protection, Customer should add human creative editing to the Output before use.
          </p>
          <p className="mt-3">
            <strong>No training of competing models.</strong> Customer will not use AI-generated
            Output, or any data obtained from a Service, to develop, train, fine-tune, or
            improve any AI or machine-learning model that competes with Anthropic&rsquo;s
            models or any Service. This restriction is a flow-through of Anthropic Commercial
            Terms §D.4.
          </p>
          <div className={CALLOUT}>
            <p>
              <strong>AI OUTPUT DISCLAIMER.</strong>
            </p>
            <p className="mt-2 uppercase">
              AI-generated output is produced by artificial intelligence models (including
              Anthropic&rsquo;s Claude) based on CRM data Customer provides. AI outputs may
              contain errors, inaccuracies, omissions, or fabricated information
              (&ldquo;hallucinations&rdquo;). Customer is solely responsible for reviewing,
              verifying, and editing AI-generated output before relying on or acting upon it.
              Customer will not use AI-generated output as the sole basis for any legally
              binding decision, regulatory filing, financial transaction, medical, legal, or
              employment determination, or any decision having a significant effect on any
              individual, without qualified human review. Dunamis expressly disclaims all
              warranties regarding the accuracy, completeness, reliability, or fitness for
              purpose of AI outputs. Dunamis&rsquo;s liability for any claim arising from
              inaccurate or misleading AI output is subject to the AI output sub-cap in{" "}
              <a className="underline" href={X("liability")}>§12</a>.
            </p>
          </div>
        </>
      ),
    },
    {
      n: "8",
      id: "m-data-protection",
      title: "Data protection and DPA",
      body: (
        <>
          <p>
            To the extent Dunamis Studios processes personal data on behalf of Customer in
            providing any Service, the{" "}
            <Link href="/legal/dpa" className="underline">
              Dunamis Studios Data Processing Addendum
            </Link>{" "}
            (the &ldquo;<strong>DPA</strong>&rdquo;) is incorporated into this Agreement by
            reference. The DPA governs Dunamis Studios&rsquo;s processing of personal data as a
            processor / service provider, including international transfer mechanisms (EU
            Standard Contractual Clauses Modules 2 and 3, UK International Data Transfer
            Addendum, Swiss Addendum, and the Data Privacy Framework for DPF-certified
            Sub-processors).
          </p>
          <p className="mt-3">
            Dunamis Studios publishes its current list of Sub-processors at{" "}
            <Link href="/legal/subprocessors" className="underline">
              /legal/subprocessors
            </Link>{" "}
            and commits to thirty (30) days&rsquo; advance notice of new Sub-processors that
            will process Customer Personal Data, subject to the upstream asymmetry disclosed on
            that page.
          </p>
          <p className="mt-3">
            Dunamis Studios will assist Customer with data-subject requests as required by the
            DPA, notify Customer of any personal-data breach without undue delay and in any
            event within 48 hours of confirmed discovery (see DPA §9), and, on termination,
            delete or return Customer Data as described in{" "}
            <a className="underline" href={X("term")}>§13</a>.
          </p>
        </>
      ),
    },
    {
      n: "9",
      id: "m-confidentiality",
      title: "Confidentiality",
      body: (
        <>
          <p>
            Each party (the &ldquo;<strong>Receiving Party</strong>&rdquo;) may be exposed to
            non-public information of the other party (the &ldquo;<strong>Disclosing Party</strong>
            &rdquo;) that is marked or identified as confidential, or that a reasonable person
            would understand to be confidential given its nature and the circumstances of
            disclosure (&ldquo;<strong>Confidential Information</strong>&rdquo;). Confidential
            Information includes Customer Data, non-public business and technical information,
            pricing, and roadmap.
          </p>
          <p className="mt-3">
            The Receiving Party will: (a) protect the Confidential Information using at least
            the same degree of care it uses to protect its own confidential information of like
            importance, but in no event less than reasonable care; (b) use it only as necessary
            to exercise rights and perform obligations under this Agreement; and (c) limit
            access to personnel and contractors who need to know it and who are bound by
            confidentiality obligations at least as protective as this Section.
          </p>
          <p className="mt-3">
            Obligations of confidentiality continue for <strong>five (5) years</strong> after
            disclosure, except that obligations as to trade secrets continue for so long as the
            information qualifies as a trade secret under applicable law.
          </p>
          <p className="mt-3">
            Customary exceptions apply: information that is or becomes public without breach;
            was rightfully in the Receiving Party&rsquo;s possession without obligation of
            confidentiality; is independently developed without use of Confidential Information;
            or is rightfully obtained from a third party without restriction. Either party may
            disclose Confidential Information to the extent required by law or lawful process,
            provided that, where legally permitted, it gives the Disclosing Party prompt notice
            and reasonable cooperation to seek a protective order.
          </p>
        </>
      ),
    },
    {
      n: "10",
      id: "m-warranties",
      title: "Warranties and disclaimers",
      body: (
        <>
          <p>
            <strong>Limited service warranty.</strong> Dunamis Studios warrants that each
            Service will perform in material conformance with its Documentation during the
            subscription or license term. Customer&rsquo;s sole and exclusive remedy, and
            Dunamis Studios&rsquo;s entire liability, for breach of this warranty is, at
            Dunamis Studios&rsquo;s option, (a) re-performance of the non-conforming Service,
            or (b) refund of the pro-rated fees for the non-conformance period (for recurring
            subscriptions) or a pro-rated refund of the one-time fee (for one-time licenses,
            calculated based on the lesser of time remaining in the refund window or Dunamis
            Studios&rsquo;s reasonable determination of impaired use). This warranty is void to
            the extent non-conformance is caused by Customer&rsquo;s breach, third-party
            products, force majeure, or use outside the Documentation.
          </p>
          <div className={CALLOUT}>
            <p className="uppercase">
              Except for the limited service warranty above, the services are provided
              &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; Dunamis studios disclaims all
              warranties, express or implied, including implied warranties of merchantability,
              fitness for a particular purpose, title, non-infringement, and any warranty
              arising from course of dealing or usage of trade. Dunamis studios does not warrant
              that any service will be uninterrupted or error-free, that it will meet
              customer&rsquo;s requirements, or that defects will be corrected. Dunamis studios
              does not warrant that AI-generated outputs will be accurate, complete, reliable,
              non-infringing, or fit for any particular purpose.
            </p>
          </div>
        </>
      ),
    },
    {
      n: "11",
      id: "m-indemnification",
      title: "Indemnification",
      body: (
        <>
          <p>
            <strong>Customer indemnity.</strong> Customer will defend, indemnify, and hold
            harmless Dunamis Studios, Joshua Robert Bradford personally, and their respective
            affiliates, officers, employees, contractors, and agents from and against any
            third-party claim, action, proceeding, or demand, and all resulting damages, fines,
            judgments, settlements, and reasonable attorneys&rsquo; fees, arising out of or
            relating to: (a) Customer&rsquo;s Customer Data, including claims that such data
            was collected, used, or shared without legal basis or required consents; (b)
            Customer&rsquo;s breach of{" "}
            <a className="underline" href={X("customer-responsibilities")}>§4</a> or{" "}
            <a className="underline" href={X("aup")}>§6</a>, including any submission of
            sensitive data categories; (c) Customer&rsquo;s or its users&rsquo; reliance on or
            acting upon AI-generated Output without qualified human review; (d) Customer&rsquo;s
            combination of any Service with any product, service, data, or content not provided
            by Dunamis Studios; or (e) Customer&rsquo;s violation of applicable law.
          </p>
          <p className="mt-3">
            <strong>Dunamis IP indemnity (narrow).</strong> Dunamis Studios will defend Customer
            from and against any third-party claim that Customer&rsquo;s authorized use of a
            Service, strictly in accordance with this Agreement and the Documentation, infringes
            that third party&rsquo;s US patent, copyright, trademark, or trade secret, and will
            pay resulting damages finally awarded against Customer by a court of competent
            jurisdiction or a settlement Dunamis Studios agrees to in writing. This obligation
            does not apply to claims arising from or related to: (i) Customer Data, AI-generated
            Output, or any combination thereof; (ii) use of a Service after notice to
            discontinue; (iii) Customer&rsquo;s modifications or use not in accordance with the
            Documentation; (iv) combinations with non-Dunamis products, services, or data; or
            (v) Customer&rsquo;s specifications or instructions.{" "}
            <strong>AI-generated Output is expressly excluded from the Dunamis IP indemnity</strong>
            ; upstream Anthropic does not indemnify Dunamis Studios for Output IP claims at this
            tier, and Customer acknowledges that Dunamis Studios cannot offer an indemnity it
            does not itself hold.
          </p>
          <p className="mt-3">
            <strong>Dunamis options on an IP claim.</strong> If a Service, or any component, is
            or in Dunamis Studios&rsquo;s reasonable opinion is likely to become the subject of
            an IP claim, Dunamis Studios may, at its option and expense: (x) procure the right
            for Customer to continue using the Service; (y) modify the Service to be
            non-infringing while substantially preserving its functionality; or (z) terminate
            the affected subscription or license and refund any unused pre-paid fees for the
            period after termination (for recurring subscriptions) or a pro-rated refund of the
            one-time fee (for one-time licenses). The preceding options and the defense
            described in this Section state the entire liability of Dunamis Studios, and
            Customer&rsquo;s exclusive remedy, for IP infringement claims.
          </p>
          <p className="mt-3">
            <strong>Procedure.</strong> The indemnified party will promptly notify the
            indemnifying party of the claim, give the indemnifying party sole control of the
            defense and settlement (provided the settlement does not impose monetary obligations
            or admissions of liability on the indemnified party without its consent), and
            provide reasonable cooperation at the indemnifying party&rsquo;s expense.
          </p>
        </>
      ),
    },
    {
      n: "12",
      id: "m-liability",
      title: "Limitation of liability",
      body: (
        <>
          <div className={CALLOUT}>
            <p className="uppercase">
              To the maximum extent permitted by applicable law, neither party will be liable to
              the other for any indirect, incidental, consequential, special, exemplary, or
              punitive damages; loss of profits; loss of revenue; loss of data; loss of
              goodwill; or cost of procurement of substitute goods or services, arising out of
              or relating to this agreement or any service, whether in contract, tort (including
              negligence), strict liability, or otherwise, and whether or not the party has been
              advised of the possibility of such damages.
            </p>
            <p className="mt-3 uppercase">
              Each party&rsquo;s aggregate liability arising out of or relating to this
              agreement is capped at the greater of (a) US$500, or (b) the total fees paid by
              customer to dunamis studios for the applicable service in the twelve (12) months
              preceding the event giving rise to the liability (the &ldquo;general cap&rdquo;).
            </p>
            <p className="mt-3 uppercase">
              Notwithstanding the general cap, dunamis studios&rsquo;s aggregate liability for
              any claim arising out of or relating to inaccurate, incomplete, misleading, or
              fabricated AI-generated output is capped at the lesser of (a) the fees paid by
              customer in the three (3) months preceding the claim, or (b) US$500 (the &ldquo;AI
              output sub-cap&rdquo;). The AI output sub-cap is included within, and not in
              addition to, the general cap.
            </p>
          </div>
          <p className="mt-4">
            <strong>Carve-outs from the cap.</strong> The foregoing limits do not apply to: (i)
            a party&rsquo;s indemnification obligations under{" "}
            <a className="underline" href={X("indemnification")}>§11</a>; (ii) breach of{" "}
            <a className="underline" href={X("confidentiality")}>§9</a> (Confidentiality); (iii)
            Customer&rsquo;s failure to pay undisputed fees; (iv) Customer&rsquo;s breach of{" "}
            <a className="underline" href={X("aup")}>§6</a> (Acceptable Use Policy) or the
            sensitive-data prohibition in{" "}
            <a className="underline" href={X("customer-responsibilities")}>§4</a>; (v)
            infringement or misappropriation of the other party&rsquo;s intellectual property;
            or (vi) liability that, under Florida law or other applicable non-waivable law,
            cannot be limited or excluded, including liability for{" "}
            <strong>fraud, gross negligence, or willful misconduct</strong>, and liability for
            personal injury or death. For those carve-outs, liability is determined by
            applicable law without the above caps.
          </p>
          <p className="mt-3">
            <strong>Non-waivable consumer rights.</strong> Nothing in this Section limits any
            non-waivable right of a consumer under applicable law. Where a consumer law of a
            jurisdiction (including UK UCTA, EU consumer law, or a US state consumer-protection
            law) requires broader liability than stated above, that law governs to the minimum
            extent required.
          </p>
          <p className="mt-3">
            <strong>Basis of the bargain.</strong> Customer acknowledges that the limits and
            allocations of risk in this Agreement are fundamental elements of the bargain
            between the parties and a material inducement to Dunamis Studios to provide the
            Services at the fees charged.
          </p>
        </>
      ),
    },
    {
      n: "13",
      id: "m-term",
      title: "Term, termination, and effect of termination",
      body: (
        <>
          <p>
            <strong>Term.</strong> This Agreement begins when Customer first accepts it and
            continues until all subscriptions and licenses have expired or been terminated.
          </p>
          <p className="mt-3">
            <strong>Customer cancellation.</strong> For recurring subscriptions, Customer may
            cancel from the account dashboard at any time; the subscription remains active
            through the end of the current paid period. For one-time licenses, the license
            continues in perpetuity per HubSpot portal subject to this Agreement, but Customer
            may uninstall from HubSpot at any time. Refund terms are governed by the applicable
            Service addendum and <a className="underline" href={X("subscriptions")}>§5</a>.
          </p>
          <p className="mt-3">
            <strong>Termination by Dunamis Studios.</strong> Dunamis Studios may terminate this
            Agreement or any subscription or license: (a) for cause on{" "}
            <strong>fifteen (15) days&rsquo; notice</strong> of non-payment that remains uncured
            after the notice period; (b) for cause on{" "}
            <strong>thirty (30) days&rsquo; notice</strong> of any other material breach that
            remains uncured after the notice period; (c) for convenience on thirty (30)
            days&rsquo; notice, with a refund of any unused, pre-paid fees for the period after
            termination (for recurring subscriptions) or a reasonable pro-rated refund (for
            one-time licenses); or (d) <strong>immediately</strong> on notice for a violation
            of <a className="underline" href={X("aup")}>§6</a> (Acceptable Use Policy), for a
            security risk presented by Customer&rsquo;s use, or if required by Anthropic or any
            other Sub-processor or by law.
          </p>
          <p className="mt-3">
            <strong>Effect of termination &mdash; data.</strong> On termination or expiration,
            Customer has a <strong>thirty (30)-day export window</strong> during which Customer
            may export its data through the applicable Service&rsquo;s export tooling (where
            available). After the export window, Dunamis Studios will delete Customer Data from
            active production systems within sixty (60) days of termination; data residing in
            backups is deleted on its natural backup-rotation cycle (generally within 30&ndash;90
            days). Customer retains ownership of Output it has previously exported; those
            exports are outside the Service and are Customer&rsquo;s responsibility.
          </p>
          <p className="mt-3">
            <strong>Survival.</strong> The following Sections survive termination or expiration:{" "}
            <a className="underline" href={X("definitions")}>§2</a> (Definitions, as needed to
            interpret surviving Sections), <a className="underline" href={X("ai-output")}>§7</a>{" "}
            (AI Output, including the sub-cap),{" "}
            <a className="underline" href={X("confidentiality")}>§9</a> (Confidentiality),{" "}
            <a className="underline" href={X("warranties")}>§10</a> (Warranty disclaimer),{" "}
            <a className="underline" href={X("indemnification")}>§11</a> (Indemnification),{" "}
            <a className="underline" href={X("liability")}>§12</a> (Limitation of Liability),{" "}
            <a className="underline" href={X("governing-law")}>§15</a> (Governing Law and
            Disputes), <a className="underline" href={X("assignment")}>§16</a> (Assignment), and{" "}
            <a className="underline" href={X("general")}>§18</a> (General), along with any
            surviving provisions set forth in the applicable Service addendum.
          </p>
        </>
      ),
    },
    {
      n: "14",
      id: "m-hubspot",
      title: "HubSpot-specific terms",
      body: (
        <>
          <p>
            <strong>Non-affiliation.</strong> HubSpot&reg; is a registered trademark of HubSpot,
            Inc. The Services are independently developed and operated by Dunamis Studios and
            are not affiliated with, endorsed by, sponsored by, or certified by HubSpot, Inc.
          </p>
          <p className="mt-3">
            <strong>Customer HubSpot obligations.</strong> Customer agrees that its use of any
            Service, including the OAuth authorization Customer grants at install, will not
            cause Customer or Dunamis Studios to breach HubSpot&rsquo;s Customer Terms of
            Service, Acceptable Use Policy, or Data Processing Agreement. Customer will not use
            any Service in any industry or manner HubSpot has restricted or prohibited.
          </p>
          <p className="mt-3">
            <strong>OAuth authorization lifecycle.</strong> Customer&rsquo;s HubSpot Super Admin
            authorizes each Service via HubSpot OAuth at install and may revoke authorization at
            any time through the HubSpot Connected Apps interface. On uninstall or revocation,
            Dunamis Studios will treat the event as termination of the subscription or license
            for the affected portal and will follow the deletion process described in{" "}
            <a className="underline" href={X("term")}>§13</a>.
          </p>
        </>
      ),
    },
    {
      n: "15",
      id: "m-governing-law",
      title: "Governing law, dispute resolution, and arbitration",
      body: (
        <>
          <p>
            <strong>Governing law.</strong> This Agreement is governed by the laws of the{" "}
            <strong>State of Florida</strong>, United States, without regard to its
            conflict-of-laws principles. The United Nations Convention on Contracts for the
            International Sale of Goods does not apply.
          </p>
          <p className="mt-3">
            <strong>Informal dispute resolution (mandatory prerequisite).</strong> Before
            initiating arbitration or court proceedings, the party raising the dispute will send
            a written notice to the other party describing the claim in reasonable detail. The
            parties will then attempt in good faith, for at least{" "}
            <strong>thirty (30) days</strong>, to resolve the dispute through direct discussion
            between authorized representatives. Written notice to Dunamis Studios goes to{" "}
            <a href="mailto:legal@dunamisstudios.net" className="underline">
              legal@dunamisstudios.net
            </a>
            ; notice to Customer goes to the administrative contact on the account.
          </p>
          <p className="mt-3">
            <strong>Binding arbitration.</strong> Any dispute, claim, or controversy arising out
            of or relating to this Agreement or any Service that is not resolved through the
            informal process will be resolved by{" "}
            <strong>
              binding arbitration administered by the American Arbitration Association (AAA)
              under its Commercial Arbitration Rules
            </strong>
            . The seat and legal place of arbitration is{" "}
            <strong>Florida, United States</strong>. The arbitration will be conducted by one
            arbitrator selected in accordance with AAA rules. The arbitrator&rsquo;s award is
            final and binding, and judgment on the award may be entered in any court of
            competent jurisdiction.
          </p>
          <p className="mt-3">
            <strong>Class-action waiver.</strong> Each party agrees that disputes will be
            resolved individually, on a non-class, non-representative basis.{" "}
            <strong>
              Neither party will seek to have any dispute heard as a class action, collective
              action, or mass action, or to join or consolidate its claim with the claim of any
              other person.
            </strong>{" "}
            If this waiver is held unenforceable as to any particular claim, that claim will be
            severed and litigated in the courts identified below, while the balance of this
            Section continues to apply.
          </p>
          <p className="mt-3">
            <strong>Injunctive relief in court (carve-out).</strong> Notwithstanding the
            arbitration agreement, either party may seek injunctive or other equitable relief in
            a court of competent jurisdiction to prevent or enjoin actual or threatened
            infringement, misappropriation, or violation of intellectual property rights or
            breach of confidentiality obligations. The exclusive courts for such actions are the
            state and federal courts located in the State of Florida, and the parties consent to
            personal jurisdiction and venue in those courts.
          </p>
          <p className="mt-3">
            <strong>Contractual statute of limitations.</strong> Any claim or action arising out
            of or relating to this Agreement must be brought, whether in arbitration or in court
            (for the injunctive carve-out above), within <strong>one (1) year</strong> after the
            cause of action accrues. Claims not brought within that period are permanently
            barred.
          </p>
        </>
      ),
    },
    {
      n: "16",
      id: "m-assignment",
      title: "Assignment",
      body: (
        <>
          <p>
            Customer may not assign this Agreement or any of its rights or obligations under it,
            in whole or in part, by operation of law or otherwise, without Dunamis
            Studios&rsquo;s prior written consent. Any attempted assignment without that consent
            is void.
          </p>
          <p className="mt-3">
            <strong>Assignment by Company.</strong>{" "}
            <strong>
              Dunamis Studios (and Joshua Robert Bradford personally) may assign this Agreement,
              in whole or in part, without Customer&rsquo;s consent, to (a) an affiliate; (b) a
              successor entity formed by Company, including upon incorporation of Company as a
              limited liability company or corporation in any US state; or (c) any acquirer of
              all or substantially all of the assets, equity, or business relating to the
              Services.
            </strong>{" "}
            On any such assignment, Dunamis Studios will notify Customer by email, and the
            assignee will step into Dunamis Studios&rsquo;s rights and obligations going
            forward. Subject to the foregoing, this Agreement binds and benefits the parties and
            their permitted successors and assigns.
          </p>
        </>
      ),
    },
    {
      n: "17",
      id: "m-sla",
      title: "Service levels",
      body: (
        <>
          <p>
            Dunamis Studios uses commercially reasonable efforts to make each Service available
            and performant, but{" "}
            <strong>
              does not commit to any uptime percentage or service-level credit regime under this
              Agreement
            </strong>
            . Any formal service-level agreement (SLA) with uptime commitments or service
            credits must be executed in a separate, signed enterprise agreement.
          </p>
          <p className="mt-3">
            Any availability or performance commitment Dunamis Studios makes{" "}
            <strong>expressly excludes</strong> events and conditions outside its direct
            control, including outages, degradations, rate limits, or terms changes imposed by
            HubSpot, Anthropic, Vercel, Upstash, Stripe, Resend, or any other Sub-processor;
            internet, telecommunications, or utility failures; and Customer&rsquo;s systems or
            actions.
          </p>
        </>
      ),
    },
    {
      n: "18",
      id: "m-general",
      title: "General",
      body: (
        <>
          <p>
            <strong>Notices.</strong> Notices to Dunamis Studios must be sent to{" "}
            <a href="mailto:legal@dunamisstudios.net" className="underline">
              legal@dunamisstudios.net
            </a>{" "}
            with postal copy to Joshua Robert Bradford d/b/a Dunamis Studios, 2269 Twin Fox
            Trail, St. Augustine, FL 32086, United States. Notices to Customer may be sent to
            the administrative email on the account and are deemed given on transmission.
          </p>
          <p className="mt-3">
            <strong>Severability.</strong> If any provision of this Agreement is held invalid or
            unenforceable, the remaining provisions continue in full force, and the invalid
            provision will be modified to the minimum extent necessary to be enforceable while
            preserving the parties&rsquo; original intent.
          </p>
          <p className="mt-3">
            <strong>Entire agreement.</strong> This Agreement, together with the applicable
            Service addendum(a), the Privacy Policy, the DPA, the Sub-processors list, and any
            signed order forms, constitutes the entire agreement between the parties regarding
            the Services and supersedes any prior or contemporaneous communications. Pre-printed
            terms on a Customer-issued purchase order are rejected and have no effect.
          </p>
          <p className="mt-3">
            <strong>No waiver.</strong> A failure or delay in exercising any right is not a
            waiver of that right.
          </p>
          <p className="mt-3">
            <strong>Force majeure.</strong> Neither party is liable for any failure or delay in
            performance, other than the obligation to pay, caused by events beyond its
            reasonable control, including acts of God, war, terrorism, civil unrest, pandemics,
            labor disputes, governmental action, internet or telecommunications failures, and
            outages or terms changes imposed by HubSpot, Anthropic, Vercel, Upstash, Stripe,
            Resend, Amazon Web Services, Google Cloud, or any other underlying provider.
          </p>
          <p className="mt-3">
            <strong>Export control and sanctions.</strong> Customer will comply with all US
            export-control, sanctions, and anti-boycott laws, including those administered by
            OFAC and BIS. Customer represents it is not located in, under the control of, or a
            national or resident of any country or entity subject to comprehensive US sanctions.
          </p>
          <p className="mt-3">
            <strong>Relationship of the parties.</strong> The parties are independent
            contractors. This Agreement creates no partnership, joint venture, agency, or
            employment relationship.
          </p>
          <p className="mt-3">
            <strong>Headings.</strong> Section headings are for convenience and do not affect
            interpretation. References to &ldquo;including&rdquo; mean &ldquo;including without
            limitation.&rdquo;
          </p>
          <p className="mt-3">
            <strong>Updates to this Agreement.</strong> Dunamis Studios may update this
            Agreement from time to time. For material changes, Dunamis Studios will provide at
            least thirty (30) days&rsquo; email notice to the administrative contact; the
            updated Agreement takes effect on the stated effective date. If Customer does not
            agree to the update, Customer may cancel under{" "}
            <a className="underline" href={X("term")}>§13</a> before the effective date.
          </p>
        </>
      ),
    },
    {
      n: "19",
      id: "m-addenda",
      title: "Service addenda",
      body: (
        <>
          <p>
            Each Service is governed by a Service-specific addendum that sets forth the
            Service&rsquo;s description, pricing, refund terms, and any Service-specific
            data-handling, AI-use, or operational details. The following addenda are incorporated
            into and form part of this Agreement and are reproduced below on this page:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <a className="underline" href="#addendum-debrief">
                Debrief Service Addendum
              </a>
            </li>
            <li>
              <a className="underline" href="#addendum-property-pulse">
                Property Pulse Service Addendum
              </a>
            </li>
          </ul>
          <p className="mt-3">
            Where an addendum conflicts with this master Agreement, the addendum controls as to
            the specific Service it covers. Additional addenda may be added for new Services
            without requiring re-acceptance of this master Agreement; Customer is bound by an
            addendum only for Services it installs or uses.
          </p>
        </>
      ),
    },
  ],
};
