import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { TERMS_ADDENDUMS, findTermsAddendumBySlug } from "@/content/legal/addendums";

interface PageProps {
  params: Promise<{ product: string }>;
}

export function generateStaticParams() {
  return TERMS_ADDENDUMS.map((entry) => ({ product: entry.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { product } = await params;
  const entry = findTermsAddendumBySlug(product);
  if (!entry) return {};
  return {
    title: entry.doc.title,
    description: `${entry.doc.title} for ${entry.productLabel}. Supplements the Dunamis Studios Terms of Sale.`,
    alternates: { canonical: `/terms/${entry.slug}` },
  };
}

export default async function TermsAddendumPage({ params }: PageProps) {
  const { product } = await params;
  const entry = findTermsAddendumBySlug(product);
  if (!entry) notFound();

  const doc = entry.doc;

  return (
    <Section>
      <Container size="md">
        <PageHeader
          eyebrow="Legal · Product addendum"
          title={doc.title}
          description={`Last updated ${doc.lastUpdated} · Version ${doc.version}`}
        />

        <div className="mt-8 rounded-lg border border-[var(--fg-subtle)]/30 bg-[color-mix(in_oklch,var(--fg)_3%,transparent)] px-4 py-3 text-sm">
          <p>
            This addendum supplements the Dunamis Studios{" "}
            <Link href="/terms" className="underline">
              Terms of Sale
            </Link>{" "}
            which apply to all products and services sold on dunamisstudios.com. In the
            event of a conflict between this addendum and the master Terms of Sale, this
            addendum controls for {entry.productLabel}.
          </p>
        </div>

        <nav
          aria-label="On this page"
          className="mt-6 rounded-lg border border-[var(--fg-subtle)]/30 bg-[color-mix(in_oklch,var(--fg)_3%,transparent)] px-4 py-4 text-sm"
        >
          <p className="font-medium">On this page</p>
          <ol className="mt-3 grid list-none gap-1 sm:grid-cols-2">
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
        </nav>

        <div className="mt-12 space-y-12">
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-[var(--fg-subtle)]">§{s.n}</span>
                <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight">
                  {s.title}
                </h2>
              </div>
              <div className="mt-3 space-y-3 text-[var(--fg-muted)] leading-relaxed">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-[var(--fg-subtle)]/20 pt-6 text-sm">
          <p>
            Return to the master{" "}
            <Link href="/terms" className="underline">
              Terms of Sale
            </Link>
            .
          </p>
        </div>
      </Container>
    </Section>
  );
}
