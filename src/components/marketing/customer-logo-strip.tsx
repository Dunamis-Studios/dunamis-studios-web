import Image from "next/image";
import { Container, Section } from "@/components/ui/primitives";
import { customerLogos } from "@/data/customer-logos";

/**
 * Landing-page social-proof strip. Reads from src/data/customer-logos.ts.
 * Returns null — including any section wrapper, heading, or spacing — if
 * the data source is empty, so the landing page has no placeholder state
 * while we wait on real customer logos.
 */
export function CustomerLogoStrip() {
  if (customerLogos.length === 0) return null;

  return (
    <Section className="!py-12 border-y border-[var(--border)] bg-[var(--bg-subtle)]">
      <Container size="xl">
        <p className="text-center text-xs font-medium uppercase tracking-[0.16em] text-[var(--fg-subtle)]">
          Trusted by teams at
        </p>
        <div className="mt-6 grid grid-cols-2 items-center gap-8 sm:grid-cols-3 md:grid-cols-6">
          {customerLogos.map((logo) => {
            const img = (
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width ?? 120}
                height={logo.height ?? 32}
                className="mx-auto h-8 w-auto opacity-70 transition-opacity hover:opacity-100"
              />
            );
            if (logo.href) {
              return (
                <a
                  key={logo.alt}
                  href={logo.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  {img}
                </a>
              );
            }
            return (
              <div key={logo.alt} className="block">
                {img}
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
