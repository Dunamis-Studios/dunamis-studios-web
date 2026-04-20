import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Sub-processors",
  description:
    "Dunamis Studios sub-processors that process Customer Personal Data — names, purposes, processing locations, and EU–US transfer mechanisms.",
  alternates: { canonical: "/legal/subprocessors" },
};

const LAST_UPDATED = "April 20, 2026";

interface Subprocessor {
  n: number;
  name: string;
  purpose: string;
  location: string;
  transfer: string;
  dpf: string;
  dpa: { href: string; label: string };
}

const SUBPROCESSORS: Subprocessor[] = [
  {
    n: 1,
    name: "Anthropic, PBC",
    purpose: "LLM inference — generating handoff briefs via the Claude API",
    location: "United States (AWS + GCP)",
    transfer:
      "SCCs Modules 2 & 3 + UK Addendum + Swiss Addendum",
    dpf: "Not certified",
    dpa: {
      href: "https://www.anthropic.com/legal/commercial-terms",
      label: "Auto-incorporated in Anthropic Commercial Terms",
    },
  },
  {
    n: 2,
    name: "Vercel, Inc.",
    purpose:
      "Application hosting, serverless functions, edge network, request logs",
    location: "United States (customer-region selectable)",
    transfer:
      "EU-US DPF + UK Extension + Swiss-US DPF (primary); SCCs fallback",
    dpf: "Certified (all three)",
    dpa: { href: "https://vercel.com/legal/dpa", label: "vercel.com/legal/dpa" },
  },
  {
    n: 3,
    name: "Upstash, Inc.",
    purpose:
      "Redis storage — app state, brief metadata, session cache",
    location:
      "United States (default AWS us-east-1; EU region available AWS eu-west-1)",
    transfer:
      "EU-US DPF + UK Extension + Swiss-US DPF; SCCs fallback",
    dpf: "Certified (all three)",
    dpa: {
      href: "https://upstash.com/trust/privacy.pdf",
      label: "upstash.com/trust/privacy.pdf",
    },
  },
  {
    n: 4,
    name: "Stripe, Inc.",
    purpose: "Payment processing, subscription billing",
    location: "United States (primary), regional processing",
    transfer:
      "EU-US DPF + UK Extension + Swiss-US DPF; SCCs; CBPR/PRP",
    dpf: "Certified (all three)",
    dpa: { href: "https://stripe.com/legal/dpa", label: "stripe.com/legal/dpa" },
  },
  {
    n: 5,
    name: "Drforest, Inc. (d/b/a Resend)",
    purpose: "Transactional email delivery",
    location: "United States",
    transfer:
      "EU-US DPF + UK Extension + Swiss-US DPF; SCCs fallback",
    dpf: "Certified",
    dpa: { href: "https://resend.com/legal/dpa", label: "resend.com/legal/dpa" },
  },
];

