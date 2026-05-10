import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * Atelier EULA renderer.
 *
 * Reads the canonical Atelier EULA template from disk, validates that
 * every {{PLACEHOLDER}} in the template has a corresponding value in
 * the substitutions object (and vice versa), and produces the final
 * personalized text the customer will accept and the server will
 * store verbatim in the acceptance record.
 *
 * The renderer is the single source of truth for the personalized
 * EULA bytes. Both /api/atelier/preview-eula (returns rendered text
 * for the in-app EULA screen) and /api/atelier/record-eula-acceptance
 * (stores the rendered text into the acceptance record) call the
 * same renderer with identical inputs to guarantee byte equality.
 *
 * Equality is the load-bearing invariant: the customer must see the
 * same bytes they accept. The renderer is therefore deterministic
 * (no clock reads, no random seeds, no environment-dependent
 * formatting) — the caller passes ACCEPTANCE_DATE as a pre-formatted
 * string and the renderer just substitutes.
 */

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "content",
  "legal",
  "atelier-eula-template.md",
);

/**
 * Required substitution keys. Every {{KEY}} that appears in the
 * template body MUST be present in this set, and vice versa. The
 * renderer enforces both directions — a template that adds a new
 * placeholder without updating this set fails the round-trip
 * validation; a substitutions object missing a key fails at render.
 */
export const REQUIRED_SUBSTITUTION_KEYS = [
  // Template-level (frontmatter-derived; same for every customer
  // accepting under this template version).
  "PRODUCT_NAME",
  "PRODUCT_VERSION",
  "EFFECTIVE_DATE",
  "LICENSOR",
  // Customer-level (per-acceptance, distinct values for every record).
  "LICENSEE_FULL_NAME",
  "LICENSEE_EMAIL",
  "LICENSEE_COMPANY",
  "LICENSE_ID",
  "ACCEPTANCE_DATE",
  "DEVICE_FINGERPRINT",
  "ATELIER_VERSION",
] as const;

export type SubstitutionKey = (typeof REQUIRED_SUBSTITUTION_KEYS)[number];

export type EulaSubstitutions = Record<SubstitutionKey, string>;

export interface EulaTemplateMetadata {
  /** Version string read from frontmatter; the EULA acceptance pipeline
   *  uses this as the eula_version stamped onto every acceptance record. */
  version: string;
  productName: string;
  productVersion: string;
  effectiveDate: string;
  licensor: string;
}

interface LoadedEulaTemplate {
  /** Raw template body — everything after the frontmatter. */
  body: string;
  metadata: EulaTemplateMetadata;
}

let _cached: LoadedEulaTemplate | null = null;

/**
 * Load + parse the Atelier EULA template. Cached for the lifetime
 * of the Node process (template is bundled at deploy time and
 * doesn't change between requests).
 *
 * Throws on any of:
 *   - file missing
 *   - frontmatter missing required fields
 *   - template body referencing a {{KEY}} that's not in
 *     REQUIRED_SUBSTITUTION_KEYS
 *
 * The throw-on-mismatch behavior is the safety net for "someone
 * added a new placeholder to the template but forgot to wire it
 * through the renderer" — surfaced at process startup / first
 * render rather than at customer-acceptance time.
 */
