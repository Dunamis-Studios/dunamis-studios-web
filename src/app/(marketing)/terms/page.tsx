import type { Metadata } from "next";
import { Container, Section, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Dunamis Studios — draft placeholder.",
};

const SECTIONS = [
  { n: "1", title: "Acceptance", body: "By creating a Dunamis Studios account, you agree to these terms. Finalized language is pending legal review." },
  { n: "2", title: "Accounts", body: "You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account." },
  { n: "3", title: "Subscriptions & billing", body: "Subscriptions are billed per-product and per-portal. Billing will be handled by a PCI-compliant payment processor once enabled." },
  { n: "4", title: "Cancellation", body: "You can cancel a subscription at any time; the entitlement remains active through the end of the paid period." },
  { n: "5", title: "Acceptable use", body: "Use of the services to attempt to reverse engineer, extract model weights, or exceed rate limits through automated means is prohibited." },
  { n: "6", title: "Data & privacy", body: "See our Privacy notice for how we handle customer data. In summary: we store the minimum necessary, encrypt at rest, and never sell personal data." },
  { n: "7", title: "Liability", body: "Dunamis Studios provides the services on an ‘as-is’ basis. Final liability, indemnification, and warranty terms are pending." },
  { n: "8", title: "Changes", body: "We may update these terms; material changes will be announced via email at least 14 days before taking effect." },
  { n: "9", title: "Contact", body: "Questions? hello@dunamisstudios.net." },
];

export default function TermsPage() {
  return (
    <Section>
      <Container size="md">
        <PageHeader
          eyebrow="Legal"
          title="Terms of Service"
          description="Last updated placeholder. Final language pending legal review."
        />
        <div className="mt-8 rounded-lg border border-[var(--color-warning)]/40 bg-[color-mix(in_oklch,var(--color-warning)_10%,transparent)] px-4 py-3 text-sm text-[var(--fg)]">
          <strong className="font-medium">Draft, not final.</strong> This page
          is a placeholder. Final terms will replace this copy before any paid
          subscriptions are processed.
        </div>
        <div className="mt-12 space-y-10">
          {SECTIONS.map((s) => (
            <div key={s.n}>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-[var(--fg-subtle)]">
                  §{s.n}
                </span>
                <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight">
                  {s.title}
                </h2>
              </div>
              <p className="mt-3 text-[var(--fg-muted)] leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
