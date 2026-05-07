"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Atelier docs sidebar navigation.
 *
 * Sticky vertical list on `lg+`, collapsible drawer on small screens.
 * The active route is highlighted in oxblood (the .lane-atelier wrapper
 * remaps --accent so any var(--accent)-bound surface picks it up).
 *
 * The data is loaded server-side by the layout and passed through as
 * a serialized prop, so the client component itself does no FS work.
 */

export interface AtelierDocsNavGroup {
  category: string;
  label: string;
  items: { slug: string; title: string; href: string }[];
}

interface AtelierDocsNavProps {
  groups: AtelierDocsNavGroup[];
  /** Optional href that always renders as a top-level "Overview" entry
   *  above the grouped list — used for the docs index page link. */
  overviewHref?: string;
  /** Optional href for the search page — rendered beneath Overview. */
  searchHref?: string;
}

export function AtelierDocsNav({
  groups,
  overviewHref,
  searchHref,
}: AtelierDocsNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close the mobile drawer whenever the URL changes — same pattern
  // SiteNav uses so a tap-through doesn't leave the drawer open.
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const linkClass = (active: boolean) =>
    cn(
      "block rounded-md px-3 py-1.5 text-sm transition-colors",
      active
        ? "bg-[color-mix(in_oklch,var(--color-atelier-500)_14%,transparent)] font-medium text-[var(--color-atelier-700)] dark:text-[var(--color-atelier-300)]"
        : "text-[var(--fg-muted)] hover:bg-[color-mix(in_oklch,var(--color-atelier-500)_8%,transparent)] hover:text-[var(--color-atelier-700)] dark:hover:text-[var(--color-atelier-300)]",
    );

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  const navContent = (
    <nav aria-label="Atelier documentation" className="space-y-6">
      {(overviewHref || searchHref) && (
        <ul className="space-y-1">
          {overviewHref ? (
            <li>
              <Link
                href={overviewHref}
                aria-current={isActive(overviewHref) && pathname === overviewHref ? "page" : undefined}
                className={linkClass(pathname === overviewHref)}
              >
                Overview
              </Link>
            </li>
          ) : null}
          {searchHref ? (
            <li>
              <Link
                href={searchHref}
                aria-current={pathname === searchHref ? "page" : undefined}
                className={linkClass(pathname === searchHref)}
              >
                Search docs
              </Link>
            </li>
          ) : null}
        </ul>
      )}
      {groups.map((group) => (
        <div key={group.category}>
          <h3 className="mb-2 px-3 text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            {group.label}
          </h3>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.slug}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={linkClass(isActive(item.href))}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile trigger — sticks to the top of the docs subtree */}
      <div className="sticky top-16 z-20 mb-4 -mx-4 border-b border-[var(--border)] bg-[var(--bg)]/85 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
        <button
          type="button"
          aria-label={mobileOpen ? "Close docs menu" : "Open docs menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--fg)]"
        >
          {mobileOpen ? (
            <X className="h-4 w-4" aria-hidden />
          ) : (
            <Menu className="h-4 w-4" aria-hidden />
          )}
          Docs menu
        </button>
      </div>

      {mobileOpen ? (
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 lg:hidden">
          {navContent}
        </div>
      ) : null}

      {/* Desktop sticky sidebar */}
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
        {navContent}
      </aside>
    </>
  );
}
