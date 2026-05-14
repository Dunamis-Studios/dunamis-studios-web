/**
 * Shared HubSpot Forms Submission API v3 wrapper.
 *
 * Every form on the site posts to the same unauthenticated public
 * endpoint with the same payload shape; the only thing that varies
 * across forms is the formId, the field set, and what the caller
 * does on failure (surface to user / log-and-swallow). This helper
 * extracts the unchanging parts so each caller can focus on its own
 * field mapping and failure policy.
 *
 * Returns a structured result; the caller decides whether to surface
 * failures or swallow them. Network failures, timeouts, and non-2xx
 * HubSpot responses all come back as `{ ok: false }` with enough
 * detail for the caller to compose a user-facing error or a log
 * line.
 *
 * 10-second timeout via AbortController. HubSpot's submission
 * endpoint is normally sub-second; a 10-second cap keeps a HubSpot
 * brownout from holding the user's tab open indefinitely.
 */

const HUBSPOT_FORMS_BASE = "https://api.hsforms.com";
const SUBMIT_TIMEOUT_MS = 10_000;

export interface HubspotFormField {
  /**
   * HubSpot property internal name (snake_case, auto-derived from
   * the property label). Multi-select fields take a semicolon-joined
   * string here; the v3 endpoint accepts only strings on form fields.
   */
  name: string;
  value: string | string[];
  /**
   * HubSpot object type the property belongs to. Required on every
   * field of a multi-object form (e.g. the support form, which
   * creates one Ticket while upserting one Contact). When omitted,
   * HubSpot v3 defaults the field to the Contact object, which is
   * the right behavior for every contact-only form on the site
   * (contact, notify, courses, the 9 tool report forms).
   *
   * Canonical IDs documented in the hubspot-gotchas skill:
   *   "0-1" Contact
   *   "0-2" Company
   *   "0-3" Deal
   *   "0-5" Ticket
   *
   * A multi-object form silently misroutes every field to the
   * default Contact when this is omitted, which HubSpot then rejects
   * with "Required field 'TICKET.subject' is missing" (etc.) for
   * every ticket property the form expects. Always specify per
   * field on any form that creates non-Contact records.
   */
  objectTypeId?: string;
}

export interface HubspotFormContext {
  /** HubSpot tracking cookie value (`hubspotutk`). Forward when present. */
  hutk?: string;
  /** Visitor IP (left-most x-forwarded-for entry). Forward when present. */
  ipAddress?: string;
  /** Public URL of the page that captured the submission. */
  pageUri?: string;
  /** Human-readable page label visible in HubSpot's submission record. */
  pageName?: string;
}

export interface HubspotLegalConsent {
  consentToProcess: boolean;
  text: string;
}

export interface SubmitToHubspotFormOptions {
  formId: string;
  fields: HubspotFormField[];
  context?: HubspotFormContext;
  /**
   * When supplied, emits HubSpot's `legalConsentOptions.consent` block.
   * The text is what the user actually saw at submission time. HubSpot
   * stores both the boolean and the verbatim text on the submission
   * record so a consent audit can later confirm exactly what was
   * presented.
   */
  legalConsent?: HubspotLegalConsent;
  /** Override the 10s default. Reserved for tests. */
  timeoutMs?: number;
}

export type SubmitToHubspotFormResult =
  | { ok: true; hubspotResponse: unknown }
  | {
      ok: false;
      /**
       * HTTP status code from HubSpot when the call completed,
       * 0 when the request never reached HubSpot (network error,
       * abort, timeout).
       */
      status: number;
      /** Caller-facing error message, never sensitive. */
      error: string;
      /** Best-effort parsed response body for log debugging. */
      details?: unknown;
    };

export async function submitToHubspotForm(
  options: SubmitToHubspotFormOptions,
): Promise<SubmitToHubspotFormResult> {
  const portalId = process.env.HUBSPOT_PORTAL_ID;
  if (!portalId) {
    console.error("[hubspot/submit-form] HUBSPOT_PORTAL_ID is not set");
    return {
      ok: false,
      status: 0,
      error: "HubSpot portal id not configured",
    };
  }
  if (!options.formId) {
    return {
      ok: false,
      status: 0,
      error: "HubSpot form id missing",
    };
  }

  const url = `${HUBSPOT_FORMS_BASE}/submissions/v3/integration/submit/${portalId}/${options.formId}`;

  const payload: Record<string, unknown> = {
    fields: options.fields.map((f) => {
      const entry: Record<string, unknown> = { name: f.name, value: f.value };
      if (f.objectTypeId) entry.objectTypeId = f.objectTypeId;
      return entry;
    }),
  };
  if (options.context) {
    const ctx: Record<string, string> = {};
    if (options.context.hutk) ctx.hutk = options.context.hutk;
    if (options.context.ipAddress) ctx.ipAddress = options.context.ipAddress;
    if (options.context.pageUri) ctx.pageUri = options.context.pageUri;
    if (options.context.pageName) ctx.pageName = options.context.pageName;
    if (Object.keys(ctx).length > 0) payload.context = ctx;
  }
  if (options.legalConsent) {
    payload.legalConsentOptions = {
      consent: {
        consentToProcess: options.legalConsent.consentToProcess,
        text: options.legalConsent.text,
      },
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? SUBMIT_TIMEOUT_MS,
  );

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const aborted =
      err instanceof Error && err.name === "AbortError";
    const message = aborted
      ? "HubSpot request timed out"
      : err instanceof Error
        ? err.message
        : "HubSpot request failed";
    console.error("[hubspot/submit-form] network error", {
      formId: options.formId,
      aborted,
      message,
    });
    return { ok: false, status: 0, error: message };
  }
  clearTimeout(timer);

  if (res.ok) {
    let hubspotResponse: unknown = null;
    try {
      hubspotResponse = await res.json();
    } catch {
      hubspotResponse = null;
    }
    return { ok: true, hubspotResponse };
  }

  const rawBody = await safeReadText(res);

  // Parse JSON when possible so the log is pretty-printed; fall back
  // to the raw string when the body is plain text. NEVER truncate:
  // HubSpot's error responses enumerate every rejected field name +
  // value, and a 500-char slice consistently cuts off after the
  // first 1-2 fields, hiding the rest of the audit signal we need
  // to fix property-name mismatches.
  let parsedBody: unknown = null;
  let userMessage: string | null = null;
  let prettyBody: string;
  try {
    parsedBody = JSON.parse(rawBody);
    prettyBody = JSON.stringify(parsedBody, null, 2);
    if (
      parsedBody &&
      typeof parsedBody === "object" &&
      "message" in parsedBody &&
      typeof (parsedBody as { message: unknown }).message === "string"
    ) {
      userMessage = (parsedBody as { message: string }).message;
    }
  } catch {
    parsedBody = rawBody;
    prettyBody = rawBody;
  }

  console.error("[hubspot/submit-form] non-2xx response", {
    formId: options.formId,
    status: res.status,
    body: prettyBody,
  });

  return {
    ok: false,
    status: res.status,
    error: userMessage ?? `HubSpot returned ${res.status}`,
    details: parsedBody,
  };
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
