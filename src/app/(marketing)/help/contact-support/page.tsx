import type { Metadata } from "next";

import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SupportForm } from "@/components/help/support-form";
import { AnchorScrollOnMount } from "@/components/help/anchor-scroll-on-mount";

export const metadata: Metadata = {
  title: "Contact Support · Dunamis Studios help center",
  description:
    "Can't find what you need in our help articles? Send us a ticket and we'll get back to you within 1 business day.",
  alternates: { canonical: "/help/contact-support" },
};

/**
 * Public-facing customer support entry point. Renders a static
 * header plus the SupportForm client component, which owns the
 * conditional field logic and POSTs to /api/support-submit. The
 * form section's #support-form anchor is the link target for
 * footer nav and external links into the support page; the
 * article-thumbs-down flow embeds SupportForm inline on the
 * article page itself, so it does not navigate here.
 */
export default function ContactSupportPage() {
  return (
    <>
      <Section className="pb-6">
        <Container size="prose">
          <Breadcrumbs
            items={[
              { label: "Help", href: "/help" },
              { label: "Contact Support" },
            ]}
            className="mb-5"
          />
          <PageHeader
            title="Contact Support"
            description="Can't find what you need in our help articles? Send us a ticket and we'll get back to you within 1 business day."
          />
        </Container>
      </Section>

      <Section className="!pt-2 !pb-20">
        <Container size="prose">
          <div
            id="support-form"
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-md)] sm:p-8"
          >
            <SupportForm />
            <AnchorScrollOnMount targetId="support-form" />
          </div>
        </Container>
      </Section>
    </>
  );
}
