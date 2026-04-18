import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductTileProps {
  name: string;
  tagline: string;
  href: string;
  description: string;
  accent: "pulse" | "brief" | "muted";
  comingSoon?: boolean;
  className?: string;
}

const ACCENT: Record<ProductTileProps["accent"], string> = {
  pulse:
    "from-[color-mix(in_oklch,var(--color-pulse-500)_30%,transparent)] to-transparent",
  brief:
    "from-[color-mix(in_oklch,var(--color-brief-500)_30%,transparent)] to-transparent",
  muted: "from-transparent to-transparent",
};

const BORDER: Record<ProductTileProps["accent"], string> = {
  pulse: "hover:border-[var(--color-pulse-500)]/60",
  brief: "hover:border-[var(--color-brief-500)]/60",
  muted: "hover:border-[var(--border-strong)]",
};

const ICON_BG: Record<ProductTileProps["accent"], string> = {
  pulse: "bg-[var(--color-pulse-500)]/15 text-[var(--color-pulse-500)]",
  brief: "bg-[var(--color-brief-500)]/15 text-[var(--color-brief-500)]",
  muted: "bg-[var(--bg-muted)] text-[var(--fg-subtle)]",
};

export function ProductTile({
  name,
  tagline,
  href,
  description,
  accent,
  comingSoon,
  className,
}: ProductTileProps) {
  const Wrapper = comingSoon ? "div" : Link;
  return (
    <Wrapper
      {...(comingSoon ? {} : { href })}
      className={cn(
        "group relative isolate flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-7 transition-all duration-300",
        "hover:shadow-md",
        BORDER[accent],
        comingSoon && "cursor-default opacity-80",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 -z-10 h-48 opacity-70 transition-opacity duration-500 group-hover:opacity-100",
          "bg-gradient-to-b",
          ACCENT[accent],
        )}
      />
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            ICON_BG[accent],
          )}
          aria-hidden
        >
          <ProductGlyph accent={accent} />
        </div>
        {!comingSoon ? (
          <ArrowUpRight
            className="h-5 w-5 text-[var(--fg-subtle)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--fg)]"
            aria-hidden
          />
        ) : (
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
            Coming
          </span>
        )}
      </div>
      <div className="mt-8">
        <h3 className="font-[var(--font-display)] text-2xl font-medium tracking-tight text-[var(--fg)]">
          {name}
        </h3>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">{tagline}</p>
      </div>
      <p className="mt-5 text-sm leading-relaxed text-[var(--fg-muted)]">
        {description}
      </p>
    </Wrapper>
  );
}

function ProductGlyph({ accent }: { accent: ProductTileProps["accent"] }) {
  if (accent === "pulse") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12h4l3-8 4 16 3-8h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (accent === "brief") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6h16M4 12h10M4 18h13" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M7 12h10" strokeLinecap="round" />
    </svg>
  );
}
