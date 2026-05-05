"use client";

import Link from "next/link";
import * as React from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LaneKey = "build" | "hubspot";

interface LaneNavLink {
  href: string;
  label: string;
  lane: LaneKey;
}

interface GeneralNavLink {
  href: string;
  label: string;
}

const LANE_LINKS: LaneNavLink[] = [
  { href: "/build-services", label: "Build Services", lane: "build" },
  {
    href: "/custom-development",
    label: "HubSpot Custom Development",
    lane: "hubspot",
  },
];

const GENERAL_LINKS: GeneralNavLink[] = [
  { href: "/about", label: "About" },
  { href: "/help", label: "Help Center" },
  { href: "/contact", label: "Contact" },
];

/**
 * Detects which lane (if any) the current pathname falls under so the
 * matching top-level item shows its active treatment, persistent across
 * every page within the lane.
 */
function detectLane(pathname: string | null): LaneKey | null {
  if (!pathname) return null;
  if (pathname === "/build-services" || pathname.startsWith("/build-services/")) {
    return "build";
  }
  if (
    pathname === "/custom-development" ||
    pathname.startsWith("/custom-development/")
  ) {
    return "hubspot";
  }
  return null;
}

const LANE_DOT_CLASS: Record<LaneKey, string> = {
  build: "bg-[var(--color-build-500)]",
  hubspot: "bg-[var(--color-hubspot-500)]",
};

const LANE_ACTIVE_CLASS: Record<LaneKey, string> = {
  build:
    "bg-[color-mix(in_oklch,var(--color-build-500)_12%,transparent)] text-[var(--color-build-700)] dark:text-[var(--color-build-300)] font-medium",
  hubspot:
    "bg-[color-mix(in_oklch,var(--color-hubspot-500)_12%,transparent)] text-[var(--color-hubspot-700)] dark:text-[var(--color-hubspot-300)] font-medium",
};

const LANE_HOVER_CLASS: Record<LaneKey, string> = {
  build:
    "hover:text-[var(--color-build-700)] dark:hover:text-[var(--color-build-300)]",
  hubspot:
    "hover:text-[var(--color-hubspot-700)] dark:hover:text-[var(--color-hubspot-300)]",
};

type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; firstName?: string };

/**
 * Top-level site nav. Layout:
 *   [Logo] | [Build Services · HubSpot Custom Development] | [About · Help · Contact] [Theme] [Auth]
 *
 * Lane items carry a small color dot in their lane wayfinding color and
 * pick up an active fill when the user is on a page inside that lane.
 * Subnav rendering happens in each lane's layout.tsx, not here.
 *
 * Mobile: tapping a lane item navigates directly to the lane landing
 * page; no accordion expansion. The lane subnav appears on the lane
 * page itself once the user lands there.
 */
export function SiteNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [auth, setAuth] = React.useState<AuthState>({ status: "loading" });
  const pathname = usePathname();
  const activeLane = detectLane(pathname);

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
          {LANE_LINKS.map((l) => {
            const isActive = activeLane === l.lane;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? LANE_ACTIVE_CLASS[l.lane]
                    : cn(
                        "text-[var(--fg-muted)]",
                        LANE_HOVER_CLASS[l.lane],
                      ),
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    LANE_DOT_CLASS[l.lane],
                  )}
                />
                {l.label}
              </Link>
            );
          })}

          <span
            aria-hidden
            className="mx-2 h-5 w-px shrink-0 bg-[var(--border)]"
          />

          {GENERAL_LINKS.map((l) => {
            const active = pathname === l.href || pathname?.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
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
            {LANE_LINKS.map((l) => {
              const isActive = activeLane === l.lane;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    isActive
                      ? LANE_ACTIVE_CLASS[l.lane]
                      : cn("text-[var(--fg)]", LANE_HOVER_CLASS[l.lane]),
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", LANE_DOT_CLASS[l.lane])}
                  />
                  {l.label}
                </Link>
              );
            })}
            <div className="my-1 h-px bg-[var(--border)]" />
            {GENERAL_LINKS.map((l) => (
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
