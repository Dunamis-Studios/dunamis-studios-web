/**
 * Atelier marketing-page content — single source of truth.
 *
 * Pricing, feature copy, comparison rows, FAQ, hero block. All read by
 * /build-services/products/atelier/ and any future surface that needs
 * to talk about Atelier (footer chips, related-products carousel,
 * JSON-LD generation).
 *
 * Atelier is the studio's first prebuilt product (Software Projects
 * lane). It does NOT plug into the HubSpot product machinery — no
 * entitlement records, no shared Redis namespace under
 * dunamis:entitlement:*, no Stripe webhook. Pricing here is
 * descriptive copy, not a Stripe price ID lookup.
 *
 * Pricing model: a single $149 perpetual license. Customization is
 * intentionally NOT a pre-purchase tier — customers buy the software,
 * use it, and may engage Dunamis Studios for a custom development
 * scope after the fact. That keeps the marketing page focused on the
 * product itself instead of selling services up front.
 */

// ---------------------------------------------------------------------------
// Pricing — single tier
// ---------------------------------------------------------------------------

export interface AtelierPricing {
  /** Display price string. */
  priceDisplay: string;
  /** Numeric anchor used for JSON-LD Offer.price. */
  priceUSD: number;
  /** What's actually in the box. */
  includes: string[];
  /** Fine-print line shown under the pricing card. */
  footnote: string;
}

export const ATELIER_PRICING: AtelierPricing = {
  priceDisplay: "$149",
  priceUSD: 149,
  includes: [
    "Atelier installer for Windows 10 / 11",
    "Perpetual license — yours forever, no expiry",
    "Every feature unlocked from day one — CRM, day-of mode, vendors, guests, seating, budget, payments, contracts, reports, local API",
    "Setup wizard that gets you to a working studio profile",
    "Free bug fixes — no time limit while we operate the major version you bought",
    "Local-first: no account, no cloud, no telemetry",
    "Unobfuscated source ships with the install",
  ],
  footnote:
    "One license per studio. Run it on as many of your own machines as you need.",
};

/**
 * Post-purchase customization callout. Rendered as a small block under
 * the pricing card so it's visible to a buyer comparing the price, but
 * stays out of the way of the headline offer. Customization is a
 * separate, scoped engagement — never bundled into the up-front
 * purchase.
 */
export const ATELIER_POST_PURCHASE_CALLOUT = {
  body: "Need help getting set up, or want custom features? Once you've used Atelier, we offer custom development engagements scoped per-customer. Reach out anytime.",
  ctaLabel: "Talk to us",
  ctaHref: "/contact",
};

// ---------------------------------------------------------------------------
// Hero + answer block + problem
// ---------------------------------------------------------------------------

export const ATELIER_HERO = {
  eyebrow: "Atelier — for wedding planners",
  name: "Atelier",
  headline:
    "The wedding planner workspace that lives on your computer, not in a vendor's cloud.",
  lede: "A perpetual-license Windows desktop app for professional wedding planners. CRM, day-of run-of-show, vendors, guests, seating, budget, payments, contracts — every wedding in one workspace, owned by you.",
};

export const ATELIER_ANSWER_BLOCK =
  "Atelier is desktop software for wedding planners, sold once and yours forever. It runs on your Windows PC, stores every wedding in a single SQLite file you control, and never phones home. No subscription, no per-seat fees, no data leaving your machine.";

export const ATELIER_PROBLEM = {
  title: "Your weddings deserve a workspace, not a rented login.",
  body: "Most planning tools are SaaS — you pay every month, your data lives on someone else's servers, and the day the vendor pivots or doubles their pricing is the day your business has a problem. Atelier is the alternative: a real desktop app with a CRM pipeline, an 11-tab workspace per wedding, day-of mode, vendor and guest management, budgets, payments, contracts, and reports. You buy it once. The data stays on your machine. The lights stay on whether or not your internet does.",
};

// ---------------------------------------------------------------------------
// Features — what's actually in the box
// ---------------------------------------------------------------------------

export const ATELIER_FEATURES: { title: string; body: string }[] = [
  {
    title: "CRM pipeline → wedding workspace",
    body: "Capture leads, send proposals, convert to a full wedding workspace in one click. Team-member assignment dropdowns end-to-end, so every lead has an owner.",
  },
  {
    title: "Eleven-tab per-wedding workspace",
    body: "Timeline, Vendors, Guests, Seating, Style, Budget, Payments, Documents, Contracts, Tasks, Notes. Every wedding is a real workspace — not a row in a spreadsheet.",
  },
  {
    title: "Day-of mode for the venue",
    body: "A phone-friendly route that flips event status with Start / Complete / Skip controls, captures incidents on the fly, and turns vendor numbers into tappable tel: links. Built for actual day-of, not for a desk.",
  },
  {
    title: "Money in both directions",
    body: "Payments come in, disbursements go out. Disbursements link to specific budget line items, so the budget tab always reflects reality without manual reconciliation.",
  },
  {
    title: "Templates that capture your playbook",
    body: "Save a wedding's timeline and budget as a template. Apply it to a fresh wedding in one click — the next ten weddings start from your hard-won repeatable process, not a blank canvas.",
  },
  {
    title: "Calendar, reports, notifications",
    body: "Month / Week / Day calendar with a thick today indicator. Reports with a sticky filter row that re-derives each section. Bell-icon and Windows tray notifications for overdue and due-soon items, gated by quiet hours.",
  },
];

