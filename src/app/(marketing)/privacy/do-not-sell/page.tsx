import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Do Not Sell or Share My Personal Information",
  description:
    "Dunamis Studios does not sell or share personal information for cross-context behavioral advertising. CCPA/CPRA rights honored regardless of statutory threshold applicability.",
  alternates: { canonical: "/privacy/do-not-sell" },
};

export default function DoNotSellPage() {
  return (
    <Section>
      <Container size="md">
        <PageHeader
          eyebrow="Privacy"
          title="Do Not Sell or Share My Personal Information"
          description="California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA) disclosures."
        />

        <div className="mt-12 space-y-6 text-[var(--fg-muted)] leading-relaxed">
          <p>
            <strong>Dunamis Studios does not sell or share personal information</strong> for
            cross-context behavioral advertising under the meaning of the California Consumer
            Privacy Act (Cal. Civ. Code §§1798.100 et seq.) as amended by the California
            Privacy Rights Act.
          </p>

          <div className="rounded-lg border border-[var(--fg-subtle)]/30 bg-[color-mix(in_oklch,var(--fg)_3%,transparent)] px-4 py-3 text-sm">
            <p className="font-medium text-[var(--fg)]">
              Why this page exists if we don&rsquo;t sell or share
            </p>
            <p className="mt-2">
              Compliance future-proofing. Dunamis Studios currently operates below CCPA/CPRA&rsquo;s
              applicability thresholds: under $26,625,000 in annual gross revenue, fewer than
              100,000 California consumers&rsquo; personal information processed, and zero
              percent of revenue derived from selling or sharing personal information. The
              statute does not strictly require this page at our scale. We publish it anyway
              because the &ldquo;Do Not Sell or Share&rdquo; link is the legible signal to
              California residents that this practice exists, and because we want the option to
              be visible the day it ever becomes relevant.
            </p>
          </div>

          <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
            How to exercise your CCPA/CPRA rights
          </h2>
          <p>
            Should you wish to exercise any CCPA right against Dunamis Studios, email{" "}
            <a
              className="underline-offset-2 hover:underline"
              href="mailto:dsr@dunamisstudios.net?subject=CCPA%20Rights%20Request"
            >
              dsr@dunamisstudios.net
            </a>{" "}
            with your request. Include in the email:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Which right you are exercising (know, delete, opt-out, non-discrimination)</li>
            <li>Enough identifying information for us to locate any records about you</li>
            <li>Whether you are submitting on behalf of yourself or as an authorized agent</li>
          </ul>
          <p>
            We respond within thirty (30) days for routine requests, and within forty-five (45)
            days where the statute permits an extension. The full set of rights you can exercise
            is enumerated in{" "}
            <Link href="/privacy#pp-ccpa-rights" className="underline-offset-2 hover:underline">
              §9 of the Privacy Policy
            </Link>
            .
          </p>

          <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
            Non-discrimination
          </h2>
          <p>
            We do not retaliate against any consumer for exercising a CCPA right. Exercising
            your right to opt out, delete, or know does not affect the price, quality, or
            availability of any Dunamis Studios product or service offered to you.
          </p>

          <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
            Authorized agents
          </h2>
          <p>
            If you are submitting a request on behalf of a California resident, include written
            authorization signed by the resident. We may require the underlying consumer to
            verify their identity separately or to directly confirm with us that they
            authorized your request.
          </p>

          <div className="border-t border-[var(--fg-subtle)]/20 pt-6">
            <p className="text-sm">
              Return to the full{" "}
              <Link href="/privacy" className="underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
