/**
 * Customer logo entries for the landing-page social-proof strip.
 *
 * Kept empty until we have real, permissioned logos to display.
 * Populating this array surfaces the strip automatically — no code
 * change needed elsewhere. An empty array renders nothing: no
 * section, no label, no placeholder.
 */

export interface CustomerLogo {
  /** /public-relative SVG path (e.g. "/logos/acme.svg") or absolute URL. */
  src: string;
  /** Accessible alt text — required. */
  alt: string;
  /** Optional display name if different from alt. */
  name?: string;
  /** Optional link to the customer's site or case study. */
  href?: string;
  /** Optional explicit width in px. Defaults to auto within the row height. */
  width?: number;
  /** Optional explicit height in px. Defaults to 32. */
  height?: number;
}

export const customerLogos: CustomerLogo[] = [];
