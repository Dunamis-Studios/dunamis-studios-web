// Feature flags for site-wide surfaces. Flip a value here to hide or
// expose a whole class of pages, nav items, sitemap entries, and copy.
//
// hubspotSurfacesVisible: controls every customer-facing HubSpot product
// surface (the /custom-development service line, the 5-product catalog,
// HubSpot KB articles, HubSpot mentions in home/About copy, sitemap
// entries for HubSpot pages). The HubSpot CRM mirror used by support,
// contact, notify, courses, and tools forms is internal plumbing and
// stays functional regardless of this flag.
export const FEATURE_FLAGS = {
  hubspotSurfacesVisible: true,
} as const;
