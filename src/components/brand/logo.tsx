import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Dunamis Studios wordmark — custom geometric glyph + serif wordmark.
 * The glyph is a stylized "δ" (delta, greek root of dunamis) rendered as a
 * split circle — two arcs that together form a whole, echoing the studio's
 * multi-product structure.
 */
export function Logo({
  className,
  label = true,
  size = 20,
}: {
  className?: string;
  label?: boolean;
  size?: number;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 text-[var(--fg)] transition-opacity hover:opacity-80 focus-visible:opacity-80",
        className,
      )}
      aria-label="Dunamis Studios home"
    >
      <LogoMark size={size} />
      {label ? (
        <span className="font-[var(--font-display)] text-[17px] font-medium tracking-[-0.02em]">
          Dunamis<span className="text-[var(--fg-subtle)]"> Studios</span>
        </span>
      ) : null}
    </Link>
  );
}

export function LogoMark({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {/* outer ring */}
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="currentColor"
        strokeWidth="1.75"
        opacity="0.3"
      />
      {/* left arc — solid */}
      <path
        d="M16 3 A13 13 0 0 0 16 29"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* right flourish — small accent dot */}
      <circle cx="22" cy="10" r="2" fill="currentColor" />
    </svg>
  );
}
