/**
 * Atelier marketing-page content — single source of truth.
 *
 * Pricing tiers, feature copy, comparison rows, FAQ, hero block. All
 * read by /build-services/products/atelier/ and any future surface
 * that needs to talk about Atelier (footer chips, related-products
 * carousel, JSON-LD generation).
 *
 * Atelier is the studio's first prebuilt product (Software Projects
 * lane). It does NOT plug into the HubSpot product machinery — no
 * entitlement records, no shared Redis, no Stripe webhook. Pricing
 * here is descriptive copy, not a Stripe price ID lookup.
 */

// ---------------------------------------------------------------------------
// Pricing tiers
// ---------------------------------------------------------------------------

export type AtelierTierName = "self-serve" | "done-for-you" | "done-for-you-custom";

export interface AtelierTier {
  /** Internal slug used in the buy form payload + Redis keys. */
  name: AtelierTierName;
  /** Display label on the pricing card. */
  label: string;
  /** One-line description under the label. */
  tagline: string;
  /** Display price string. Uses a range for the custom tier. */
  priceDisplay: string;
  /** Numeric anchor used for JSON-LD Offer.price (low end of range). */
  priceUSD: number;
  /** What's actually delivered at this tier. */
  includes: string[];
  /** Marker for the recommended tier — the middle tier in the array. */
  recommended?: boolean;
  /** Optional fine-print shown under the tier card. */
  footnote?: string;
}

export const ATELIER_TIERS: AtelierTier[] = [
  {
    name: "self-serve",
    label: "Self-Serve",
    tagline: "The installer, the license, the docs. You take it from there.",
    priceDisplay: "$149",
    priceUSD: 149,
    includes: [
      "Atelier installer for Windows 10 / 11",
      "Perpetual license — yours forever, no expiry",
      "Every feature unlocked from day one",
      "Setup wizard that gets you to a working studio profile",
      "30 days of bug-fix support after purchase",
      "Local-first: no account, no cloud, no telemetry",
    ],
    footnote: "One license per studio. Run it on as many of your own machines as you need.",
  },
  {
    name: "done-for-you",
    label: "Done For You",
    tagline: "We install Atelier on your machine and load it with your studio's data.",
    priceDisplay: "$499",
    priceUSD: 499,
    recommended: true,
    includes: [
      "Everything in Self-Serve",
      "Remote install on your Windows machine via screen-share",
      "Studio profile, logo, and team set up by us",
      "Up to 25 existing weddings imported from your spreadsheet or current tool",
      "Up to 50 vendors imported with categories and contact info",
      "Two 45-min training calls — one for you, one for the team",
      "60 days of bug-fix support after purchase",
    ],
    footnote: "We never receive a copy of your data. The import runs on your machine, on your call.",
  },
  {
    name: "done-for-you-custom",
    label: "Done For You + Customization",
    tagline: "Atelier with the workflow tweaks your studio actually needs.",
    priceDisplay: "$1,499 – $2,500",
    priceUSD: 1499,
    includes: [
      "Everything in Done For You",
      "Discovery call to scope the customization",
      "Custom fields, templates, and report tweaks built into your install",
      "Optional integration scripts (e.g. a Google Calendar sync, a Stripe payments importer)",
      "Source-level changes to the Atelier code if scope warrants it",
      "Six months of bug-fix support, plus the customizations you bought",
      "Final price agreed up-front after discovery — no scope creep",
    ],
    footnote: "Quote depends on scope. Discovery call is free; you only pay if you choose to proceed.",
  },
];

// ---------------------------------------------------------------------------
// Hero + answer block + problem
// ---------------------------------------------------------------------------

export const ATELIER_HERO = {
  eyebrow: "Atelier — for wedding planners",
  name: "Atelier",
  headline: "The wedding planner workspace that lives on your computer, not in a vendor's cloud.",
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
  {
    title: "Local REST API for your other tools",
    body: "A localhost API on port 7423 exposes the data model to anything you want to wire up — Zapier, custom scripts, your own dashboards. Per-installation Bearer key. /api/docs ships in-app.",
  },
  {
    title: "PDF export, milestone playbook, contracts",
    body: "Contracts and the day-of run-of-show export to PDF straight from the app. Milestone playbook gaps surface as dashboard badges and a dismissible wedding-detail banner — the workspace tells you what's late, you don't have to ask.",
  },
  {
    title: "No subscription. Ever.",
    body: "Pay once, own the install. Atelier never expires, never disables features after a trial, and never holds your data hostage. The license is verified locally — no internet required to launch.",
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
      us: "One-time purchase. Three perpetual tiers from $149 to $2,500.",
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
      dimension: "If the vendor pivots",
      us: "Your install keeps working. The license verifies locally; nothing depends on a server we run.",
      them: "Service ends or pricing changes — your workflow has to follow.",
    },
    {
      dimension: "Telemetry and tracking",
      us: "None. The only outbound call is an opt-out GitHub update check.",
      them: "Standard SaaS analytics — usage tracked, behavior logged, often shared with third parties.",
    },
    {
      dimension: "Customization",
      us: "Done For You + Customization tier ships source-level tweaks built into your install.",
      them: "Whatever the vendor's roadmap allows. Feature requests go in a queue.",
    },
  ],
};

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

export const ATELIER_FAQ: { q: string; a: string }[] = [
  {
    q: "Is this really a one-time purchase?",
    a: "Yes. You buy Atelier once, receive an installer and a perpetual license, and that license is verified offline against a key embedded in the app. There's no subscription, no expiry, no renewal email. Future major versions (v2, v3) will be offered as separate optional purchases at a discount, never as a forced upgrade.",
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
    q: "What happens if I need help after the support window ends?",
    a: "Email us. We're not going to ignore a paying customer because the calendar moved. The 30 / 60 / 180-day windows on the tiers are the included support — beyond that, bug fixes for issues that prevent the app from running on a supported configuration are still on us.",
  },
  {
    q: "Can I import my existing weddings from another tool?",
    a: "Yes — that's the Done For You tier. We screen-share with you, run the import on your machine from your spreadsheet or current tool's export, and the data never leaves your laptop. For Self-Serve, the localhost REST API ships with the install and is documented at /api/docs in the running app, so a developer can write a one-off import script.",
  },
  {
    q: "What if I need a feature that isn't in the box?",
    a: "Done For You + Customization is the answer. We scope the work in a free discovery call, agree on a fixed price, and ship the customization built into your install. Source-level changes are on the table — Atelier ships with unobfuscated source.",
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
