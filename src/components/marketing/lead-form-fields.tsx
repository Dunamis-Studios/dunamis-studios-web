"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Shared form-field primitives for HubSpot-mirrored lead capture
 * surfaces (Notify Interests, Free Tools - Lead Capture, Email Courses
 * - Signup, Custom Development Inquiry). Every form that posts to a
 * HubSpot form must collect firstname + lastname + email, all required,
 * so the helpers below are imported wherever a /api/* route mirrors
 * into a HubSpot Forms API submission.
 *
 * The visual asterisk on required fields is aria-hidden because the
 * <Input> elements already carry `required` and `aria-required="true"`
 * for assistive tech.
 */

export function RequiredMark() {
  return (
    <span
      aria-hidden
      className="ml-0.5 text-[var(--color-danger)]"
      title="Required"
    >
      *
    </span>
  );
}

export interface LeadNameFieldsProps {
  /** Prefix for input IDs to avoid collisions when multiple forms share a page. */
  idPrefix: string;
  firstName: string;
  lastName: string;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  disabled?: boolean;
}

/**
 * First-name + last-name pair. Both required on every HubSpot-mirrored
 * lead form. Renders as a 2-column grid on `sm+`, stacked below.
 */
export function LeadNameFields({
  idPrefix,
  firstName,
  lastName,
  setFirstName,
  setLastName,
  disabled,
}: LeadNameFieldsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor={`${idPrefix}-firstname`}>
          First name
          <RequiredMark />
        </Label>
        <Input
          id={`${idPrefix}-firstname`}
          type="text"
          autoComplete="given-name"
          required
          aria-required="true"
          placeholder="Pat"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={disabled}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-lastname`}>
          Last name
          <RequiredMark />
        </Label>
        <Input
          id={`${idPrefix}-lastname`}
          type="text"
          autoComplete="family-name"
          required
          aria-required="true"
          placeholder="Lee"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={disabled}
          className="mt-1.5"
        />
      </div>
    </div>
  );
}
