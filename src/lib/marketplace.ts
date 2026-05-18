// Marketplace product data layer. Self-contained and decoupled from
// src/lib/types.ts (which scopes the HubSpot product catalog and the
// entitlement domain). New products added here flow into the
// marketplace grid and the dynamic detail route automatically.

export interface MarketplaceProduct {
  slug: string;
  name: string;
  tagline: string;
  price: number;
  priceLabel: string;
  licenseTerms: string;
  platform: "Windows" | "Mac" | "Linux";
  category: string;
  cardDescription: string;
  heroLede: string;
  sections: { heading: string; body: string }[];
  downloadBundle: string[];
  systemRequirements: string[];
  syncAddon?: { heading: string; body: string };
  docsUrl?: string;
}

export const MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  {
    slug: "atelier",
    name: "Atelier",
    tagline:
      "Wedding planning software for planners running multiple weddings at once.",
    price: 149,
    priceLabel: "$149 perpetual",
    licenseTerms: "30-day money-back guarantee",
    platform: "Windows",
    category: "Desktop App",
    cardDescription:
      "A Windows desktop app for professional wedding planners. Eleven-tab workspace per wedding, CRM pipeline, and a day-of run-of-show mode. One install, one planner, your data stays on your machine.",
    heroLede:
      "Atelier runs on your machine, not in a browser tab. Every wedding you manage lives in one local workspace: timeline, vendors, guests, seating, budget, contracts, and a day-of mode that runs the show. You own the install and you own the data.",
    sections: [
      {
        heading: "Eleven tabs per wedding, no toolbelt to learn",
        body:
          "Each wedding gets the same workspace: Timeline, Vendors, Guests, Seating, Style (mood boards), Budget, Payments, Documents, Contracts, Tasks, Notes. The tabs are tuned to the wedding you are running this week, not configured up front. Open a wedding and every surface is already in place.",
      },
      {
        heading: "A CRM pipeline for the front of the business",
        body:
          "Atelier ships with a leads kanban, lead activities, proposals, and a one-click conversion from a won lead into a real wedding workspace. The CRM lives inside the same app as the planning workspaces, so you stop juggling a separate sales tool for prospects you have already won.",
      },
      {
        heading: "Day-of mode, plus the phone-friendly LAN view",
        body:
          "When the wedding actually happens, switch the workspace into Day-of mode. The full run-of-show appears with Start, Complete, and Skip buttons on every event, an incident log, and tap-to-call links on every vendor. A phone-friendly LAN view runs alongside it: scan the QR from the desktop app on your phone and you have the run-of-show on your hip, served over the venue WiFi from your own laptop.",
      },
      {
        heading: "You own the install and the data",
        body:
          "The source is unobfuscated. There is no DRM, no analytics, no telemetry, no crash reporter. Your wedding data lives in a local SQLite file you can back up with any tool. Four outbound network surfaces are disclosed up front (license activation and daily heartbeat, opt-in auto-update check, atelier:// deep link for post-checkout return, and the optional Sync add-on), and none of them ever sends wedding data.",
      },
      {
        heading: "Other tools that earn their weight",
        body:
          "Bulk CSV guest import with fuzzy column mapping and a 30-second undo, print-to-PDF on Timeline, Seating, and Contracts, a calendar with month, week, and day views, reports for revenue, profitability, lead funnel, vendor performance, and workload heatmap, plus wedding templates that snapshot a wedding's structure and apply it to a fresh one.",
      },
    ],
    downloadBundle: [
      "Windows installer (.exe)",
      "Full unobfuscated source code",
      "All product documentation",
    ],
    systemRequirements: [
      "Windows 10 or 11, 64-bit",
      "Approximately 200 MB free disk space",
      "First launch shows a Windows SmartScreen prompt: code signing is deferred until our EV certificate purchase, this is a known and documented v1 trade-off",
    ],
    syncAddon: {
      heading: "Dunamis Sync (optional add-on)",
      body:
        "Sync is off by default. It is sold separately under its own subscription and its own terms, and exists so a planner with Atelier on a desktop can pair an encrypted view onto a phone or tablet. The encryption key never leaves your machine. The Atelier perpetual license and any Sync subscription are fully independent: cancelling one never disables the other, and Atelier keeps running indefinitely on supported hardware whether or not Sync is active.",
    },
    docsUrl: "/build-services/products/atelier/docs",
  },
];

// Helper functions for the grid filter UI. Both derive distinct values
// from MARKETPLACE_PRODUCTS so adding a new product auto-extends the
// filter dropdowns without code changes.
export function getMarketplacePlatforms(): MarketplaceProduct["platform"][] {
  const set = new Set<MarketplaceProduct["platform"]>();
  for (const p of MARKETPLACE_PRODUCTS) set.add(p.platform);
  return Array.from(set).sort();
}

export function getMarketplaceCategories(): string[] {
  const set = new Set<string>();
  for (const p of MARKETPLACE_PRODUCTS) set.add(p.category);
  return Array.from(set).sort();
}

export function getMarketplaceProductBySlug(
  slug: string,
): MarketplaceProduct | undefined {
  return MARKETPLACE_PRODUCTS.find((p) => p.slug === slug);
}
