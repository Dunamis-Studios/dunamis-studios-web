/**
 * Debrief roadmap — canonical data source for
 * /products/debrief/roadmap.
 *
 * How to update (future-Josh, or whoever owns this next):
 *
 * 1. Pick the right array below: `shipped`, `inProgress`, `comingSoon`,
 *    or `exploring`. Items move from bottom to top as they progress
 *    (Exploring → Coming Soon → In Progress → Shipped). Delete from the
 *    old array when you add to the new one.
 *
 * 2. Each array has its own item shape, enforced by TypeScript. If you
 *    miss a required field (like `shippedAt` on a Shipped item), the
 *    build fails with a clear error — follow it rather than guessing.
 *
 * 3. Bump `LAST_UPDATED` below to today's date before you commit. The
 *    page reads it directly; nothing else picks it up automatically.
 *
 * Item shapes:
 *   Shipped       → { title, description, shippedAt: "Month YYYY" }
 *   In Progress   → { title, description, status: "short phrase" }
 *   Coming Soon   → { title, description, eta?: "Month YYYY" | "Q_ YYYY" }
 *   Exploring     → { title, description }
 *
 * `eta` on Coming Soon is optional — leave it off when the window is
 * genuinely uncertain. A blank ETA is more honest than a fake one.
 *
 * No voting, no comments, no CMS. Static display of committed data.
 */

export const LAST_UPDATED = "2026-04-19";

export interface ShippedItem {
  title: string;
  description: string;
  shippedAt: string;
}

export interface InProgressItem {
  title: string;
  description: string;
  status: string;
}

export interface ComingSoonItem {
  title: string;
  description: string;
  eta?: string;
}

export interface ExploringItem {
  title: string;
  description: string;
}

export const shipped: ShippedItem[] = [
  {
    title: "Transparent cost preview",
    description:
      "Token-accurate credit estimates before you generate a brief — no surprise drains on the monthly allotment.",
    shippedAt: "April 2026",
  },
  {
    title: "Admin-controlled per-brief context overrides",
    description:
      "Admins can tune which associations, properties, and engagements feed each handoff type — every change goes to the audit trail.",
    shippedAt: "April 2026",
  },
  {
    title: "Per-portal pricing with monthly credit allotments",
    description:
      "Starter / Pro / Enterprise tiers billed per HubSpot portal, with never-expiring add-on credit packs on top.",
    shippedAt: "April 2026",
  },
  {
    title: "Live credit balance updates",
    description:
      "The balance in the app header and in your Dunamis Studios dashboard reflects usage in real time — no refresh, no stale numbers.",
    shippedAt: "April 2026",
  },
  {
    title: "Message generation cost transparency",
    description:
      "The conversational handoff message has its own credit line in the cost preview, separate from the brief itself.",
    shippedAt: "April 2026",
  },
  {
    title: "HubSpot install → Dunamis account handoff",
    description:
      "Install Debrief from the HubSpot marketplace, land on a claim page, create or link a Dunamis account — stub entitlement attaches automatically.",
    shippedAt: "April 2026",
  },
];

export const inProgress: InProgressItem[] = [
  {
    title: "HubSpot marketplace listing and certification",
    description:
      "Working through HubSpot's certification review so Debrief is discoverable alongside every other CRM add-on.",
    status: "Listing prepared; awaiting HubSpot review",
  },
];

export const comingSoon: ComingSoonItem[] = [
  {
    title: "Workflow action: auto-generate briefs on ownership change",
    description:
      "Drop Debrief into a HubSpot workflow and have a brief generated + routed automatically whenever a deal or contact changes owners.",
  },
  {
    title: "Reconstruct: regenerate briefs from updated context",
    description:
      "Pull fresh record state and rerun the brief without re-entering sender notes — useful when a handoff sits unread and the deal has moved.",
  },
  {
    title: "Admin analytics dashboard",
    description:
      "Per-user brief volume, cost trends, and handoff adoption metrics — the view admins need to decide whether the tool is earning its seat.",
  },
];

export const exploring: ExploringItem[] = [
  {
    title: "Briefs as first-class HubSpot custom objects",
    description:
      "Native reporting, timeline events, and list views instead of a note attached to a record.",
  },
  {
    title: "Slack delivery for generated briefs",
    description:
      "DM the new owner in Slack the moment a handoff completes, with the brief inline.",
  },
  {
    title: "Gong / Chorus / Outreach / Salesloft integrations",
    description:
      "Import call transcripts and sequence state as brief context; export action items as tasks in the right tool.",
  },
  {
    title: "Cross-portal analytics",
    description:
      "For customers running multiple HubSpot portals, aggregate handoff metrics across portals they admin.",
  },
  {
    title: "AI-assisted handoff type detection",
    description:
      "Infer the right handoff template (Rep→CSM, BDR→AE, etc.) from role hints and record state, so the admin doesn't have to pick.",
  },
  {
    title: "Scheduled brief regeneration on stale content",
    description:
      "Detect when a handoff's context has drifted enough to matter and offer a fresh brief without manual intervention.",
  },
];