export function loadAtelierEulaTemplate(): LoadedEulaTemplate {
  if (_cached) return _cached;
  const raw = fs.readFileSync(TEMPLATE_PATH, "utf8");
  const parsed = matter(raw);

  const fm = parsed.data as Partial<{
    version: string;
    productName: string;
    productVersion: string;
    effectiveDate: string;
    licensor: string;
  }>;

  const required = ["version", "productName", "productVersion", "effectiveDate", "licensor"] as const;
  for (const key of required) {
    if (typeof fm[key] !== "string" || fm[key]!.length === 0) {
      throw new Error(
        `Atelier EULA template ${TEMPLATE_PATH}: frontmatter is missing or empty for "${key}"`,
      );
    }
  }

  const metadata: EulaTemplateMetadata = {
    version: fm.version!,
    productName: fm.productName!,
    productVersion: fm.productVersion!,
    effectiveDate: fm.effectiveDate!,
    licensor: fm.licensor!,
  };

  const body = parsed.content;

  // Cross-check: every {{KEY}} in the body must be in REQUIRED_SUBSTITUTION_KEYS.
  // Use a Set for O(1) membership checks.
  const required_keys = new Set<string>(REQUIRED_SUBSTITUTION_KEYS);
  const placeholder_re = /\{\{([A-Z0-9_]+)\}\}/g;
  const seen_in_template = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = placeholder_re.exec(body)) !== null) {
    seen_in_template.add(m[1]);
  }
  const unknown_in_template: string[] = [];
  for (const key of seen_in_template) {
    if (!required_keys.has(key)) unknown_in_template.push(key);
  }
  if (unknown_in_template.length > 0) {
    throw new Error(
      `Atelier EULA template ${TEMPLATE_PATH}: body references unknown placeholder(s) ${unknown_in_template
        .map((k) => `{{${k}}}`)
        .join(", ")} — add them to REQUIRED_SUBSTITUTION_KEYS or fix the template.`,
    );
  }
  // Reverse direction: every required key must be referenced at
  // least once. A required key with no body reference is dead weight
  // and almost certainly a typo — fail loudly.
  const unused_required: string[] = [];
  for (const key of REQUIRED_SUBSTITUTION_KEYS) {
    if (!seen_in_template.has(key)) unused_required.push(key);
  }
  if (unused_required.length > 0) {
    throw new Error(
      `Atelier EULA template ${TEMPLATE_PATH}: REQUIRED_SUBSTITUTION_KEYS includes ${unused_required.join(
        ", ",
      )} but none appear in the template body — fix the template or remove the keys.`,
    );
  }

  _cached = { body, metadata };
  return _cached;
}

export class EulaRenderError extends Error {
  readonly code: string;
  readonly missingKeys: readonly string[];
  readonly extraKeys: readonly string[];
  constructor(opts: {
    code: string;
    message: string;
    missingKeys?: readonly string[];
    extraKeys?: readonly string[];
  }) {
    super(opts.message);
    this.name = "EulaRenderError";
    this.code = opts.code;
    this.missingKeys = opts.missingKeys ?? [];
    this.extraKeys = opts.extraKeys ?? [];
  }
}

/**
 * Render the Atelier EULA against a substitutions object.
 *
 * Validation is strict in BOTH directions:
 *   - Every key in REQUIRED_SUBSTITUTION_KEYS must be present in
 *     substitutions and a non-empty string.
 *   - Substitutions cannot include keys outside REQUIRED_SUBSTITUTION_KEYS.
 *
 * Returns the rendered body — frontmatter is intentionally not part
 * of the rendered output, since the customer never sees it. Frontmatter
 * version is captured separately via loadAtelierEulaTemplate().metadata
 * and stored on the acceptance record's eula_version field.
 *
 * Determinism guarantees: same template + same substitutions = same
 * bytes. No clock reads, no env reads, no randomness. The caller is
 * responsible for computing ACCEPTANCE_DATE as a stable string before
 * calling this function.
 */
export function renderEulaForCustomer(
  substitutions: EulaSubstitutions,
): string {
  const required = new Set<string>(REQUIRED_SUBSTITUTION_KEYS);
  const provided = new Set<string>(Object.keys(substitutions));

  const missing: string[] = [];
  for (const key of REQUIRED_SUBSTITUTION_KEYS) {
    const val = substitutions[key];
    if (typeof val !== "string" || val.length === 0) missing.push(key);
  }
  const extra: string[] = [];
  for (const key of provided) {
    if (!required.has(key)) extra.push(key);
  }
  if (missing.length > 0 || extra.length > 0) {
    throw new EulaRenderError({
      code: missing.length > 0 ? "missing_substitutions" : "unknown_substitutions",
      message:
        missing.length > 0
          ? `EULA renderer missing substitution(s): ${missing.join(", ")}`
          : `EULA renderer received unknown substitution(s): ${extra.join(", ")}`,
      missingKeys: missing,
      extraKeys: extra,
    });
  }

  const { body } = loadAtelierEulaTemplate();
  return body.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_match, key: string) => {
    // Validated above — every match has a value in substitutions.
    return substitutions[key as SubstitutionKey];
  });
}

/**
 * Format a Date as "Month D, YYYY" in en-US (e.g. "May 9, 2026").
 * Used by route handlers to produce the ACCEPTANCE_DATE substitution
 * value before calling renderEulaForCustomer. Server-side determinism
 * matters here — a single helper keeps preview and record byte-equal.
 *
 * Atelier is a US-only Windows product so en-US is the correct locale.
 * If a future product ships against a different locale, this helper
 * accepts an explicit locale arg so the renderer stays product-agnostic.
 */
export function formatAcceptanceDate(d: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}
