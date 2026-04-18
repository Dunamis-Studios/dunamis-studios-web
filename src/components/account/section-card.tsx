import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  danger?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  danger,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        "rounded-xl border bg-[var(--bg-elevated)]",
        danger
          ? "border-[var(--color-danger)]/35"
          : "border-[var(--border)]",
        className,
      )}
    >
      <header
        className={cn(
          "flex flex-col gap-1 border-b p-6",
          danger ? "border-[var(--color-danger)]/25" : "border-[var(--border)]",
        )}
      >
        <h2
          className={cn(
            "font-[var(--font-display)] text-lg font-medium tracking-tight",
            danger ? "text-[var(--color-danger)]" : "text-[var(--fg)]",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-[var(--fg-muted)]">{description}</p>
        ) : null}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}
