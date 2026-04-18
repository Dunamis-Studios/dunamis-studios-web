import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center">
      <Container size="sm" className="py-24 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="mt-10 font-mono text-xs uppercase tracking-widest text-[var(--fg-subtle)]">
          404
        </div>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl font-medium tracking-tight sm:text-5xl">
          That page doesn't exist.
        </h1>
        <p className="mt-4 text-[var(--fg-muted)]">
          The link might be broken, or the page may have moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/account">Go to account</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
