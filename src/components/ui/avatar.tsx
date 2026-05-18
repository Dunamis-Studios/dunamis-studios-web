/**
 * Avatar primitive set: Avatar (the rounded container), AvatarImage
 * (the actual image), AvatarFallback (initials or icon when the image
 * fails or is absent). Wraps Radix UI's Avatar so the image-failure
 * fallback is handled automatically.
 *
 * Used by the account dashboard, admin customer rows, and the site
 * navigation's account menu. Pair AvatarFallback with the initials()
 * helper from @/lib/utils for the two-character glyph.
 */
"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

export const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--bg-muted)]",
      className,
    )}
    {...props}
  />
));
Avatar.displayName = "Avatar";

export const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = "AvatarImage";

export const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center text-xs font-medium text-[var(--fg-muted)]",
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";
