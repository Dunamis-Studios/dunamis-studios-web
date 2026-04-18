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
