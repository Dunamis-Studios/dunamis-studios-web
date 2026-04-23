/**
 * Plain metadata for every legal document. Lives in a TypeScript-only
 * file (no JSX) so non-UI callers — API routes that stamp the accepted
 * version onto audit events, sitemap generators, email templates — can
 * import it without pulling the React content modules' JSX runtime into
 * their bundles.
 *
 * The TSX content modules under this directory spread this record into
 * their exported LegalDocument so there is exactly one source of truth
 * for version and lastUpdated across the rendered pages and any
 * downstream consumer (HubSpot terms_accepted events, etc.).
 *
 * Bump the version when making substantive changes that should trigger
 * re-acceptance for existing customers; bump only lastUpdated for
 * copy-edit or typo fixes that don't need re-acceptance.
 */

export interface LegalDocumentMetadata {
  title: string;
  lastUpdated: string;
  version: string;
}

export const LEGAL_METADATA = {
  termsMaster: {
    title: "Terms of Service",
    lastUpdated: "April 23, 2026",
    version: "2.0",
  },
  debriefAddendum: {
    title: "Debrief Service Addendum",
    lastUpdated: "April 23, 2026",
    version: "2.0",
  },
  propertyPulseAddendum: {
    title: "Property Pulse Service Addendum",
    lastUpdated: "April 23, 2026",
    version: "2.0",
  },
  privacy: {
    title: "Privacy Policy",
    lastUpdated: "April 23, 2026",
    version: "2.0",
  },
  dpa: {
    title: "Data Processing Addendum",
    lastUpdated: "April 20, 2026",
    version: "1.0",
  },
} as const satisfies Record<string, LegalDocumentMetadata>;

export type LegalDocumentKey = keyof typeof LEGAL_METADATA;
