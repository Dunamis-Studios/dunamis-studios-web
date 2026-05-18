/**
 * Standard text input. Pairs with Label / FieldError / FieldHint from
 * ./label.tsx for the full labeled-field stack. The optional `error`
 * prop is a convenience: passing a non-empty string flips
 * aria-invalid to true, which the styling block below picks up to
 * paint the danger border + ring. Callers render the actual error
 * text via FieldError so the message is bound to the field via
 * role="alert".
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, "aria-invalid": ariaInvalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={ariaInvalid ?? (error ? true : undefined)}
        className={cn(
          "h-10 w-full rounded-md border bg-[var(--bg-elevated)] px-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] transition-colors outline-none",
          "border-[var(--border)] hover:border-[var(--border-strong)]",
          "focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "aria-[invalid=true]:border-[var(--color-danger)] aria-[invalid=true]:focus:ring-[var(--color-danger)]/20",
          "file:mr-4 file:h-full file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
