/**
 * Site-wide feature flags. Flip a value here to hide or expose a whole
 * class of pages, nav items, sitemap entries, and copy in one shot.
 *
 * hubspotSurfacesVisible controls every customer-facing HubSpot
 * product surface (the /custom-development service line, the
 * 5-product catalog, HubSpot KB articles, HubSpot mentions in home /
 * About copy, sitemap entries for HubSpot pages). The HubSpot CRM
 * mirror used by support, contact, notify, courses, and tools forms
 * is internal plumbing and stays functional regardless of this flag.
 *
 * Flags are read at request time by server components, so toggling
 * here ships through the normal deploy pipeline. There is no runtime
 * override mechanism: the visibility decision is a deploy-time
 * choice, not a per-visitor experiment.
 */
export const FEATURE_FLAGS = {
  hubspotSurfacesVisible: true,
} as const;
