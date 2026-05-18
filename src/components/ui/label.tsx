/**
 * Label primitive plus FieldError / FieldHint subcomponents. Used
 * together to build the standard labeled-field stack on every form
 * surface in the site.
 *
 * The Label is a thin wrapper around Radix UI's <Label> (which forwards
 * htmlFor and pairs with peer-disabled styling). FieldError uses
 * role="alert" so screen readers announce validation failures the
 * moment they appear; FieldHint is a plain styled paragraph for the
 * helper line under an input.
 */
"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium text-[var(--fg)] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-xs text-[var(--color-danger)] mt-1.5">
      {children}
    </p>
  );
}

export function FieldHint({ children }: { children?: React.ReactNode }) {
  return (
    <p className="text-xs text-[var(--fg-subtle)] mt-1.5">{children}</p>
  );
}
