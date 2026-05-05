"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Sticky lane subnav, rendered just below the main SiteNav by each
 * lane's layout.tsx. Carries the lane wayfinding color persistently so
 * the user always knows which lane they're in. Items horizontal-scroll
 * on narrow screens.
 *
 * Subnav defaults to *-600 in light mode and *-400 in dark mode. Hover
 * deepens by one stop; current page adds bg fill + medium font weight.
 */

export type LaneKey = "build" | "hubspot";

interface SubnavItem {
  href: string;
  label: string;
}

const ITEMS: Record<LaneKey, SubnavItem[]> = {
  build: [
    { href: "/build-services/products", label: "Products" },
    { href: "/build-services/tools", label: "Free Tools" },
    { href: "/build-services/courses", label: "Courses" },
    { href: "/build-services/guides", label: "Guides" },
    { href: "/build-services/articles", label: "Articles" },
    { href: "/build-services/pricing", label: "Pricing" },
  ],
  hubspot: [
    { href: "/custom-development/products", label: "Products" },
    { href: "/custom-development/tools", label: "Free Tools" },
    { href: "/custom-development/courses", label: "Courses" },
    { href: "/custom-development/guides", label: "Guides" },
    { href: "/custom-development/articles", label: "Articles" },
    { href: "/custom-development/pricing", label: "Pricing" },
  ],
};

const LABEL: Record<LaneKey, string> = {
  build: "Build Services",
  hubspot: "HubSpot Custom Development",
};

const LINK_CLASSES: Record<LaneKey, string> = {
  build: cn(
    // base — *-600 light, *-400 dark
    "text-[var(--color-build-600)] dark:text-[var(--color-build-400)]",
    // hover — deepen one stop
    "hover:text-[var(--color-build-700)] dark:hover:text-[var(--color-build-300)]",
    "hover:bg-[color-mix(in_oklch,var(--color-build-500)_8%,transparent)] dark:hover:bg-[color-mix(in_oklch,var(--color-build-500)_15%,transparent)]",
    // current — bolder + bg fill
    "aria-[current=page]:text-[var(--color-build-700)] dark:aria-[current=page]:text-[var(--color-build-300)]",
    "aria-[current=page]:font-medium",
    "aria-[current=page]:bg-[color-mix(in_oklch,var(--color-build-500)_12%,transparent)] dark:aria-[current=page]:bg-[color-mix(in_oklch,var(--color-build-500)_18%,transparent)]",
  ),
  hubspot: cn(
    "text-[var(--color-hubspot-600)] dark:text-[var(--color-hubspot-400)]",
    "hover:text-[var(--color-hubspot-700)] dark:hover:text-[var(--color-hubspot-300)]",
    "hover:bg-[color-mix(in_oklch,var(--color-hubspot-500)_8%,transparent)] dark:hover:bg-[color-mix(in_oklch,var(--color-hubspot-500)_15%,transparent)]",
    "aria-[current=page]:text-[var(--color-hubspot-700)] dark:aria-[current=page]:text-[var(--color-hubspot-300)]",
    "aria-[current=page]:font-medium",
    "aria-[current=page]:bg-[color-mix(in_oklch,var(--color-hubspot-500)_12%,transparent)] dark:aria-[current=page]:bg-[color-mix(in_oklch,var(--color-hubspot-500)_18%,transparent)]",
  ),
};

export function LaneSubnav({ lane }: { lane: LaneKey }) {
  const pathname = usePathname();
  const items = ITEMS[lane];
  const linkClass = LINK_CLASSES[lane];

  return (
    <nav
      aria-label={`${LABEL[lane]} sections`}
      className="sticky top-16 z-30 w-full border-b border-[var(--border)] bg-[var(--bg-subtle)]/85 backdrop-blur-md"
    >
      <div className="mx-auto flex h-11 max-w-7xl items-center gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
        {items.map((item) => {
          const current =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors",
                linkClass,
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
