import Link from "next/link";
import { DEBRIEF_TIERS } from "@/lib/pricing";
import type { LegalDocument } from "./types";

export const termsDebrief: LegalDocument = {
  title: "Debrief Service Addendum",
  lastUpdated: "April 23, 2026",
  version: "2.0",
  idPrefix: "d-",
  sections: [
    {
      n: "D1",
      id: "d-service-description",
      title: "Service description",
      body: (
        <>
          <p>
            Debrief is an AI-powered handoff-intelligence application for HubSpot. When a
            record changes hands in HubSpot (contact, company, deal, or ticket ownership
            transfer), Debrief retrieves the relevant record and its associated context from
            Customer&rsquo;s HubSpot portal, transmits that data to Anthropic&rsquo;s Claude
            API over an encrypted connection, and returns two types of AI-generated Output:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>(a)</strong> a structured handoff brief summarizing the record, its
              recent activity, and context relevant to the new owner, displayed inside
              Customer&rsquo;s HubSpot portal (a &ldquo;<strong>Brief</strong>&rdquo;); and
            </li>
            <li>
              <strong>(b)</strong> a conversational message the prior owner can send to the new
              owner accompanying the Brief (a &ldquo;<strong>Handoff Message</strong>&rdquo;).
            </li>
          </ul>
          <p className="mt-3">
            Briefs and Handoff Messages together constitute &ldquo;AI Output&rdquo; for purposes
            of the Master Agreement <a className="underline" href="#m-ai-output">§7</a> and are
            subject to the AI Output terms therein, including the AI Output sub-cap in{" "}
            <a className="underline" href="#m-liability">§12</a>.
          </p>
        </>
      ),
    },
    {
      n: "D2",
      id: "d-ai-use",
      title: "AI use disclosure",
      body: (
        <p>
          Debrief transmits Customer&rsquo;s HubSpot Data to Anthropic, PBC&rsquo;s Claude API
          as described in the Dunamis Studios{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>{" "}
          §5. Anthropic does not use API data to train its models, and Anthropic retains API
          inputs and outputs for up to seven (7) days for abuse monitoring before deletion. See
          the Privacy Policy for the full data flow.
        </p>
      ),
    },
    {
      n: "D3",
      id: "d-pricing",
      title: "Pricing and plans",
      body: (
        <>
          <p>
            Debrief is offered on monthly subscription tiers published at{" "}
            <Link href="/pricing" className="underline">
              /pricing
            </Link>
            . Current tiers are:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>{DEBRIEF_TIERS.starter.label}</strong> &mdash;{" "}
              {DEBRIEF_TIERS.starter.monthlyAllotment} credits per month
            </li>
            <li>
              <strong>{DEBRIEF_TIERS.pro.label}</strong> &mdash;{" "}
              {DEBRIEF_TIERS.pro.monthlyAllotment} credits per month
            </li>
            <li>
              <strong>{DEBRIEF_TIERS.enterprise.label}</strong> &mdash;{" "}
              {DEBRIEF_TIERS.enterprise.monthlyAllotment} credits per month
            </li>
          </ul>
          <p className="mt-3">
            A &ldquo;credit&rdquo; entitles Customer to one Brief-and-Handoff-Message
            generation. Fees, credit allotments, and feature sets are governed by the pricing
            page and may be updated on notice as described in the Master Agreement{" "}
            <a className="underline" href="#m-subscriptions">§5</a>.
          </p>
          <p className="mt-3">
            <strong>First-month bonus.</strong> Each tier includes a one-time first-month bonus
            equal to two (2) times the monthly credit allotment for that tier (currently{" "}
            {DEBRIEF_TIERS.starter.firstMonthBonus}, {DEBRIEF_TIERS.pro.firstMonthBonus}, and{" "}
            {DEBRIEF_TIERS.enterprise.firstMonthBonus} credits respectively for Starter, Pro,
            and Enterprise). The bonus applies to the first billing period only, is not
            pro-rated on mid-cycle tier changes, and is not redeemable for cash or credit
            toward future periods.
          </p>
        </>
      ),
    },
    {
      n: "D4",
      id: "d-refunds",
      title: "Refund policy",
      body: (
        <p>
          Debrief subscriptions are billed monthly in advance and do not issue pro-rata refunds
          for partial periods, except as required by law or as set forth in the Master
          Agreement <a className="underline" href="#m-warranties">§10</a> (limited service
          warranty remedy) or <a className="underline" href="#m-term">§13</a> (termination for
          convenience remedy).
        </p>
      ),
    },
    {
      n: "D5",
      id: "d-credits",
      title: "Credit usage and rollover",
      body: (
        <>
          <p>
            <strong>Monthly allotment credits do not roll over.</strong> On the first day of
            each new billing period, Customer&rsquo;s monthly-allotment balance is reset to the
            tier&rsquo;s monthly allotment (plus any active first-month bonus credits). Any
            unused portion of the prior period&rsquo;s monthly allotment is forfeited.
          </p>
          <p className="mt-3">
            <strong>Add-on credits do not expire.</strong> Credits Customer purchases as
            one-time add-on top-ups, separate from the monthly allotment, remain in
            Customer&rsquo;s balance until consumed or until the Debrief subscription is
            terminated. Add-on credits are not pro-rated or refundable except as required by
            law or as set forth in the Master Agreement{" "}
            <a className="underline" href="#m-warranties">§10</a> (limited service warranty
            remedy) or <a className="underline" href="#m-term">§13</a> (termination for
            convenience remedy). On termination, any unused add-on credits expire with the
            subscription and are not refunded.
          </p>
          <p className="mt-3">
            <strong>Consumption order.</strong> When Customer generates a Brief, Dunamis
            Studios consumes monthly-allotment and bonus credits first, and draws from add-on
            credits only after the monthly allotment for the current period is exhausted. This
            protects the non-expiring add-on balance from being drawn down while unused
            allotment credits would otherwise be forfeited at period reset.
          </p>
          <p className="mt-3">
            <strong>What counts as consumption.</strong> Credits are consumed only when a Brief
            is successfully generated; failed generations caused by upstream Sub-processor
            errors (including Anthropic API failures) do not consume credits.
          </p>
        </>
      ),
    },
    {
      n: "D6",
      id: "d-tier-changes",
      title: "Tier changes",
      body: (
        <p>
          Customer may upgrade or downgrade tiers at any time from the account dashboard.
          Upgrades take effect immediately, with the new tier&rsquo;s credit allotment
          replacing the current balance and the tier-price difference pro-rated for the
          remainder of the billing period. Downgrades take effect at the start of the next
          billing period.
        </p>
      ),
    },
    {
      n: "D7",
      id: "d-termination",
      title: "Service-specific termination",
      body: (
        <p>
          In addition to the termination rights in the Master Agreement{" "}
          <a className="underline" href="#m-term">§13</a>, Dunamis Studios may suspend or
          terminate Debrief access if Customer&rsquo;s use of Debrief violates
          Anthropic&rsquo;s Usage Policy or if Anthropic terminates or restricts Dunamis
          Studios&rsquo;s access to the Claude API such that Debrief cannot functionally
          operate.
        </p>
      ),
    },
    {
      n: "D8",
      id: "d-sla",
      title: "No SLA",
      body: (
        <p>
          Debrief operates on commercially reasonable efforts. No uptime guarantee, service
          credits, or failover arrangements apply, consistent with the Master Agreement{" "}
          <a className="underline" href="#m-sla">§17</a>. Debrief performance is materially
          dependent on Anthropic API availability and response times, which are outside Dunamis
          Studios&rsquo;s control.
        </p>
      ),
    },
  ],
};
