/**
 * Breadcrumb trail. Renders an aria-labelled nav with a chevron
 * separator between crumbs. Items with an href become Next.js Links;
 * the final item is rendered as a plain span with aria-current="page"
 * so screen readers announce it as the current location.
 *
 * Used on every nested route (product pages, atelier docs, marketplace
 * detail, account portal subpages) so navigation context is always
 * one tab-stop away from the page heading.
 */
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-[var(--fg-muted)]", className)}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5 min-w-0">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-[var(--fg)] transition-colors truncate"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "truncate",
                    isLast ? "text-[var(--fg)] font-medium" : "",
                  )}
                >
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--fg-subtle)]" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
