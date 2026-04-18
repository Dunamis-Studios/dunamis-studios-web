import type { Metadata } from "next";
import { Container, Section, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "Privacy Notice for Dunamis Studios — draft placeholder.",
};

const SECTIONS = [
  { n: "1", title: "What we collect", body: "Account identity (name, email), authentication state, entitlement metadata, and minimal analytics necessary to operate the service." },
  { n: "2", title: "How we use it", body: "To authenticate you, display your entitlements, send transactional email (verification, password reset), and secure the service against abuse." },
  { n: "3", title: "What we don't do", body: "We don't sell personal data, run third-party ad trackers, or use your portal data to train shared models." },
  { n: "4", title: "Subprocessors", body: "Vercel (hosting), Upstash (Redis), Resend (transactional email). Full list updated here as the stack evolves." },
  { n: "5", title: "Retention", body: "Account records retained for the life of the account. Sessions expire after 30 days of inactivity. Deleted accounts are recoverable for 30 days before permanent purge." },
  { n: "6", title: "Your rights", body: "Access, correct, export, or delete your data at any time from Account Settings, or by emailing hello@dunamisstudios.net." },
  { n: "7", title: "Children", body: "The service is not directed to children under 13. We do not knowingly collect data from minors." },
  { n: "8", title: "Contact", body: "Privacy questions: hello@dunamisstudios.net." },
];

export default function PrivacyPage() {
  return (
    <Section>
      <Container size="md">
        <PageHeader
          eyebrow="Legal"
          title="Privacy Notice"
          description="Last updated placeholder. Final language pending legal review."
        />
        <div className="mt-8 rounded-lg border border-[var(--color-warning)]/40 bg-[color-mix(in_oklch,var(--color-warning)_10%,transparent)] px-4 py-3 text-sm text-[var(--fg)]">
          <strong className="font-medium">Draft, not final.</strong> This page
          is a placeholder until legal review.
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
