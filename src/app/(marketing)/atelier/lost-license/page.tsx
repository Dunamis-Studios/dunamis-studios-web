import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/primitives";
import { LostLicenseForm } from "@/components/marketing/lost-license-form";

const PAGE_PATH = "/atelier/lost-license";

export const metadata: Metadata = {
  title: "Lost your Atelier license?",
  description:
    "Enter your email and we'll re-send any active Atelier licenses to that address.",
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: "Lost your Atelier license? · Dunamis Studios",
    description:
      "Enter your email and we'll re-send any active Atelier licenses to that address.",
    url: PAGE_PATH,
    type: "website",
  },
  // Self-service support pages don't need indexing — customers reach
  // them from emails or from in-app links.
  robots: { index: false, follow: true },
};

export default function LostLicensePage() {
  return (
    <div className="lane-atelier">
      <Section className="py-16 sm:py-20">
        <Container size="md">
          <div className="mx-auto max-w-xl text-center">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              Atelier · Support
            </div>
            <h1 className="mt-3 font-[var(--font-display)] text-4xl font-medium tracking-[-0.02em] text-[var(--fg)] sm:text-5xl">
              Lost your license key?
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--fg-muted)]">
              Enter the email you used at purchase. If we have an active
              Atelier license tied to that address, we&apos;ll send it
              right away.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-md">
            <LostLicenseForm />
          </div>

          <p className="mx-auto mt-10 max-w-md text-center text-sm text-[var(--fg-muted)]">
            Already tried this and didn&apos;t see the email? Check spam
            first, then reply or write to{" "}
            <a
              href="mailto:legal@dunamisstudios.com"
              className="text-[var(--color-atelier-700)] hover:underline dark:text-[var(--color-atelier-300)]"
            >
              legal@dunamisstudios.com
            </a>
            . We&apos;ll re-issue from the original record.
          </p>
        </Container>
      </Section>
    </div>
  );
}
