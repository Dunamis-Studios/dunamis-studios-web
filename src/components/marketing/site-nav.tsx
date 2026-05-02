"use client";

import Link from "next/link";
import * as React from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/custom-development", label: "Custom Development" },
  { href: "/tools", label: "Free Tools" },
  { href: "/guides", label: "Guides" },
  { href: "/articles", label: "Articles" },
  { href: "/pricing", label: "Pricing" },
];

type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; firstName?: string };

/**
 * Fetches /api/auth/me on mount. Defaulting to "loading" lets us render a
 * placeholder slot of fixed width on the right side of the nav so the
 * signed-in / signed-out swap does not cause layout shift. The marketing
 * layout used to fetch the session server-side, but doing so forced
 * every page in the group to render dynamically and blocked bf-cache.
 */
export function SiteNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [auth, setAuth] = React.useState<AuthState>({ status: "loading" });
  const pathname = usePathname();

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { account: null }))
      .then((data: { account: { firstName?: string } | null }) => {
        if (cancelled) return;
        if (data.account) {
          setAuth({ status: "signed-in", firstName: data.account.firstName });
        } else {
          setAuth({ status: "signed-out" });
        }
      })
      .catch(() => {
        if (!cancelled) setAuth({ status: "signed-out" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signedIn = auth.status === "signed-in";
  const firstName = auth.status === "signed-in" ? auth.firstName : undefined;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-colors duration-200",
        scrolled
          ? "border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href || pathname?.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "px-3 py-1.5 text-sm transition-colors rounded-md",
                  active
                    ? "text-[var(--fg)]"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {signedIn ? (
            <Button asChild size="sm" variant="secondary">
              <Link href="/account">{firstName ? `Hi, ${firstName}` : "Dashboard"}</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Create account</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--fg)]"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {mobileOpen ? (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg)] animate-fade-in">
          <div className="flex flex-col gap-1 p-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-2 text-sm text-[var(--fg)] hover:bg-[var(--bg-muted)]"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 p-1">
              {signedIn ? (
                <Button asChild className="w-full">
                  <Link href="/account">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="secondary" className="flex-1">
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href="/signup">Create account</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
