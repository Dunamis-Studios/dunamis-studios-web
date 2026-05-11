import type { LegalDocument } from "./types";
import { termsAddendumAtelier } from "./terms-addendum-atelier";
import { termsAddendumDebrief } from "./terms-addendum-debrief";
import { termsAddendumPropertyPulse } from "./terms-addendum-property-pulse";

export interface TermsAddendumEntry {
  slug: string;
  productLabel: string;
  doc: LegalDocument;
}

export const TERMS_ADDENDUMS: TermsAddendumEntry[] = [
  { slug: "atelier", productLabel: "Atelier", doc: termsAddendumAtelier },
  { slug: "debrief", productLabel: "Debrief", doc: termsAddendumDebrief },
  {
    slug: "property-pulse",
    productLabel: "Property Pulse",
    doc: termsAddendumPropertyPulse,
  },
];

export function findTermsAddendumBySlug(slug: string): TermsAddendumEntry | undefined {
  return TERMS_ADDENDUMS.find((entry) => entry.slug === slug);
}

export interface RefundAddendumEntry {
  slug: string;
  productLabel: string;
  windowSummary: string;
}

export const REFUND_ADDENDUMS: RefundAddendumEntry[] = [
  {
    slug: "atelier",
    productLabel: "Atelier",
    windowSummary: "14 days unactivated, 30 days for reproducible defects on activated",
  },
  {
    slug: "debrief",
    productLabel: "Debrief",
    windowSummary: "Monthly subscription, no pro-rata refund except as required by law",
  },
  {
    slug: "property-pulse",
    productLabel: "Property Pulse",
    windowSummary: "7 days from install",
  },
];

export function findRefundAddendumBySlug(slug: string): RefundAddendumEntry | undefined {
  return REFUND_ADDENDUMS.find((entry) => entry.slug === slug);
}
