import type { Metadata } from "next";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { termsMaster } from "@/content/legal/terms-master";
import { termsDebrief } from "@/content/legal/terms-debrief";
import { termsPropertyPulse } from "@/content/legal/terms-property-pulse";
import type { LegalDocument } from "@/content/legal/types";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Dunamis Studios apps: the Debrief and Property Pulse HubSpot apps, the dunamisstudios.net website, and any related services.",
  alternates: { canonical: "/terms" },
};

const DOCUMENTS: Array<{ doc: LegalDocument; tocLabel: string; anchor: string }> = [
  { doc: termsMaster, tocLabel: "Master Terms of Service", anchor: "master" },
  { doc: termsDebrief, tocLabel: "Debrief Service Addendum", anchor: "addendum-debrief" },
  {
    doc: termsPropertyPulse,
    tocLabel: "Property Pulse Service Addendum",
    anchor: "addendum-property-pulse",
  },
];

export default function TermsPage() {
  return (
    <Section>
      <Container size="md">
        <PageHeader
          eyebrow="Legal"
          title="Terms of Service"
          description={`Last updated ${termsMaster.lastUpdated} · Version ${termsMaster.version}`}
        />

        <nav
          aria-label="On this page"
          className="mt-8 rounded-lg border border-[var(--fg-subtle)]/30 bg-[color-mix(in_oklch,var(--fg)_3%,transparent)] px-4 py-4 text-sm"
        >
          <p className="font-medium">On this page</p>
          <div className="mt-3 space-y-4">
            {DOCUMENTS.map(({ doc, tocLabel, anchor }) => (
              <div key={anchor}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--fg-subtle)]">
                  <a href={`#${anchor}`} className="hover:underline">
                    {tocLabel}
                  </a>
                </p>
                <ol className="mt-2 grid list-none gap-1 sm:grid-cols-2">
                  {doc.sections.map((s) => (
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
              </div>
            ))}
          </div>
        </nav>

        {DOCUMENTS.map(({ doc, anchor }, index) => (
          <div key={anchor} id={anchor} className="mt-16 scroll-mt-24">
            {index > 0 ? (
              <div className="mb-12 border-t-2 border-[var(--fg-subtle)]/50 pt-12">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--fg-subtle)]">
                  Service Addendum
                </p>
                <h2 className="mt-2 font-[var(--font-display)] text-2xl font-medium tracking-tight">
                  {doc.title}
                </h2>
                <p className="mt-2 text-sm text-[var(--fg-muted)]">
                  Last updated {doc.lastUpdated} · Version {doc.version}
                </p>
              </div>
            ) : null}

            <div className="space-y-12">
              {doc.sections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs text-[var(--fg-subtle)]">§{s.n}</span>
                    <h3 className="font-[var(--font-display)] text-xl font-medium tracking-tight">
                      {s.title}
                    </h3>
                  </div>
                  <div className="mt-3 space-y-3 text-[var(--fg-muted)] leading-relaxed">
                    {s.body}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ))}
      </Container>
    </Section>
  );
}
