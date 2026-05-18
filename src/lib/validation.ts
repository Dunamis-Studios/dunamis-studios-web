/**
 * Zod schemas for every public form and route boundary in the site.
 *
 * Centralizing schemas here keeps the validation contract uniform: every
 * /api route uses parseJson(req, schema) from src/lib/api.ts and gets
 * the same per-field error map, NFC normalization, length caps, and
 * domain-specific reject rules (reserved portal ids, IANA-only time
 * zones, Vercel-Blob-only logo URLs, etc.). The React forms run the
 * same schemas client-side to surface errors before the network trip.
 *
 * Adding a new form: define its schema here next to the existing
 * ones, export the input type via z.infer, and have the API route call
 * parseJson with the schema. Do not bypass parseJson; the error
 * envelope shape and the per-field error map are the contract the
 * client relies on.
 */
import { z } from "zod";
import { isValidIanaTimeZone } from "./timezones";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Email is required")
  .max(254, "Email is too long")
  .email("Enter a valid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password is too long")
  .refine((pw) => /[\d\W_]/.test(pw), {
    message: "Password must contain a number or symbol",
  });

const nameSchema = z
  .string()
  .trim()
  // Normalize to NFC so visually-equivalent names (precomposed é vs
  // decomposed e + ◌́) round-trip to the same stored bytes. Without
  // this, two accounts could register names that render identically
  // but compare unequal, which is a real-world homoglyph attack vector
  // on human-facing screens (support console, shared workspace lists).
  .transform((s) => s.normalize("NFC"))
  .pipe(
    z
      .string()
      .min(1, "Required")
      .max(60, "Too long")
      .regex(
        /^[\p{L}\p{M}'\-. ]+$/u,
        "Only letters, spaces, apostrophes, hyphens",
      ),
  );

// Company / studio / business names. Wider character set than
// person names — companies legitimately use ampersands, parens,
// commas, digits, slashes ("Smith & Co.", "AT&T", "Studio 24",
// "Doe (Wedding Planning)"). Reject only `<` / `>` to keep obvious
// HTML/script payloads out of the stored value; React handles
// render-time escaping for everything else, so we don't need an
// aggressive allow-list that would reject legitimate names.
const companyNameMaxSchema = z
  .string()
  .trim()
  .transform((s) => s.normalize("NFC"))
  .pipe(
    z
      .string()
      .max(100, "Too long")
      .regex(/^[^<>]*$/, "Cannot contain < or >"),
  );

// Required at signup. Empty (after trim) rejects with "Required".
const companyNameRequiredSchema = companyNameMaxSchema.pipe(
  z.string().min(1, "Required"),
);

// Profile-update path. Accepts a string or null; the route handler
// coerces an empty string to null so the customer can clear the
// field if they mis-entered it at signup.
const companyNameOptionalSchema = companyNameMaxSchema.nullable();

// IANA time zone identifier (e.g., "America/New_York"). Validated
// against the platform's IANA list — we don't accept free-form
// strings because downstream consumers (Atelier dashboards, future
// scheduling features) rely on Intl.DateTimeFormat being able to
// resolve the value. Nullable so accounts can leave it unset until
// a product asks (Atelier setup screen is the first such product).
const timeZoneOptionalSchema = z
  .string()
  .max(80, "Too long")
  .refine(isValidIanaTimeZone, "Not a recognized time zone")
  .nullable();

// Logo URL. Always optional. The /api/account/logo endpoint owns
// the upload + the URL value; the profile-update endpoint accepts
// it primarily so the Atelier setup-screen save can include the
// URL alongside the rest of the fields in one PATCH after a
// successful upload. Accepts only HTTPS URLs on the Vercel Blob
// host — defense in depth against a customer pasting an arbitrary
// URL into the field.
const logoUrlOptionalSchema = z
  .string()
  .url("Must be a URL")
  .max(2000, "Too long")
  .refine(
    (u) => /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(u),
    "Logo must be hosted on Vercel Blob",
  )
  .nullable();

export const signupSchema = z
  .object({
    email: emailSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    companyName: companyNameRequiredSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(200),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(16).max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(16).max(200),
});

export const profileUpdateSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  companyName: companyNameOptionalSchema,
  timeZone: timeZoneOptionalSchema.optional(),
  logoUrl: logoUrlOptionalSchema.optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const productSlugSchema = z.enum(["property-pulse", "debrief"]);

// Reserved tokens that would look like admin / system accounts if they
// ever ended up in URLs or UI lists. HubSpot portalIds are numeric in
// production so normal traffic never hits these; the blocklist catches
// a misuse of the test-stub path that currently accepts arbitrary
// [a-zA-Z0-9_-]+ so e2e fixtures and local dev scaffolding can seed.
const RESERVED_PORTAL_IDS = new Set([
  "admin",
  "root",
  "system",
  "support",
  "test",
  "internal",
  "api",
  "null",
  "undefined",
]);

export const portalIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid portal id")
  .refine(
    (id) => !RESERVED_PORTAL_IDS.has(id.toLowerCase()),
    "This portal id is reserved",
  );

/**
 * Parse the `{product}:{portalId}` claim token used in the HubSpot-
 * install → Dunamis-signup handoff. Returns null if the shape or
 * components don't validate. Both halves are validated with their
 * respective schemas so callers can trust the result without
 * re-validating.
 */
export function parseClaimToken(
  raw: string | null | undefined,
): { product: z.infer<typeof productSlugSchema>; portalId: string } | null {
  if (!raw || typeof raw !== "string") return null;
  const idx = raw.indexOf(":");
  if (idx <= 0 || idx === raw.length - 1) return null;
  const productCandidate = raw.slice(0, idx);
  const portalIdCandidate = raw.slice(idx + 1);
  const productParsed = productSlugSchema.safeParse(productCandidate);
  if (!productParsed.success) return null;
  const portalIdParsed = portalIdSchema.safeParse(portalIdCandidate);
  if (!portalIdParsed.success) return null;
  return { product: productParsed.data, portalId: portalIdParsed.data };
}

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Custom-development contact form. Mirrors the field-name contract of the
 * HubSpot form `cfda52bd-4573-4e7e-9057-68d2aea2a10a` in portal 20867488,
 * so values can be POSTed straight through to the Submissions API without
 * a translation layer. Dropdown values are the literal HubSpot option
 * strings (label === value); see CLAUDE.md §15 on dropdown internal-value
 * casing rules.
 */
export const BUDGET_OPTIONS = [
  "Under $5K",
  "$5K-$15K",
  "$15K-$50K",
  "$50K+",
] as const;

export const TIMELINE_OPTIONS = [
  "ASAP",
  "This quarter",
  "Next quarter",
  "Just exploring",
] as const;

/**
 * Source surface that originated the inquiry. Drives pageUri/pageName
 * on the HubSpot submission so RevOps can segment leads by service line.
 * Keep narrow; do not let arbitrary strings reach the HubSpot context.
 */
export const CONTACT_SOURCES = [
  "hubspot-custom-development",
  "build-services",
  "general",
] as const;

export type ContactSource = (typeof CONTACT_SOURCES)[number];

export const contactSubmitSchema = z.object({
  firstname: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(80, "First name is too long"),
  lastname: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(80, "Last name is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Email is required")
    .max(254, "Email is too long")
    .email("Enter a valid email address"),
  company: z
    .string()
    .trim()
    .min(1, "Company is required")
    .max(120, "Company is too long"),
  what_are_you_trying_to_solve: z
    .string()
    .trim()
    .min(1, "Required")
    .max(5000, "Too long"),
  custom_dev_budget_range: z.enum(BUDGET_OPTIONS, {
    error: "Choose a budget range",
  }),
  custom_dev_timeline: z.enum(TIMELINE_OPTIONS, {
    error: "Choose a timeline",
  }),
  source: z.enum(CONTACT_SOURCES).optional(),
  /**
   * Cloudflare Turnstile token. Required on every public form
   * submission. The /api/contact-submit route verifies against
   * Cloudflare siteverify before forwarding to HubSpot; not included
   * in the HubSpot payload (buildFields enumerates fields explicitly).
   */
  turnstileToken: z.string().min(1, "Bot protection token required"),
});

export type ContactSubmitInput = z.infer<typeof contactSubmitSchema>;

/**
 * Atelier launch-notification interest form. The
 * /build-services/products/atelier page's #buy-atelier section POSTs
 * here. Atelier is in active development — submissions are
 * launch-notification entries, not purchases. The endpoint is NOT a
 * Stripe checkout; the schema below validates name + email + optional
 * business + optional notes only.
 *
 * Atelier is a single-tier $149 product (at launch). There is no
 * `tier` field on the payload; customization is a post-purchase
 * service engagement scoped per customer, not a pre-pay tier.
 */
export const atelierBuyRequestSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(80, "First name is too long"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(80, "Last name is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Email is required")
    .max(254, "Email is too long")
    .email("Enter a valid email address"),
  businessName: z
    .string()
    .trim()
    .max(120, "Business name is too long")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes are too long (2000 character limit)")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type AtelierBuyRequestInput = z.infer<typeof atelierBuyRequestSchema>;

/**
 * Customer support ticket form. Posted to /api/support-submit which
 * forwards the payload to a HubSpot form that is wired into the Help
 * Desk pipeline, so each submission opens a ticket.
 *
 * Field names mirror the HubSpot property internal names exactly (no
 * translation layer at the route boundary), matching the same
 * convention as contactSubmitSchema. Conditional required-when logic
 * lives in the React form's state machine; this schema treats every
 * conditional field as `.optional()` so a misclicked Category that
 * left a now-required field empty cannot fall through to a 500. The
 * form UI is the enforcement layer; the schema is the catch-all
 * shape validator.
 *
 * Enum option strings come straight from the HubSpot dropdown values
 * (case-sensitive per CLAUDE.md §15). Adding an option in HubSpot
 * without updating these tuples will reject the submission with a 400
 * before it leaves the site.
 */
export const SUPPORT_CATEGORIES = [
  "Refund Request",
  "Bug Report",
  "Atelier Won't Start or Won't Open",
  "Corrupted Data or Lost Data",
  "License or Device Transfer",
  "Privacy or Data Request",
  "Security Vulnerability Report",
  "General Question",
] as const;

export const SUPPORT_OPERATING_SYSTEMS = [
  "Windows 11",
  "Windows 10",
  "Windows (other / not sure)",
  "macOS",
  "Linux",
  "Other",
] as const;

export const SUPPORT_REFUND_REASONS = [
  "Changed my mind (within 14 days, license unactivated)",
  "Reproducible defect (activated, within 30 days, bug reported)",
  "Not what I expected",
  "Found a better alternative",
  "Accidental purchase or duplicate purchase",
  "Other",
] as const;

export const SUPPORT_LICENSE_OR_DEVICE_TRANSFER_ACTIONS = [
  "Activate Atelier on a new computer (transferring from an old one)",
  "I lost my license key and need it re-sent",
  "Remove an old device I no longer use (free up an activation slot)",
  "Change the email address on my license",
  "Other",
] as const;

export const SUPPORT_DATA_REQUEST_TYPES = [
  "Access my data (get a copy of everything you have on me)",
  "Delete my data (right to erasure)",
  "Correct my data (fix something inaccurate)",
  "Export my data (machine-readable copy for transferring elsewhere)",
  "Object to how my data is used",
  "Withdraw consent",
  "Not sure / general question about my data",
] as const;

export const SUPPORT_AFFECTED_COMPONENTS = [
  "Atelier desktop application",
  "dunamisstudios.com (marketing site)",
  "api.dunamisstudios.com (activation server)",
  "Customer account portal",
  "Other / Not sure",
] as const;

export const SUPPORT_SEVERITIES = [
  "Critical (remote code execution, mass data exposure, authentication bypass)",
  "High (privilege escalation, sensitive data exposure, account takeover)",
  "Medium (limited data exposure, denial of service, CSRF)",
  "Low (information disclosure, minor configuration issue)",
  "Informational (best-practice suggestion, hardening recommendation)",
  "Not sure",
] as const;

export const SUPPORT_PUBLIC_DISCLOSURE_STATUSES = [
  "Not disclosed anywhere (only known to me and Dunamis)",
  "Reported to CERT, MITRE, or similar coordination body",
  "Shared privately with other researchers",
  "Publicly posted (blog, social media, conference talk, etc.)",
  "Planning to publish on a specific date (please specify in the description)",
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

/**
 * Per-category visibility map for the support form's conditional
 * fields. Single source of truth for THREE consumers:
 *
 *   1. The React form's CATEGORY_CONFIG (which fields render for
 *      the chosen Category).
 *   2. The Zod schema's superRefine below (which fields fail
 *      validation when missing for the chosen Category).
 *   3. The /api/support-submit route handler (which conditional
 *      fields are eligible to forward into the HubSpot payload).
 *
 * `required` = visible AND must be non-empty. `optional` = visible
 * but accept-anything. Every other conditional field is NOT visible
 * for that category and must NOT reach HubSpot regardless of what
 * the client posted (defense-in-depth against a direct-curl POST
 * that supplies fields outside the category's visible set).
 *
 * HubSpot's v3 Forms Submission API enforces property-level Required
 * at the form definition level and does NOT honor our conditional
 * logic, so every Required toggle on a conditional property must be
 * disabled in the HubSpot form editor; required-when-shown lives
 * entirely in this app. See hubspot-gotchas skill for the property-
 * type + dropdown internal-name caveats that surround this.
 */
export const SUPPORT_CONDITIONAL_FIELDS_BY_CATEGORY: Record<
  SupportCategory,
  { required: readonly string[]; optional: readonly string[] }
> = {
  "Refund Request": {
    required: ["order_email", "refund_reason"],
    optional: ["license_key", "order_or_transaction_id"],
  },
  "Bug Report": {
    required: ["atelier_version", "operating_system"],
    optional: [
      "license_key",
      "os_version_or_build",
      "steps_to_reproduce",
      "issue_first_occurred",
    ],
  },
  "Atelier Won't Start or Won't Open": {
    required: ["atelier_version", "operating_system"],
    optional: ["license_key", "os_version_or_build", "issue_first_occurred"],
  },
  "Corrupted Data or Lost Data": {
    required: ["atelier_version", "operating_system"],
    optional: ["license_key", "os_version_or_build", "issue_first_occurred"],
  },
  "License or Device Transfer": {
    required: ["order_email", "license_or_device_transfer_action"],
    optional: ["license_key", "order_or_transaction_id"],
  },
  "Privacy or Data Request": {
    required: ["order_email", "data_request_type"],
    optional: [],
  },
  "Security Vulnerability Report": {
    required: [
      "affected_component",
      "suggested_severity",
      "public_disclosure_status",
    ],
    optional: ["steps_to_reproduce"],
  },
  "General Question": {
    required: [],
    optional: [],
  },
} as const;

export const supportTicketSchema = z.object({
  firstname: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(80, "First name is too long"),
  lastname: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(80, "Last name is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Email is required")
    .max(254, "Email is too long")
    .email("Enter a valid email address"),
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(255, "Subject is too long"),
  category: z.enum(SUPPORT_CATEGORIES, {
    error: "Choose a category",
  }),
  what_happened: z
    .string()
    .trim()
    .min(1, "Tell us what happened")
    .max(10000, "Too long"),
  /**
   * Required GDPR consent. The route rejects `false`; the React form
   * disables Submit until the box is checked. The verbatim consent
   * text is forwarded into HubSpot's legalConsentOptions block so the
   * submission record carries proof of what the visitor saw.
   */
  consent: z.literal(true, {
    error: "We need your consent before we can submit your message",
  }),
  /**
   * Verification key the customer pasted into the form's
   * Verification Key field. UUID-shaped (8-4-4-4-12 lowercase hex),
   * derived server-side from the customer's email and the current
   * 30-minute window. The /api/support-submit route re-verifies the
   * key against the form's email before forwarding to HubSpot;
   * mismatch returns 400 without touching the helpdesk pipeline.
   */
  identity_verification_reference: z
    .string()
    .trim()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      "Verification key looks wrong. Generate a new one above.",
    ),
  /**
   * Cloudflare Turnstile token solved on the client. Required on
   * every public form submission. The /api/support-submit route
   * re-verifies the token against Cloudflare siteverify BEFORE any
   * other validation or HubSpot forward; an invalid or missing
   * token returns 400 and the helpdesk pipeline is never touched.
   * Not forwarded into the HubSpot ticket payload (the route's
   * buildFields helper enumerates the fields explicitly and omits
   * this one).
   */
  turnstileToken: z.string().min(1, "Bot protection token required"),
  // Optional conditional fields. UI enforces required-when based on
  // category; the schema accepts any subset. Empty strings normalize
  // to undefined so they're absent from the HubSpot payload entirely
  // rather than sent as empty values.
  order_email: z
    .string()
    .trim()
    .max(254, "Too long")
    .optional()
    .transform((v) => (v && v.length > 0 ? v.toLowerCase() : undefined)),
  license_key: z
    .string()
    .trim()
    .max(400, "Too long")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  order_or_transaction_id: z
    .string()
    .trim()
    .max(120, "Too long")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  refund_reason: z.enum(SUPPORT_REFUND_REASONS).optional(),
  atelier_version: z
    .string()
    .trim()
    .max(80, "Too long")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  operating_system: z.enum(SUPPORT_OPERATING_SYSTEMS).optional(),
  os_version_or_build: z
    .string()
    .trim()
    .max(120, "Too long")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  steps_to_reproduce: z
    .string()
    .trim()
    .max(10000, "Too long")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  /**
   * Approximate date the issue first surfaced. Stored as an ISO date
   * (YYYY-MM-DD) on the HubSpot side so a date input in the form
   * maps cleanly. The native <input type="date"> emits this format
   * already.
   */
  issue_first_occurred: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  license_or_device_transfer_action: z
    .enum(SUPPORT_LICENSE_OR_DEVICE_TRANSFER_ACTIONS)
    .optional(),
  data_request_type: z.enum(SUPPORT_DATA_REQUEST_TYPES).optional(),
  affected_component: z.enum(SUPPORT_AFFECTED_COMPONENTS).optional(),
  suggested_severity: z.enum(SUPPORT_SEVERITIES).optional(),
  public_disclosure_status: z
    .enum(SUPPORT_PUBLIC_DISCLOSURE_STATUSES)
    .optional(),
}).superRefine((data, ctx) => {
  // Server-side enforcement of the 15 required-when-shown rules.
  // The React form blocks submit when these are missing for the
  // chosen Category; this is the load-bearing server-side re-check
  // that catches a direct-curl POST or a client that bypassed the
  // form's validateAll. Each missing required-for-this-category
  // field surfaces as its own ZodIssue so the React form can light
  // up the right error under the right field.
  const required =
    SUPPORT_CONDITIONAL_FIELDS_BY_CATEGORY[data.category].required;
  for (const field of required) {
    const value = (data as Record<string, unknown>)[field];
    if (value === undefined || value === null || value === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: "Required for this category",
      });
    }
  }
});

export type SupportTicketInput = z.infer<typeof supportTicketSchema>;

/**
 * Verbatim consent text shown on the support form. Forwarded into
 * HubSpot's legalConsentOptions.consent.text so the submission record
 * preserves exactly what the visitor agreed to. Update both this
 * string and the HubSpot form's consent text in lockstep; HubSpot's
 * audit trail relies on them matching.
 */
export const SUPPORT_CONSENT_TEXT =
  "I agree to Dunamis Studios processing the information in this message to respond to my request. I have read the privacy policy and understand how my data will be used.";
