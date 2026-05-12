"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";

/**
 * Persistent admin header. Rendered from the admin route group's
 * shared layout above every /admin/** page. Mirrors the structural
 * pattern of the public SiteNav (logo left, nav center, theme +
 * identity right) so admins switching between admin and public
 * surfaces stay in the same visual vocabulary, with one critical
 * differentiator: the "Admin" badge next to the wordmark. That
 * single visual marks the difference between a customer-facing page
 * (where admins might preview public content) and a destructive
 * admin route.
 *
 * Active-route highlighting matches SiteNav's pattern: aria-current,
 * elevated text color, subtle bg fill.
 *
 * Hand-off to public site: the user dropdown's "Back to site" item
 * routes to "/", and "Sign out" hits POST /api/auth/logout so the
 * session ends symmetrically with the public sign-out path.
 */

interface NavItem {
  href: string;
  label: string;
  /** Match patterns: prefix means the item is active for any
   *  pathname under it; exact requires equality. Dashboard uses
   *  exact (otherwise every admin route would highlight it). */
  match: "exact" | "prefix";
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", match: "exact" },
  { href: "/admin/content", label: "Content", match: "prefix" },
  { href: "/admin/customers", label: "Customers", match: "prefix" },
  { href: "/admin/licenses", label: "Licenses", match: "prefix" },
];

function isActive(item: NavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

interface AdminHeaderProps {
  /** Pulled server-side from the admin session and passed in so the
   *  header renders correctly on first paint (no /api/auth/me fetch
   *  flicker for admins, who land here knowing they're signed in). */
  adminFirstName: string | null;
  adminEmail: string;
}

export function AdminHeader({ adminFirstName, adminEmail }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);
  const displayName = adminFirstName ?? adminEmail;

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch (err) {
      console.error("[admin-header] sign-out failed", err);
    }
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg-elevated)]">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Logo />
          <span
            aria-label="Admin section"
            className="inline-flex items-center rounded-full bg-[var(--color-warn-bg,#fef3c7)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-warn-fg,#92400e)] dark:bg-[#3b2f0f] dark:text-[#fbbf24]"
          >
            Admin
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-[var(--bg-muted)] text-[var(--fg)] font-medium"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Dropdown>
            <DropdownTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--fg)] transition-colors hover:bg-[var(--bg-muted)]"
              >
                <User className="h-4 w-4 text-[var(--fg-muted)]" aria-hidden />
                <span className="max-w-[10rem] truncate">Hi, {displayName}</span>
              </button>
            </DropdownTrigger>
            <DropdownContent align="end">
              <div className="px-2.5 py-1.5">
                <p className="text-xs text-[var(--fg-subtle)]">Signed in as</p>
                <p className="text-sm font-medium text-[var(--fg)]">{adminEmail}</p>
              </div>
              <DropdownSeparator />
              <DropdownItem asChild>
                <Link href="/account">Account settings</Link>
              </DropdownItem>
              <DropdownItem asChild>
                <Link href="/">Back to public site</Link>
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem
                onSelect={(e) => {
                  e.preventDefault();
                  void handleSignOut();
                }}
                disabled={signingOut}
                className="text-[var(--fg)]"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                {signingOut ? "Signing out…" : "Sign out"}
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </nav>
    </header>
  );
}