// ---------------------------------------------------------------------------
// Comparison vs subscription planning tools
// ---------------------------------------------------------------------------

export const ATELIER_COMPARISON: {
  headline: string;
  intro: string;
  themLabel: string;
  rows: { dimension: string; us: string; them: string }[];
} = {
  headline: "What changes when the workspace lives on your machine.",
  intro:
    "Subscription planning tools (Aisle Planner, HoneyBook, Planning Pod, and the rest) are real software with real teams behind them. Atelier is the alternative shape: a desktop app you buy once. The trade-offs land in a different place.",
  themLabel: "Subscription tools",
  rows: [
    {
      dimension: "Pricing model",
      us: "One-time purchase. $149 perpetual license, paid once.",
      them: "Monthly or annual subscription. $19–$80+ per month, every month, indefinitely.",
    },
    {
      dimension: "Where your data lives",
      us: "A single SQLite file on your Windows PC. You can back it up, copy it, or open it with any SQLite browser.",
      them: "On the vendor's servers. You query it through their UI or their API.",
    },
    {
      dimension: "Internet dependency",
      us: "Fully offline. Atelier launches and runs without a network connection.",
      them: "Online-only. Lose your connection, lose access to your weddings.",
    },
    {
      dimension: "Per-team-member fees",
      us: "Flat per install. Add as many team members as you want at no extra cost.",
      them: "Per-seat adders, often $10–$30 per additional user per month.",
    },
    {
      dimension: "Updates",
      us: "Bug fixes free indefinitely. Major version upgrades (v2, v3) are separate optional purchases at a discount for existing customers.",
      them: "Continuous as long as you keep paying. Stop paying, stop receiving anything.",
    },
    {
      dimension: "If the vendor pivots",
      us: "Your install keeps working. The license verifies locally; nothing depends on a server we run.",
      them: "Service ends or pricing changes — your workflow has to follow.",
    },
    {
      dimension: "Telemetry and tracking",
      us: "None. The only outbound call is an opt-out GitHub update check.",
      them: "Standard SaaS analytics — usage tracked, behavior logged, often shared with third parties.",
    },
  ],
};

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

export const ATELIER_FAQ: { q: string; a: string }[] = [
  {
    q: "Is this really a one-time purchase?",
    a: "Yes. You buy Atelier once for $149, receive an installer and a perpetual license, and that license is verified offline against a key embedded in the app. There's no subscription, no expiry, no renewal email. Future major versions (v2, v3) will be offered as separate optional purchases at a discount for existing customers, never as a forced upgrade.",
  },
  {
    q: "Does support ever expire?",
    a: "No. Bug fixes are free for as long as Dunamis Studios operates the major version you bought — there's no 30-day, 90-day, or 12-month window. If a bug stops Atelier from running on a supported Windows configuration, we fix it, regardless of when you purchased. Major version upgrades (v2, v3) are a separate optional purchase with loyalty pricing for existing customers; the major you own keeps receiving bug fixes.",
  },
  {
    q: "Does Atelier work without an internet connection?",
    a: "Yes. Atelier launches, opens weddings, and runs day-of mode without a network. The only outbound call the app makes is an optional GitHub update check, which you can turn off in Settings → Software Updates.",
  },
  {
    q: "Where does my data live?",
    a: "In a single SQLite file at C:\\Users\\<you>\\AppData\\Roaming\\studios.dunamis.atelier\\atelier.sqlite. You can back it up with any tool, copy it to a new machine, or inspect it with a free SQLite browser. We never receive a copy.",
  },
  {
    q: "Does Atelier work on Mac?",
    a: "Not yet. The current build is Windows 10 and 11 only. A macOS build is on the roadmap but is not in the v1 package. If Mac support is a hard requirement for your studio, the honest answer is to wait or to pick a different tool.",
  },
  {
    q: "How does the team see the same weddings?",
    a: "Atelier is single-machine in v1 — the SQLite file lives on one PC. Studios with multiple planners typically install Atelier on a shared workstation in the office, or use a synced folder (OneDrive, Dropbox) pointed at the data directory. A multi-user sync mode is on the roadmap.",
  },
  {
    q: "Can I import my existing weddings from another tool?",
    a: "Yes — the localhost REST API ships with the install and is documented at /api/docs in the running app, so any developer (yours or ours) can write a one-off import script from a spreadsheet or another tool's export. The data never leaves your laptop. If you'd rather pay us to do the import, that's a post-purchase custom-development engagement we can scope after you have Atelier in hand.",
  },
  {
    q: "What if I need a feature that isn't in the box?",
    a: "Buy Atelier first, use it, then talk to us. Customization is a post-purchase service we scope per customer — not a tier you pre-pay for. Once you've spent time in the app and know exactly what you'd change, a discovery call turns that list into a fixed-price scope, and the customization ships built into your install. Atelier ships with unobfuscated source, so source-level changes are on the table.",
  },
  {
    q: "Is there a free trial?",
    a: "Not in v1. The tradeoff for one-time pricing is that a free trial would require the license-server overhead the local-first model exists specifically to avoid. If you're on the fence, email us first — happy to walk you through Atelier on a screen-share before you buy, no pitch, no pressure.",
  },
  {
    q: "What about a Mac, Linux, or web version?",
    a: "Windows is the v1 target because that's where most professional wedding planners we talked to actually work. Mac is the most likely next platform; Linux and a web version are not currently planned. The data file is portable across any platform that can read SQLite, so when Mac ships, your existing data comes with you.",
  },
];
