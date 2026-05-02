import * as React from "react";
import { cn } from "@/lib/utils";

export function Container({
  className,
  size = "md",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "prose" | "md" | "lg" | "xl";
}) {
  // "prose" sits between "sm" (centered narrow text like 404 / coming-soon
  // splash) and "md" (full marketing content). Tuned for article and guide
  // body copy where the line measure had been collapsing to roughly a
  // third of the viewport on desktop. 4xl gives the prose surfaces a
  // comfortable reading column on a 1920px viewport without crossing
  // into the over-long line measure of md/lg.
  const map: Record<typeof size, string> = {
    sm: "max-w-2xl",
    prose: "max-w-4xl",
    md: "max-w-5xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
  };
  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", map[size], className)}
      {...props}
    />
  );
}

export function Section({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn("py-16 sm:py-24 lg:py-32 relative", className)}
      {...props}
    />
  );
}

export function Stack({
  className,
  gap = 4,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { gap?: 2 | 3 | 4 | 6 | 8 | 10 | 12 }) {
  const g: Record<number, string> = {
    2: "gap-2",
    3: "gap-3",
    4: "gap-4",
    6: "gap-6",
    8: "gap-8",
    10: "gap-10",
    12: "gap-12",
  };
  return (
    <div className={cn("flex flex-col", g[gap], className)} {...props} />
  );
}

export function Grid({
  className,
  cols = 3,
  gap = 6,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  cols?: 1 | 2 | 3 | 4;
  gap?: 3 | 4 | 6 | 8;
}) {
  const c: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };
  const g: Record<number, string> = {
    3: "gap-3",
    4: "gap-4",
    6: "gap-6",
    8: "gap-8",
  };
  return <div className={cn("grid", c[cols], g[gap], className)} {...props} />;
}

interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-2 min-w-0">
        {eyebrow ? (
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl font-medium tracking-tight text-[var(--fg)]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-[var(--fg-muted)] text-base">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
