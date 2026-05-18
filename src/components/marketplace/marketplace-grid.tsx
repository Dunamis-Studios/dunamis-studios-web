/**
 * Marketplace catalog grid with inline text search and platform /
 * category filters. Filter values are auto-derived from the products
 * data via getMarketplacePlatforms / getMarketplaceCategories so
 * adding a new product auto-extends the filter dropdowns with no
 * code change.
 *
 * Client component because filters and search are responsive on
 * every keystroke; the underlying products list is server-rendered
 * by /marketplace/page.tsx and passed in as a prop.
 */
"use client";

import * as React from "react";
import { Search as SearchIcon } from "lucide-react";
import { Grid } from "@/components/ui/primitives";
import { MarketplaceCard } from "@/components/marketplace/marketplace-card";
import type { MarketplaceProduct } from "@/lib/marketplace";

interface MarketplaceGridProps {
  products: MarketplaceProduct[];
  platforms: MarketplaceProduct["platform"][];
  categories: string[];
}

/**
 * Client-side marketplace search + filter UI wrapped around the product
 * grid. With one product live, the controls are scaffolding: they wire
 * fully and behave correctly, but visually there is nothing to filter.
 * As more products land in MARKETPLACE_PRODUCTS, the platform and
 * category dropdowns auto-extend from the supplied distinct value lists.
 */
export function MarketplaceGrid({
  products,
  platforms,
  categories,
}: MarketplaceGridProps) {
  const [query, setQuery] = React.useState("");
  const [platform, setPlatform] = React.useState<string>("all");
  const [category, setCategory] = React.useState<string>("all");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (platform !== "all" && p.platform !== platform) return false;
      if (category !== "all" && p.category !== category) return false;
      if (q.length === 0) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.cardDescription.toLowerCase().includes(q)
      );
    });
  }, [products, query, platform, category]);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-subtle)]"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps and tools"
            aria-label="Search marketplace"
            autoComplete="off"
            spellCheck={false}
            className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] pl-10 pr-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
        </div>
        <div className="flex flex-row gap-2">
          <label className="sr-only" htmlFor="marketplace-platform-filter">
            Platform
          </label>
          <select
            id="marketplace-platform-filter"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="h-11 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <option value="all">All platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="marketplace-category-filter">
            Category
          </label>
          <select
            id="marketplace-category-filter"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-10">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--fg-muted)]">
            No matches. Clear the filters or try a different search.
          </p>
        ) : (
          <Grid cols={3} gap={6}>
            {filtered.map((p) => (
              <MarketplaceCard key={p.slug} product={p} />
            ))}
          </Grid>
        )}
      </div>
    </div>
  );
}
