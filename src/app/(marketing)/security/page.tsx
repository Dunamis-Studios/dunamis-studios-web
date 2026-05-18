/**
 * Security disclosure page at /security. Reads the canonical PGP
 * public key from disk and renders it inline alongside the
 * vulnerability-disclosure policy: 90-day responsible disclosure,
 * safe harbor for good-faith research, encrypted contact channel.
 *
 * Server component, statically buildable because the PGP key file
 * is checked into the repo (content/security/pgp-public-key.asc).
 */
import type { Metadata } from "next";
import Link from "next/link";
import fs from "node:fs/promises";
import path from "node:path";
import { Container, Section, PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How to report a security vulnerability to Dunamis Studios. GPG-encrypted disclosure, 90-day responsible disclosure timeline, safe harbor for good-faith research.",
  alternates: { canonical: "/security" },
};

const SECURITY_EMAIL = "security@dunamisstudios.net";

// Read at build time so the markdown file is the source of truth for the
// Acknowledgments section. New entries land in content/security-acknowledgments.md
// and re-deploy refreshes the page.
async function loadAcknowledgments(): Promise<string> {
  try {
    const p = path.join(process.cwd(), "content", "security-acknowledgments.md");
    return await fs.readFile(p, "utf-8");
  } catch {
    return "";
  }
}

export default async function SecurityPage() {
  const acknowledgmentsSource = await loadAcknowledgments();
  const hasNoReports = acknowledgmentsSource.includes("No reports yet");

  return (
    <Section>
      <Container size="md">
        <PageHeader
          eyebrow="Trust"
          title="Security at Dunamis Studios"
          description="How we approach security, how to report a vulnerability, and what we commit to in return."
        />

        <div className="mt-12 space-y-12 text-[var(--fg-muted)] leading-relaxed">
          <section id="approach" className="scroll-mt-24">
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              Our approach
            </h2>
            <p className="mt-3">
              Dunamis Studios builds local-first software. Most customer data, including the
              business and client data inside Atelier, never leaves the customer&apos;s machine.
              The only Dunamis-bound communication from Atelier is the licensing surface (online
              activation, daily heartbeat, optional update check), and an opt-in Sync product when
              the customer activates it. We treat every security disclosure with respect and
              respond within 5 business days.
            </p>
          </section>

          <section id="reporting" className="scroll-mt-24">
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              Reporting a vulnerability
            </h2>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="font-medium text-[var(--fg)]">Email:</span>{" "}
                <a
                  className="underline-offset-2 hover:underline"
                  href={`mailto:${SECURITY_EMAIL}`}
                >
                  {SECURITY_EMAIL}
                </a>
              </li>
              <li>
                <span className="font-medium text-[var(--fg)]">GPG fingerprint:</span>{" "}
                <code className="font-mono text-sm">
                  TBD (run scripts/generate-security-gpg-key.sh then paste the 40-hex fingerprint
                  here)
                </code>
              </li>
              <li>
                <span className="font-medium text-[var(--fg)]">Public key:</span>{" "}
                <Link
                  className="underline-offset-2 hover:underline"
                  href="/.well-known/security.txt.asc"
                >
                  /.well-known/security.txt.asc
                </Link>
              </li>
            </ul>
            <p className="mt-4 font-medium text-[var(--fg)]">What to include in the report</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Description of the issue</li>
              <li>Reproduction steps (the more specific, the faster we can confirm)</li>
              <li>Affected version (Atelier semver if a binary issue; commit SHA if a site issue)</li>
              <li>Impact assessment (data exposure, RCE, privilege escalation, denial of service)</li>
              <li>Suggested fix if known (optional, appreciated)</li>
            </ul>
          </section>

          <section id="policy" className="scroll-mt-24">
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              Responsible disclosure policy
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-[var(--fg)]">90-day disclosure timeline.</span>{" "}
                We commit to a fix or a documented mitigation within 90 days of initial report.
                After 90 days, the researcher is free to publish details of the vulnerability
                regardless of patch status.
              </li>
              <li>
                <span className="font-medium text-[var(--fg)]">Safe harbor.</span> Good-faith
                security research conducted in accordance with this policy will not be subject to
                legal action under the Computer Fraud and Abuse Act, the Digital Millennium
                Copyright Act, or analogous state and international laws.
              </li>
            </ul>
            <p className="mt-4 font-medium text-[var(--fg)]">In scope</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <code className="font-mono text-sm">dunamisstudios.com</code> and all subdomains
              </li>
              <li>
                <code className="font-mono text-sm">atelier.exe</code> and other Dunamis-distributed
                binaries
              </li>
              <li>
                <code className="font-mono text-sm">api.dunamisstudios.com</code> activation
                endpoints
              </li>
            </ul>
            <p className="mt-4 font-medium text-[var(--fg)]">Out of scope</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Denial-of-service attacks or traffic floods</li>
              <li>Social engineering against Dunamis Studios employees</li>
              <li>Physical attacks</li>
              <li>
                Third-party services we depend on (Stripe, Vercel, Upstash, Resend, GitHub). Report
                those directly to the affected vendor.
              </li>
              <li>Automated scanning that generates significant traffic against the site or API</li>
            </ul>
          </section>

          <section id="commitments" className="scroll-mt-24">
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              What we commit to
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Acknowledge receipt of your report within 2 business days.</li>
              <li>Initial triage and severity assessment within 5 business days.</li>
              <li>
                Disclosure coordination: we&apos;ll keep you in the loop on the patch timeline and
                give you advance notice before public disclosure.
              </li>
              <li>
                Recognition in the Acknowledgments section below, if you want it. Pseudonym OK;
                tell us how you&apos;d like to be credited (or whether to credit you at all).
              </li>
            </ul>
          </section>

          <section id="acknowledgments" className="scroll-mt-24">
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              Acknowledgments
            </h2>
            <p className="mt-3">
              {hasNoReports
                ? "No reports yet. Be the first."
                : "Researchers who reported issues we then fixed. Thank you for the responsible disclosure."}
            </p>
          </section>

          <section id="machine-readable" className="scroll-mt-24">
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              Machine-readable security.txt
            </h2>
            <p className="mt-3">
              Per RFC 9116, our security contact info is also available at{" "}
              <Link
                className="underline-offset-2 hover:underline"
                href="/.well-known/security.txt"
              >
                /.well-known/security.txt
              </Link>
              .
            </p>
          </section>
        </div>
      </Container>
    </Section>
  );
}
