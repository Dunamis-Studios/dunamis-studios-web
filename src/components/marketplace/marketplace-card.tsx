/**
 * Marketplace grid card. Renders one MarketplaceProduct entry as a
 * tile with name, tagline, platform / category badges, price, and a
 * deep link into /marketplace/[slug]. Used by MarketplaceGrid; the
 * card stays neutral (no lane color) so the grid reads as a unified
 * catalog rather than a per-product splash page.
 */
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MarketplaceProduct } from "@/lib/marketplace";

interface MarketplaceCardProps {
  product: MarketplaceProduct;
  className?: string;
}

/**
 * Marketplace grid card. Linked to /marketplace/[slug]. Neutral
 * styling (not product-accented) so the grid scales as more products
 * land without each card competing visually with its neighbors. The
 * accent treatment lives on the detail page (see MarketplaceProductShell).
 *
 * Visual rhythm mirrors src/components/marketing/product-tile.tsx
 * (rounded-2xl border, bg-elevated, p-7, hover state) without importing
 * from it, so this surface can evolve independently.
 */
export function MarketplaceCard({ product, className }: MarketplaceCardProps) {
  return (
    <Link
      href={`/marketplace/${product.slug}`}
      className={cn(
        "group relative isolate flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-7 transition-colors hover:border-[var(--border-strong)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{product.platform}</Badge>
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            {product.category}
          </span>
        </div>
        <ArrowUpRight
          className="h-5 w-5 text-[var(--fg-subtle)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--fg)]"
          aria-hidden
        />
      </div>
      <h3 className="mt-8 font-[var(--font-display)] text-2xl font-medium tracking-tight text-[var(--fg)]">
        {product.name}
      </h3>
      <p className="mt-1 text-sm text-[var(--fg-muted)]">{product.tagline}</p>
      <p className="mt-5 flex-1 text-sm leading-relaxed text-[var(--fg-muted)]">
        {product.cardDescription}
      </p>
      <div className="mt-6 flex items-baseline justify-between gap-3 border-t border-[var(--border)] pt-5">
        <span className="font-[var(--font-display)] text-lg font-medium tracking-tight text-[var(--fg)]">
          {product.priceLabel}
        </span>
        <span className="text-xs text-[var(--fg-subtle)]">
          {product.licenseTerms}
        </span>
      </div>
    </Link>
  );
}
