/**
 * Loading-state shimmer. Renders a rounded box with a continuously
 * sliding gradient so it reads visually as "something is loading
 * here" without committing to a specific layout shape. Callers size
 * it via the className so the skeleton matches the eventual content
 * (h-4 for a single line of text, h-32 for a card, etc.).
 */
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-gradient-to-r from-[var(--bg-muted)] via-[var(--bg-subtle)] to-[var(--bg-muted)]",
        className,
      )}
      {...props}
    />
  );
}
