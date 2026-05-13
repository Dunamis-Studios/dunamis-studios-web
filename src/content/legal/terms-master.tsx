import Link from "next/link";
import { LEGAL_METADATA } from "./metadata";
import type { LegalDocument } from "./types";

const CALLOUT =
  "mt-4 rounded-md border border-[var(--fg-subtle)]/40 bg-[color-mix(in_oklch,var(--fg)_4%,transparent)] px-4 py-4 text-sm";

const X = (id: string) => `#m-${id}`;

export const termsMaster: LegalDocument = {
  ...LEGAL_METADATA.termsMaster,
  idPrefix: "m-",
  sections: [
    {
      n: "1",
      id: "m-acceptance",
      title: "Acceptance and contracting party",
      body: (
        <>
          <p>
            These Terms of Sale (this &ldquo;<strong>Agreement</strong>&rdquo;) govern your
            purchase and use of products and services offered by{" "}
            <strong>Joshua Robert Bradford</strong>, an individual resident of the State of
            Florida, United States, doing business under the name{" "}
            <strong>Dunamis Studios</strong> (&ldquo;<strong>Company</strong>,&rdquo;{" "}
            &ldquo;<strong>Dunamis Studios</strong>,&rdquo; &ldquo;<strong>we</strong>,&rdquo;{" "}
            &ldquo;<strong>us</strong>,&rdquo; or &ldquo;<strong>our</strong>&rdquo;),
            including the dunamisstudios.com website, the Dunamis Studios account system, all
            software products and services sold or distributed by Dunamis Studios, and any
            related APIs or documentation (each a &ldquo;<strong>Product</strong>&rdquo; and
            collectively the &ldquo;<strong>Products</strong>&rdquo;).
          </p>
          <p className="mt-3">
            This Agreement is the master Terms of Sale and applies to every Product. Each
            Product also has a product-specific addendum that sets out terms unique to that
            Product. The current set of addendums is listed in{" "}
            <a className="underline" href={X("addenda")}>§20</a> and at the top of the{" "}
            <Link href="/terms" className="underline">
              /terms
            </Link>{" "}
            page. Where an addendum addresses a topic, the addendum controls for the Product
            it covers; on all other topics the master Terms of Sale govern.
          </p>
          <p className="mt-3">
            By clicking &ldquo;I agree,&rdquo; creating an account, purchasing, installing,
            activating, or using a Product, you agree to this Agreement, the applicable
            Product addendum, the{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            , the{" "}
            <Link href="/refund-policy" className="underline">
              Refund Policy
            </Link>
            , and (where applicable) the{" "}
            <Link href="/legal/dpa" className="underline">
              Data Processing Addendum
            </Link>
            , each of which is incorporated by reference. If you are entering this Agreement
            on behalf of an entity, you represent that you have authority to bind that entity
            and &ldquo;<strong>Customer</strong>&rdquo; or &ldquo;<strong>you</strong>&rdquo;
            refers to that entity. If you do not have authority, or if you do not agree, do
            not purchase or use the Products.
          </p>
          <div className={CALLOUT}>
            <p>
              <strong>Draft, not final.</strong> This document is in draft form pending review
              by outside counsel. It reflects Dunamis Studios&rsquo; intended commercial
              terms and is published for transparency, but is not yet finalized legal copy.
              The version currently in effect for any executed transaction is the version
              displayed on the date of that transaction.
            </p>
          </div>
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
            &ldquo;<strong>Addendum</strong>&rdquo; means a product-specific terms document
            that supplements this Agreement for a particular Product, including those listed
            at <a className="underline" href={X("addenda")}>§20</a>.
          </li>
          <li>
            &ldquo;<strong>Customer Data</strong>&rdquo; means the data, including personal
            data, that Customer or its end users cause to be transmitted into, stored within,
            or processed by a Product. Customer Data does not include data Dunamis Studios
            generates about Customer&rsquo;s use of the Products for billing, security, or
            operational purposes.
          </li>
          <li>
            &ldquo;<strong>Documentation</strong>&rdquo; means the user-facing product
            documentation published at{" "}
            <Link href="/help" className="underline">
              dunamisstudios.com/help
            </Link>{" "}
            and any product-specific docs linked from a Product&rsquo;s landing page.
          </li>
          <li>
            &ldquo;<strong>EULA</strong>&rdquo; means an end-user license agreement that a
            given Product presents on first use, install, or activation. The EULA is a
            standalone agreement governing the licensed use of the software for that Product
            and is in addition to this Agreement and the applicable Addendum.
          </li>
          <li>
            &ldquo;<strong>Order</strong>&rdquo; means a purchase, subscription start, or
            license activation completed through the Dunamis Studios website, an authorized
            reseller, or another sales channel approved by Dunamis Studios.
          </li>
          <li>
            &ldquo;<strong>Output</strong>&rdquo; means content generated by a Product in
            response to Customer input, including, where the applicable Product uses
            artificial intelligence, content returned by an upstream AI Sub-processor.
          </li>
          <li>
            &ldquo;<strong>Sub-processor</strong>&rdquo; means a third party engaged by
            Dunamis Studios to process Customer Data on its behalf in connection with the
            Products. The current list of Sub-processors is published at{" "}
            <Link href="/legal/subprocessors" className="underline">
              /legal/subprocessors
            </Link>
            .
          </li>
        </ul>
      ),
    },
    {
      n: "3",
      id: "m-account",
      title: "Account registration and access",
      body: (
        <>
          <p>
            Some Products require a Dunamis Studios account. Customer agrees to provide
            accurate registration information, to keep it current, and to safeguard account
            credentials. Customer is responsible for all activity that occurs under its
            account, whether or not authorized.
          </p>
          <p className="mt-3">
            Customer may delete its account at{" "}
            <Link href="/account" className="underline">
              dunamisstudios.com/account
            </Link>{" "}
            at any time. Account deletion ends Customer&rsquo;s access to active
            subscriptions, terminates the right to use unactivated license keys still tied to
            the account, and triggers the data-deletion process described in the Privacy
            Policy. Account deletion does not, by itself, constitute a refund request; see{" "}
            <a className="underline" href={X("refunds")}>§15</a>.
          </p>
          <p className="mt-3">
            Dunamis Studios sends transactional email related to Orders, licenses, security,
            and account changes regardless of marketing preferences. Customer may opt out of
            marketing email at any time through the unsubscribe link in each marketing
            message or by emailing{" "}
            <a className="underline" href="mailto:support@dunamisstudios.net">
              support@dunamisstudios.net
            </a>
            .
          </p>
        </>
      ),
    },
    {
      n: "4",
      id: "m-services",
      title: "Products and license framework",
      body: (
        <>
          <p>
            Dunamis Studios offers Products in two general shapes:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Software licenses.</strong> Dunamis Studios grants Customer a limited,
              non-exclusive, non-transferable, non-sublicensable license to install and use
              the licensed software in accordance with the applicable EULA, the applicable
              Addendum, and this Agreement. The scope, duration, and device or seat limits
              of each license are set in the applicable Addendum and EULA.
            </li>
            <li>
              <strong>Hosted services.</strong> Dunamis Studios provides Customer access to
              the hosted Service for the subscription term or one-time access term set in
              the applicable Order and Addendum, subject to this Agreement.
            </li>
          </ul>
          <p className="mt-3">
            All right, title, and interest in and to the Products, including the software,
            the Documentation, the dunamisstudios.com website, and all associated
            intellectual property, remain with Dunamis Studios and its licensors. The
            applicable Addendum or a separately executed Statement of Work may grant
            additional rights in deliverables produced for Customer; absent such an express
            grant, no Product transfers ownership of intellectual property to Customer.
          </p>
          <p className="mt-3">
            Activation of a software license constitutes Customer&rsquo;s acceptance of the
            EULA for that Product. The EULA, the applicable Addendum, and this Agreement
            apply together; see <a className="underline" href={X("misc")}>§21</a> for order
            of precedence.
          </p>
        </>
      ),
    },
    {
      n: "5",
      id: "m-subscriptions",
      title: "Fees, taxes, and payment",
      body: (
        <>
          <p>
            Customer pays fees for the Products in the amounts and at the cadence stated on
            the applicable Product page, in the Order, and in the applicable Addendum. Fees
            are quoted in United States dollars unless otherwise stated.
          </p>
          <p className="mt-3">
            <strong>Payment processor.</strong> Dunamis Studios uses Stripe, Inc. as its
            payment processor. By providing payment information, Customer authorizes Dunamis
            Studios and Stripe to charge the payment method for amounts due. Dunamis Studios
            does not receive or store full payment card numbers; card-data handling is
            performed by Stripe under its own terms and PCI obligations.
          </p>
          <p className="mt-3">
            <strong>Subscriptions.</strong> Subscription Products renew automatically at the
            end of each billing period at the then-current price for the applicable tier
            until canceled. Customer may cancel at{" "}
            <Link href="/account" className="underline">
              dunamisstudios.com/account
            </Link>{" "}
            at any time; cancellation takes effect at the end of the current billing period.
            Mid-cycle cancellations do not generate pro-rata refunds for the remainder of
            the period unless the applicable Addendum states otherwise or applicable law
            requires it.
          </p>
          <p className="mt-3">
            <strong>One-time fees.</strong> One-time license purchases are billed in full at
            checkout. Refund eligibility is governed by{" "}
            <a className="underline" href={X("refunds")}>§15</a> and the applicable Addendum.
          </p>
          <p className="mt-3">
            <strong>Taxes.</strong> Fees are exclusive of taxes. Customer is responsible for
            all sales, use, value-added, goods-and-services, withholding, and similar taxes
            imposed on Customer&rsquo;s purchase or use of a Product, other than taxes based
            on Dunamis Studios&rsquo;s net income. Where Dunamis Studios is required by law
            to collect a tax, Dunamis Studios will add the tax to the invoice and remit it
            to the appropriate authority.
          </p>
          <p className="mt-3">
            <strong>Price changes.</strong> Dunamis Studios may change subscription prices
            on at least thirty (30) days&rsquo; prior notice to the email address on file.
            Price changes take effect on the next renewal that begins after the notice
            period. Customer&rsquo;s continued use after the effective date constitutes
            acceptance of the new price. Customer may cancel before the effective date to
            avoid the new price.
          </p>
          <p className="mt-3">
            <strong>Failed payments.</strong> If a charge is declined, Dunamis Studios may
            retry the charge, suspend access to the Product, and, after reasonable notice,
            terminate the subscription or license under{" "}
            <a className="underline" href={X("term")}>§13</a>.
          </p>
        </>
      ),
    },
    {
      n: "6",
      id: "m-aup",
      title: "Acceptable use",
      body: (
        <>
          <p>
            Customer will use the Products in compliance with this Agreement, the applicable
            Addendum, the applicable EULA, the Documentation, and all applicable laws.
          </p>
          <p className="mt-3">
            <strong>Sub-processor flow-through.</strong> Where a Product transmits data to a
            Sub-processor, that Sub-processor&rsquo;s acceptable-use policy is incorporated
            into this Agreement by reference. Customer will comply with each such policy as
            if Customer were a direct customer of the Sub-processor. The applicable Addendum
            identifies which Sub-processors a Product uses.
          </p>
          <p className="mt-3">
            Customer will not, and will not permit its users or third parties to:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              use a Product for an unlawful purpose, or to infringe or misappropriate the
              intellectual property, privacy, publicity, or other rights of another person;
            </li>
            <li>
              reverse engineer, decompile, disassemble, or otherwise attempt to derive the
              source code, model weights, prompts, or underlying components of a Product,
              except to the extent permitted by non-waivable law;
            </li>
            <li>
              share credentials, resell, sublicense, or provide a Product to a third party
              on a service-bureau basis, except as expressly permitted by an applicable
              Addendum or a separately executed agreement with Dunamis Studios;
            </li>
            <li>
              use a Product in a way that imposes an unreasonable or disproportionately
              large load on Product or Sub-processor infrastructure, or that interferes with
              or disrupts Product integrity or performance;
            </li>
            <li>
              use Output or data obtained from a Product to develop, train, fine-tune, or
              improve an artificial-intelligence or machine-learning model that competes
              with the Products;
            </li>
            <li>
              remove, obscure, or alter proprietary notices in the Products or the
              Documentation.
            </li>
          </ul>
          <p className="mt-3">
            Dunamis Studios may investigate suspected violations and may suspend the
            affected account or instance pending investigation, with notice where
            practicable. Material or repeated violations are grounds for termination under{" "}
            <a className="underline" href={X("term")}>§13</a>.
          </p>
        </>
      ),
    },
    {
      n: "7",
      id: "m-ai-output",
      title: "AI Output framework",
      body: (
        <>
          <p>
            Where a Product uses artificial intelligence to generate Output, the following
            framework applies. The applicable Addendum identifies which Products use AI and
            which upstream Sub-processor they transmit data to.
          </p>
          <p className="mt-3">
            <strong>Nature of AI Output.</strong> AI Output is probabilistic and may be
            inaccurate, incomplete, or otherwise unsuitable for a particular purpose.
            Customer is responsible for reviewing AI Output before relying on it, for the
            decisions Customer makes based on AI Output, and for any action taken on AI
            Output that has legal, financial, safety, or operational consequences.
          </p>
          <p className="mt-3">
            <strong>No warranty.</strong> Dunamis Studios makes no warranty that AI Output
            will be accurate, complete, current, free of bias, or suitable for a particular
            purpose. The disclaimers in{" "}
            <a className="underline" href={X("warranties")}>§10</a> apply with full force to
            AI Output. The sub-cap on AI-Output liability in{" "}
            <a className="underline" href={X("liability")}>§12</a> applies to all claims
            arising out of or relating to AI Output.
          </p>
          <p className="mt-3">
            <strong>Ownership of Output.</strong> As between Customer and Dunamis Studios,
            Customer owns the Output generated for Customer&rsquo;s account, subject to (i)
            the rights of the upstream AI Sub-processor and the limits in its terms, and
            (ii) Dunamis Studios&rsquo;s retained rights in the Products themselves.
          </p>
        </>
      ),
    },
    {
      n: "8",
      id: "m-customer-data",
      title: "Customer Data",
      body: (
        <>
          <p>
            As between the parties, Customer owns the Customer Data. Customer grants Dunamis
            Studios a worldwide, non-exclusive, royalty-free license to host, process,
            transmit, display, and otherwise use the Customer Data solely to provide the
            Products to Customer, to maintain and improve the Products, to comply with law,
            and to enforce this Agreement.
          </p>
          <p className="mt-3">
            Customer represents and warrants that it has the legal right to provide the
            Customer Data to Dunamis Studios, that the Customer Data does not infringe or
            violate third-party rights, and that Customer has obtained the consents or
            provided the notices required by applicable privacy law in connection with the
            Customer Data.
          </p>
          <p className="mt-3">
            Where Dunamis Studios processes personal data on behalf of Customer, the{" "}
            <Link href="/legal/dpa" className="underline">
              Data Processing Addendum
            </Link>{" "}
            governs that processing. Customer Data handling, retention, and the rights of
            data subjects are described in the{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </>
      ),
    },
    {
      n: "9",
      id: "m-ip",
      title: "Intellectual property",
      body: (
        <>
          <p>
            Dunamis Studios and its licensors retain all right, title, and interest in and
            to the Products and all intellectual property in the Products, including
            software, source code, models, prompts, Documentation, marks, trade dress, and
            improvements to the Products. No Product grants Customer ownership of Dunamis
            Studios intellectual property. Customer is granted only the licenses expressly
            stated in this Agreement, the applicable Addendum, and the applicable EULA.
          </p>
          <p className="mt-3">
            Customer may submit feedback, suggestions, ideas, and requests regarding the
            Products. Dunamis Studios may use, disclose, reproduce, and exploit feedback
            without restriction or compensation, provided that the feedback is not used in a
            way that identifies Customer as the source without Customer&rsquo;s consent.
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
            <strong>Limited warranty.</strong> Dunamis Studios warrants that during the
            applicable warranty window stated in the applicable Addendum (or, if no window
            is stated, for thirty (30) days from the date of first activation or first
            access for the relevant Product), the Product will perform materially in
            accordance with its Documentation. Customer&rsquo;s sole and exclusive remedy
            for breach of this warranty is, at Dunamis Studios&rsquo;s option, (i) repair,
            (ii) replacement, or (iii) refund of the fees paid for the Product in the
            twelve (12) months preceding the claim, with prorated calculation for
            subscription Products. The warranty does not apply to issues caused by
            unauthorized modifications, use contrary to the Documentation, or Customer or
            third-party infrastructure.
          </p>
          <p className="mt-3">
            <strong>Disclaimer.</strong> Except for the limited warranty above, and to the
            maximum extent permitted by law, the Products are provided &ldquo;as is&rdquo;
            and &ldquo;as available&rdquo; without warranty of every kind, whether express,
            implied, or statutory, including the implied warranties of merchantability,
            fitness for a particular purpose, title, accuracy, and non-infringement.
            Dunamis Studios does not warrant that the Products will be uninterrupted,
            error-free, or secure, or that defects will be corrected.
          </p>
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
            <strong>By Dunamis Studios.</strong> Dunamis Studios will defend Customer
            against a third-party claim alleging that Customer&rsquo;s authorized use of a
            Product, as delivered by Dunamis Studios and in accordance with this Agreement,
            infringes the third party&rsquo;s United States patent, copyright, or registered
            trademark, and will pay damages and costs finally awarded against Customer (or
            agreed in settlement by Dunamis Studios) on such a claim. Dunamis Studios has
            no obligation under this paragraph to the extent the claim arises from (i)
            modification of the Product not made by Dunamis Studios, (ii) combination of
            the Product with non-Dunamis-Studios material where the claim would not have
            arisen without the combination, (iii) use of a non-current version after
            Dunamis Studios has made a non-infringing update available, or (iv) Customer
            Data.
          </p>
          <p className="mt-3">
            <strong>By Customer.</strong> Customer will defend Dunamis Studios against a
            third-party claim arising out of (i) Customer Data, (ii) Customer&rsquo;s use
            of a Product in violation of this Agreement, the applicable Addendum, the
            applicable EULA, or applicable law, or (iii) the combination of a Product with
            Customer or third-party systems not provided by Dunamis Studios, and will pay
            damages and costs finally awarded against Dunamis Studios (or agreed in
            settlement by Customer) on such a claim.
          </p>
          <p className="mt-3">
            <strong>Procedure.</strong> The indemnified party will give the indemnifying
            party prompt written notice of the claim, sole control of the defense and
            settlement (provided that no settlement that imposes liability or obligation on
            the indemnified party may be entered without its written consent, not to be
            unreasonably withheld), and reasonable cooperation at the indemnifying
            party&rsquo;s expense. This{" "}
            <a className="underline" href={X("indemnification")}>§11</a> states the
            indemnifying party&rsquo;s sole liability, and the indemnified party&rsquo;s
            exclusive remedy, for the claims described in this Section.
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
          <p>
            <strong>Exclusion of indirect damages.</strong> To the maximum extent permitted
            by law, neither party will be liable to the other for indirect, incidental,
            consequential, special, exemplary, or punitive damages, or for loss of profits,
            revenue, business, goodwill, data, or substitute goods or services, arising out
            of or relating to this Agreement or the Products, even if advised of the
            possibility of such damages.
          </p>
          <p className="mt-3">
            <strong>Cap.</strong> Except for amounts owed under{" "}
            <a className="underline" href={X("indemnification")}>§11</a> and Customer&rsquo;s
            payment obligations, each party&rsquo;s aggregate liability arising out of or
            relating to this Agreement and the Products will not exceed the fees paid by
            Customer to Dunamis Studios for the affected Product in the twelve (12) months
            preceding the event giving rise to the claim. For Products sold for a one-time
            license fee, the cap is the amount paid for that license.
          </p>
          <p className="mt-3">
            <strong>AI Output sub-cap.</strong> For claims arising out of or relating to AI
            Output (as described in{" "}
            <a className="underline" href={X("ai-output")}>§7</a>), Dunamis Studios&rsquo;s
            aggregate liability will not exceed the lesser of (i) the cap in the preceding
            paragraph, or (ii) the fees paid by Customer to Dunamis Studios in the three
            (3) months preceding the event giving rise to the claim for the Product that
            generated the affected AI Output.
          </p>
          <p className="mt-3">
            <strong>Carve-outs.</strong> Nothing in this{" "}
            <a className="underline" href={X("liability")}>§12</a> limits a party&rsquo;s
            liability for (a) death or personal injury caused by negligence, (b) fraud or
            fraudulent misrepresentation, (c) gross negligence or willful misconduct, or
            (d) liability that cannot be limited or excluded under applicable law.
          </p>
        </>
      ),
    },
    {
      n: "13",
      id: "m-term",
      title: "Term and termination",
      body: (
        <>
          <p>
            This Agreement starts when Customer first accepts it (whether by purchase,
            account creation, license activation, or use of a Product) and continues until
            terminated as set out in this Section.
          </p>
          <p className="mt-3">
            <strong>Termination for convenience.</strong> Customer may stop using the
            Products at any time by canceling subscriptions, deleting the account, and
            uninstalling licensed software. Customer&rsquo;s refund eligibility is governed
            by <a className="underline" href={X("refunds")}>§15</a> and the applicable
            Addendum.
          </p>
          <p className="mt-3">
            <strong>Termination for cause.</strong> Either party may terminate this
            Agreement on written notice if the other party materially breaches and fails to
            cure the breach within thirty (30) days of written notice of the breach (or
            immediately, in the case of a breach incapable of cure, including a breach of{" "}
            <a className="underline" href={X("aup")}>§6</a>,{" "}
            <a className="underline" href={X("customer-data")}>§8</a>, or{" "}
            <a className="underline" href={X("confidentiality")}>§14</a>).
          </p>
          <p className="mt-3">
            <strong>Effect of termination.</strong> On termination, Customer&rsquo;s right
            to use the Products ends. Each party will return or destroy the other&rsquo;s
            Confidential Information. Dunamis Studios will follow the data-deletion process
            described in the Privacy Policy, subject to retention required by law. Sections
            that by their nature survive termination (including warranties given as to past
            performance, indemnification, limitation of liability, governing law, and the
            general provisions in{" "}
            <a className="underline" href={X("misc")}>§21</a>) will survive.
          </p>
        </>
      ),
    },
    {
      n: "14",
      id: "m-confidentiality",
      title: "Confidentiality",
      body: (
        <>
          <p>
            &ldquo;<strong>Confidential Information</strong>&rdquo; means non-public
            information disclosed by one party (&ldquo;<strong>Discloser</strong>&rdquo;) to
            the other (&ldquo;<strong>Recipient</strong>&rdquo;) that is identified as
            confidential or that would reasonably be considered confidential under the
            circumstances. Customer Data is Customer&rsquo;s Confidential Information. The
            Products, the Documentation, and Dunamis Studios&rsquo;s non-public technical,
            business, and security information are Dunamis Studios&rsquo;s Confidential
            Information.
          </p>
          <p className="mt-3">
            Recipient will protect Discloser&rsquo;s Confidential Information using at
            least the same care it uses for its own confidential information of like
            importance (and no less than reasonable care), will use Confidential
            Information only as needed to perform under this Agreement, and will limit
            access to those of its personnel and contractors who need access and who are
            bound by written confidentiality obligations at least as protective as those in
            this Section.
          </p>
          <p className="mt-3">
            Confidential Information does not include information that (i) is or becomes
            generally available without Recipient&rsquo;s breach, (ii) was rightfully in
            Recipient&rsquo;s possession without confidentiality obligation before
            disclosure, (iii) is independently developed by Recipient without use of
            Discloser&rsquo;s Confidential Information, or (iv) is rightfully obtained by
            Recipient from a third party without confidentiality obligation. Recipient may
            disclose Confidential Information to the extent required by law or legal
            process, provided that Recipient gives Discloser prompt written notice (where
            legally permitted) and reasonable cooperation in seeking a protective order.
          </p>
        </>
      ),
    },
    {
      n: "15",
      id: "m-refunds",
      title: "Refunds",
      body: (
        <>
          <p>
            The general refund framework is described at{" "}
            <Link href="/refund-policy" className="underline">
              dunamisstudios.com/refund-policy
            </Link>
            . Product-specific refund windows, conditions, and exceptions are set in the
            applicable Addendum and on the product-specific refund-policy page at{" "}
            <Link href="/refund-policy" className="underline">
              /refund-policy/{"{product}"}
            </Link>
            . Where an Addendum or product-specific refund page states a window or
            condition, that statement controls for the affected Product.
          </p>
          <p className="mt-3">
            Refunds are issued to the original payment method through Stripe. Customer
            agrees to contact Dunamis Studios at{" "}
            <a className="underline" href="mailto:support@dunamisstudios.net">
              support@dunamisstudios.net
            </a>{" "}
            before initiating a chargeback with its card issuer. See{" "}
            <Link href="/refund-policy#chargebacks" className="underline">
              the Refund Policy
            </Link>{" "}
            for the chargeback discussion.
          </p>
          <p className="mt-3">
            Nothing in this Section limits rights Customer has under applicable consumer
            law that cannot be waived by contract.
          </p>
        </>
      ),
    },
    {
      n: "16",
      id: "m-export",
      title: "Export controls and sanctions",
      body: (
        <>
          <p>
            The Products are subject to United States export control laws and regulations,
            including the Export Administration Regulations administered by the U.S.
            Department of Commerce, and to economic sanctions programs administered by the
            U.S. Department of the Treasury Office of Foreign Assets Control. Dunamis
            Studios&rsquo;s desktop software, where it includes mass-market encryption,
            qualifies under ECCN 5D002.c.1 and is exported under license exception ENC as
            mass-market software.
          </p>
          <p className="mt-3">
            Customer represents and warrants that Customer is not located in, organized
            under the laws of, or ordinarily resident in a country or territory subject to
            comprehensive U.S. sanctions (currently Cuba, Iran, North Korea, Syria, and the
            Crimea, Donetsk, Luhansk, Kherson, and Zaporizhzhia regions of Ukraine), is not
            on the U.S. Department of Treasury Specially Designated Nationals list, the
            U.S. Department of Commerce Denied Persons or Entity list, or another United
            States or applicable government restricted-party list, and will not export,
            re-export, or transfer the Products to a person or destination prohibited by
            United States law.
          </p>
          <p className="mt-3">
            Customer will comply with all applicable export control and sanctions laws in
            connection with the Products, including any obligation to obtain a license or
            other authorization before export or transfer.
          </p>
        </>
      ),
    },
    {
      n: "17",
      id: "m-ucita",
      title: "UCITA inapplicability",
      body: (
        <p>
          The Uniform Computer Information Transactions Act, as enacted in any United
          States jurisdiction, does not apply to this Agreement. Florida has not adopted
          UCITA, and the parties expressly opt out of UCITA in every jurisdiction where
          opting out is permitted.
        </p>
      ),
    },
    {
      n: "18",
      id: "m-sla",
      title: "No service-level commitment",
      body: (
        <p>
          Unless an Addendum expressly provides a service-level agreement for the
          applicable Product, Dunamis Studios provides the Products on commercially
          reasonable efforts. No uptime guarantee, service credits, or failover
          arrangements apply. Product performance may depend on Sub-processor availability
          and response times, which are outside Dunamis Studios&rsquo;s control.
        </p>
      ),
    },
    {
      n: "19",
      id: "m-disputes",
      title: "Governing law and dispute resolution",
      body: (
        <>
          <p>
            <strong>Governing law.</strong> This Agreement and the Products are governed
            by the laws of the State of Florida, United States, without regard to its
            conflict-of-laws principles. The United Nations Convention on Contracts for the
            International Sale of Goods does not apply.
          </p>
          <p className="mt-3">
            <strong>FDUTPA pre-suit notice.</strong> Before bringing a claim under the
            Florida Deceptive and Unfair Trade Practices Act (Fla. Stat. §501.201 et seq.)
            against Dunamis Studios, Customer will deliver written notice describing the
            alleged conduct and the relief sought to{" "}
            <a className="underline" href="mailto:legal@dunamisstudios.net">
              legal@dunamisstudios.net
            </a>{" "}
            and will allow Dunamis Studios thirty (30) days to respond and, where
            appropriate, cure or settle.
          </p>
          <p className="mt-3">
            <strong>Arbitration.</strong> Except for the carve-outs below, every dispute,
            claim, or controversy arising out of or relating to this Agreement, the
            Products, or the relationship between the parties (each a &ldquo;
            <strong>Dispute</strong>&rdquo;) will be resolved by binding individual
            arbitration administered by the American Arbitration Association under its
            Consumer Arbitration Rules (for individuals) or its Commercial Arbitration
            Rules (for entities), as applicable, by a single arbitrator. The seat of
            arbitration is Hillsborough County, Florida. The arbitrator may proceed by
            written submission for claims under US$25,000. The arbitrator may award the
            same remedies a court could award on an individual basis. Judgment on the award
            may be entered in a court of competent jurisdiction.
          </p>
          <p className="mt-3">
            <strong>Class action waiver.</strong> Each party may bring claims against the
            other only in its individual capacity, and not as a plaintiff or class member
            in a purported class, collective, representative, multi-plaintiff, or similar
            proceeding. The arbitrator may not consolidate more than one person&rsquo;s
            claims, may not preside over a representative or class proceeding, and may not
            award class, collective, or representative relief. If a court determines this
            waiver is unenforceable in a given Dispute, the arbitration provision is
            severed for that Dispute and the Dispute will be resolved in court under the
            Carve-out paragraph below.
          </p>
          <p className="mt-3">
            <strong>Federal Arbitration Act.</strong> The arbitration provision is
            governed by the Federal Arbitration Act, 9 U.S.C. §§1 et seq., and evidences a
            transaction involving interstate commerce. The arbitrator, not a court,
            decides threshold questions of arbitrability, except questions about the
            enforceability of the class-action waiver, which a court decides.
          </p>
          <p className="mt-3">
            <strong>Carve-out.</strong> Either party may bring an individual action in
            small-claims court for a Dispute within that court&rsquo;s jurisdiction in lieu
            of arbitration, and either party may seek injunctive or other equitable relief
            in a court of competent jurisdiction to protect its intellectual property or
            Confidential Information. Disputes excluded from arbitration are subject to the
            exclusive jurisdiction of the state and federal courts located in Hillsborough
            County, Florida, and the parties consent to personal jurisdiction in those
            courts.
          </p>
          <p className="mt-3">
            <strong>Thirty-day opt-out.</strong> Customer may opt out of the arbitration
            provision and class-action waiver by sending written notice to{" "}
            <a className="underline" href="mailto:legal@dunamisstudios.net">
              legal@dunamisstudios.net
            </a>{" "}
            within thirty (30) days of first accepting this Agreement. The opt-out notice
            must include Customer&rsquo;s name, the email address on Customer&rsquo;s
            Dunamis Studios account, and a clear statement that Customer wants to opt out
            of arbitration. An opt-out does not affect the remaining provisions of this
            Agreement.
          </p>
        </>
      ),
    },
    {
      n: "20",
      id: "m-addenda",
      title: "Product addendums",
      body: (
        <>
          <p>
            The following product-specific addendums are incorporated into this Agreement
            and apply to the corresponding Products:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <Link href="/terms/atelier" className="underline">
                Atelier Terms Addendum
              </Link>{" "}
              &mdash; Atelier desktop software.
            </li>
            <li>
              <Link href="/terms/debrief" className="underline">
                Debrief Service Addendum
              </Link>{" "}
              &mdash; Debrief HubSpot application.
            </li>
            <li>
              <Link href="/terms/property-pulse" className="underline">
                Property Pulse Service Addendum
              </Link>{" "}
              &mdash; Property Pulse HubSpot application.
            </li>
          </ul>
          <p className="mt-3">
            Where a Product is added to the Dunamis Studios catalog after this Agreement
            takes effect, the Addendum for that Product is incorporated upon its
            publication at the corresponding /terms route. The current authoritative list
            of Addendums appears at the top of the{" "}
            <Link href="/terms" className="underline">
              /terms
            </Link>{" "}
            page.
          </p>
        </>
      ),
    },
    {
      n: "21",
      id: "m-misc",
      title: "General provisions",
      body: (
        <>
          <p>
            <strong>Order of precedence.</strong> In a conflict among the documents that
            make up the contract between Customer and Dunamis Studios, precedence runs
            (highest to lowest): a separately executed agreement signed by both parties
            (such as a Master Services Agreement or Statement of Work), then the applicable
            EULA for the affected Product, then the applicable Addendum for the affected
            Product, then this master Terms of Sale, then the Documentation. Each tier
            controls only on the topic it specifically addresses; on other topics the next
            tier governs.
          </p>
          <p className="mt-3">
            <strong>Entire agreement.</strong> This Agreement, the applicable Addendum, the
            applicable EULA, the Privacy Policy, the Refund Policy, the Data Processing
            Addendum where applicable, and any Order or signed agreement constitute the
            entire agreement between the parties regarding the Products and supersede prior
            or contemporaneous proposals, communications, and understandings on the same
            subject.
          </p>
          <p className="mt-3">
            <strong>Changes to this Agreement.</strong> Dunamis Studios may update this
            Agreement from time to time. Material changes will be announced by email to
            account holders, by an in-product notice, or by a notice on the dunamisstudios.com
            website at least thirty (30) days before they take effect. Continued use of the
            Products after the effective date constitutes acceptance of the updated terms.
            If Customer objects to a material change, Customer may stop using the Products
            and (where eligible) request a refund under the then-current Refund Policy.
          </p>
          <p className="mt-3">
            <strong>Severability.</strong> If a provision of this Agreement is found
            unenforceable, the remaining provisions remain in full force. The parties
            intend that the unenforceable provision be replaced by an enforceable provision
            that comes closest to expressing the original intent.
          </p>
          <p className="mt-3">
            <strong>No waiver.</strong> A party&rsquo;s failure to enforce a provision does
            not waive its right to enforce the provision later.
          </p>
          <p className="mt-3">
            <strong>Assignment.</strong> Customer may not assign or transfer this Agreement
            (including by operation of law or change of control) without Dunamis
            Studios&rsquo;s prior written consent, not to be unreasonably withheld. Dunamis
            Studios may assign this Agreement to a successor in connection with a merger,
            acquisition, reorganization, or sale of substantially all assets.
          </p>
          <p className="mt-3">
            <strong>Force majeure.</strong> Neither party is liable for delay or failure to
            perform caused by events beyond its reasonable control, including acts of God,
            war, terrorism, civil disorder, labor dispute, governmental action, internet
            or utility outage, or Sub-processor failure, provided that the affected party
            uses commercially reasonable efforts to resume performance.
          </p>
          <p className="mt-3">
            <strong>Independent contractors.</strong> The parties are independent
            contractors. This Agreement does not create a partnership, joint venture,
            agency, franchise, fiduciary, or employment relationship.
          </p>
          <p className="mt-3">
            <strong>Notices.</strong> Notices to Dunamis Studios must be sent to{" "}
            <a className="underline" href="mailto:legal@dunamisstudios.net">
              legal@dunamisstudios.net
            </a>
            . Notices to Customer will be sent to the email address on Customer&rsquo;s
            account and are effective when sent. Either party may change its notice address
            on written notice.
          </p>
          <p className="mt-3">
            <strong>Electronic signatures and records.</strong> The parties consent to do
            business electronically. Clicking &ldquo;I agree,&rdquo; creating an account,
            or otherwise indicating assent constitutes an electronic signature with the
            same effect as a handwritten signature. Records of the parties&rsquo;
            transactions may be kept in electronic form.
          </p>
          <p className="mt-3">
            <strong>U.S. federal customers.</strong> The Products are commercial computer
            software and commercial computer software documentation under FAR 12.212 and
            DFARS 227.7202. U.S. federal government end users acquire the Products with
            only the rights stated in this Agreement.
          </p>
          <p className="mt-3">
            <strong>Contact.</strong> For questions about this Agreement, email{" "}
            <a className="underline" href="mailto:legal@dunamisstudios.net">
              legal@dunamisstudios.net
            </a>
            . For product support, email{" "}
            <a className="underline" href="mailto:support@dunamisstudios.net">
              support@dunamisstudios.net
            </a>
            . For security issues, see{" "}
            <Link href="/security" className="underline">
              dunamisstudios.com/security
            </Link>
            .
          </p>
        </>
      ),
    },
  ],
};
