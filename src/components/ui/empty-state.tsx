import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-subtle)]/40 px-8 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg-muted)]">
          {icon}
        </div>
      ) : null}
      <h3 className="font-[var(--font-display)] text-lg font-medium tracking-tight text-[var(--fg)]">
        {title}
      </h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--fg-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-6 inline-flex flex-wrap gap-3 justify-center">{action}</div> : null}
    </div>
  );
}
