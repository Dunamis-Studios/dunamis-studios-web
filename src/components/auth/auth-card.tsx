import * as React from "react";

interface AuthCardProps {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <div className="animate-fade-up">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="font-[var(--font-display)] text-2xl font-medium tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 text-sm text-[var(--fg-muted)]">{description}</p>
          ) : null}
        </div>
        {children}
      </div>
      {footer ? (
        <div className="mt-6 text-center text-sm text-[var(--fg-muted)]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
