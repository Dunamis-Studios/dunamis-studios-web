import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral:
          "border-[var(--border)] bg-[var(--bg-muted)] text-[var(--fg-muted)]",
        accent:
          "border-transparent bg-[color-mix(in_oklch,var(--color-brand-500)_15%,transparent)] text-[var(--color-brand-400)]",
        success:
          "border-transparent bg-[color-mix(in_oklch,var(--color-success)_15%,transparent)] text-[var(--color-success)]",
        warning:
          "border-transparent bg-[color-mix(in_oklch,var(--color-warning)_15%,transparent)] text-[var(--color-warning)]",
        danger:
          "border-transparent bg-[color-mix(in_oklch,var(--color-danger)_15%,transparent)] text-[var(--color-danger)]",
        pulse:
          "border-transparent bg-[color-mix(in_oklch,var(--color-pulse-500)_15%,transparent)] text-[var(--color-pulse-500)]",
        brief:
          "border-transparent bg-[color-mix(in_oklch,var(--color-brief-500)_18%,transparent)] text-[var(--color-brief-500)]",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
    trial: "warning",
    active: "success",
    past_due: "danger",
    canceled: "neutral",
  };
  const label = status.replace("_", " ");
  const variant = map[status] ?? "neutral";
  return (
    <Badge variant={variant} className="capitalize">
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-glow"
      />
      {label}
    </Badge>
  );
}
