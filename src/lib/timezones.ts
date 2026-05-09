/**
 * IANA time zone helpers shared between the validation layer
 * (account-edit endpoints) and any future picker UI. We rely on the
 * platform's `Intl.supportedValuesOf("timeZone")` rather than
 * shipping a vendored list — the IANA database changes each year
 * and Node's bundled ICU keeps it current. Cached at module load
 * because the call is cheap but called per-request on validation.
 */

let cached: ReadonlySet<string> | null = null;

function load(): ReadonlySet<string> {
  if (cached) return cached;
  // `supportedValuesOf` exists on Node 18+ and modern browsers. The
  // project's Node engine target is 20+ via Next 15, so this branch
  // is the only one we expect to take in production.
  type IntlExt = typeof Intl & {
    supportedValuesOf?: (key: "timeZone") => string[];
  };
  const intl = Intl as IntlExt;
  if (typeof intl.supportedValuesOf === "function") {
    cached = new Set(intl.supportedValuesOf("timeZone"));
    return cached;
  }
  // Fallback for any environment without supportedValuesOf — accept
  // anything, defer to client-side rendering. In practice this should
  // never fire.
  cached = new Set();
  return cached;
}

export function isValidIanaTimeZone(value: string): boolean {
  const set = load();
  if (set.size === 0) return value.length > 0; // permissive fallback
  return set.has(value);
}

/** Sorted list for picker UIs. Empty when the runtime lacks the API. */
export function listIanaTimeZones(): string[] {
  return [...load()].sort();
}
