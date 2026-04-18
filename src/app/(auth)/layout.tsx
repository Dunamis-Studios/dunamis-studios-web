import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, color-mix(in oklch, var(--color-brand-500) 18%, transparent) 0%, transparent 70%)",
        }}
      />
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <Logo />
        <ThemeToggle />
      </header>
      <main
        id="main"
        className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md flex-col items-stretch justify-center px-6 pb-16 sm:px-0"
      >
        {children}
      </main>
      <footer className="absolute bottom-4 left-0 right-0 text-center text-xs text-[var(--fg-subtle)]">
        <Link href="/terms" className="hover:text-[var(--fg-muted)]">
          Terms
        </Link>
        <span className="mx-2">·</span>
        <Link href="/privacy" className="hover:text-[var(--fg-muted)]">
          Privacy
        </Link>
      </footer>
    </div>
  );
}
