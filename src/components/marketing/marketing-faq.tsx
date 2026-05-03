import { Container, Section } from "@/components/ui/primitives";

/**
 * Shared FAQ accordion for marketing surfaces (homepage, pricing,
 * custom-development, courses, tools). Mirrors the markup that
 * ProductPageShell renders inside the Property Pulse and Debrief
 * product pages so the visible FAQ feels native everywhere it
 * appears, and the same `faq` array drives both this visible
 * accordion and the FAQPage JSON-LD emitted in the head (via
 * buildFaqPageSchema from article-extras). Single source of truth
 * per page, no schema-vs-content drift.
 */
export interface MarketingFaqItem {
  q: string;
  a: string;
}

export function MarketingFaq({
  faq,
  eyebrow = "FAQ",
  title = "Answers to the questions we actually get.",
}: {
  faq: MarketingFaqItem[];
  eyebrow?: string;
  title?: string;
}) {
  return (
    <Section className="border-t border-[var(--border)]">
      <Container size="md">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          {eyebrow}
        </div>
        <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
          {title}
        </h2>
        <div className="mt-10 divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {faq.map((item, i) => (
            <details key={i} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left">
                <span className="font-[var(--font-display)] text-lg font-medium tracking-tight">
                  {item.q}
                </span>
                <span
                  className="mt-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-xs text-[var(--fg-muted)] transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-3 pr-10 text-[var(--fg-muted)] leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}