export default function SubprocessorsPage() {
  return (
    <Section>
      <Container size="md">
        <PageHeader
          eyebrow="Legal"
          title="Sub-processors"
          description={`Last updated ${LAST_UPDATED}`}
        />

        <div className="mt-8 space-y-4 text-[var(--fg-muted)] leading-relaxed">
          <p>
            This page lists the sub-processors Dunamis Studios (Joshua Robert
            Bradford d/b/a Dunamis Studios) engages to deliver the Debrief
            HubSpot application and the dunamisstudios.net website. It is
            incorporated by reference into the{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>{" "}
            and the{" "}
            <Link href="/legal/dpa" className="underline">
              Data Processing Addendum
            </Link>{" "}
            as Annex 4.
          </p>
          <p>
            Dunamis Studios commits to at least{" "}
            <strong>thirty (30) days' advance notice</strong> of any
            intended addition or replacement of a sub-processor that will
            process Customer Personal Data. To receive notice by email,
            subscribe by sending a one-line message to{" "}
            <a
              href="mailto:privacy@dunamisstudios.net?subject=Subscribe%20to%20sub-processor%20updates"
              className="underline"
            >
              privacy@dunamisstudios.net
            </a>
            . Customer may object to a new sub-processor on reasonable
            data-protection grounds within the notice period; if the
            objection cannot be resolved, termination of the affected
            subscription is the remedy.
          </p>
          <div className="rounded-md border border-[var(--color-warning)]/40 bg-[color-mix(in_oklch,var(--color-warning)_10%,transparent)] px-4 py-3 text-sm">
            <p>
              <strong>Honest upstream asymmetry.</strong> Anthropic, our LLM
              sub-processor, commits to only <strong>fifteen (15) days'
              notice</strong> of changes to its own sub-processors upstream of
              us. Where we receive shorter upstream notice, we pass the change
              through to customers as soon as practicable, which may be
              shorter than our 30-day commitment.
            </p>
          </div>
        </div>

        <h2
          id="processors"
          className="mt-12 scroll-mt-24 font-[var(--font-display)] text-xl font-medium tracking-tight"
        >
          Sub-processors that process Customer Personal Data
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--fg-subtle)]/40 text-left">
                <th className="py-2 pr-4 font-medium">#</th>
                <th className="py-2 pr-4 font-medium">Legal name</th>
                <th className="py-2 pr-4 font-medium">Purpose</th>
                <th className="py-2 pr-4 font-medium">Location</th>
                <th className="py-2 pr-4 font-medium">EU→US transfer mechanism</th>
                <th className="py-2 pr-4 font-medium">DPF status</th>
                <th className="py-2 font-medium">DPA</th>
              </tr>
            </thead>
            <tbody className="[&_td]:py-3 [&_td]:pr-4 [&_td]:align-top [&_tr]:border-b [&_tr]:border-[var(--fg-subtle)]/20">
              {SUBPROCESSORS.map((s) => (
                <tr key={s.n}>
                  <td>{s.n}</td>
                  <td className="font-medium">{s.name}</td>
                  <td>{s.purpose}</td>
                  <td>{s.location}</td>
                  <td>{s.transfer}</td>
                  <td>{s.dpf}</td>
                  <td>
                    <a
                      href={s.dpa.href}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {s.dpa.label}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2
          id="authorized-source"
          className="mt-12 scroll-mt-24 font-[var(--font-display)] text-xl font-medium tracking-tight"
        >
          Authorized data source (not a sub-processor, strictly)
        </h2>
        <div className="mt-4 space-y-3 text-[var(--fg-muted)] leading-relaxed">
          <p>
            <strong>HubSpot, Inc.</strong> Customer has already engaged
            HubSpot as its processor for CRM data independently of Dunamis
            Studios. Debrief is a HubSpot marketplace application that
            reads Customer's HubSpot data under the OAuth authorization
            Customer grants at install. HubSpot is listed here for
            transparency; the flow from Customer's HubSpot portal into
            Debrief is governed by Customer's own agreement with
            HubSpot and by this Dunamis Studios DPA.
          </p>
        </div>

        <h2
          id="operational-tooling"
          className="mt-12 scroll-mt-24 font-[var(--font-display)] text-xl font-medium tracking-tight"
        >
          Operational tooling — does not receive Customer Personal Data
        </h2>
        <div className="mt-4 space-y-3 text-[var(--fg-muted)] leading-relaxed">
          <p>
            The following services support Dunamis Studios's internal
            operations (collaboration, source control, credential
            management, accounting). They do not receive or process
            Customer Personal Data and are therefore not sub-processors in
            the GDPR Article 28 sense. They are listed here for
            transparency.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Google Workspace</strong> (Google LLC) — internal
              email, calendar, documents.
            </li>
            <li>
              <strong>GitHub</strong> (GitHub, Inc.) — source control for
              Dunamis Studios code.
            </li>
            <li>
              <strong>1Password</strong> (AgileBits Inc.) — credential and
              secrets vault.
            </li>
            <li>
              Accounting and tax preparation software used for internal
              bookkeeping.
            </li>
          </ul>
        </div>

        <h2
          id="contact"
          className="mt-12 scroll-mt-24 font-[var(--font-display)] text-xl font-medium tracking-tight"
        >
          Contact and subscription to updates
        </h2>
        <div className="mt-4 space-y-3 text-[var(--fg-muted)] leading-relaxed">
          <p>
            Questions or objections regarding sub-processors:{" "}
            <a href="mailto:privacy@dunamisstudios.net" className="underline">
              privacy@dunamisstudios.net
            </a>
            . Data-protection escalations and DPA matters:{" "}
            <a href="mailto:legal@dunamisstudios.net" className="underline">
              legal@dunamisstudios.net
            </a>
            . Postal address: Joshua Robert Bradford d/b/a Dunamis Studios,
            2269 Twin Fox Trail, St. Augustine, FL 32086, United States.
          </p>
        </div>
      </Container>
    </Section>
  );
}
