import "server-only";

/**
 * HubSpot mirror for /tools/* email captures. Submits to the dedicated
 * "Free Tools - Lead Capture" form (GUID in HUBSPOT_FREE_TOOLS_FORM_GUID).
 * Reusable across every free-tool surface: callers pass the tool's
 * display name as `toolName` and it lands in the hidden "Free Tool Used"
 * single-line text field on the form so HubSpot segmentation can route
 * by tool downstream.
 *
 * The public form endpoint at api.hsforms.com is unauthenticated, so
 * unlike the notify-interests mirror this helper does NOT need
 * HUBSPOT_ACCESS_TOKEN. It only needs HUBSPOT_PORTAL_ID and
 * HUBSPOT_FREE_TOOLS_FORM_GUID.
 *
 * Failure policy: every error is logged and swallowed. The caller has
 * already written the lead to Redis as source of truth; a HubSpot
 * outage must never bubble back to the visitor as a failed submit.
 */

const HUBSPOT_FORMS_BASE = "https://api.hsforms.com";

/**
 * Internal name of the hidden "Free Tool Used" property on the form.
 * Per HubSpot's snake_case auto-conversion of property internal names
 * from labels (CLAUDE.md §15), the label "Free Tool Used" becomes
 * `free_tool_used` on creation. If a future form rename desyncs the
 * label and the internal name, override here without touching every
 * caller.
 */
const FREE_TOOL_USED_FIELD = "free_tool_used";

export interface SubmitFreeToolLeadArgs {
  /** Visitor email. Required by the HubSpot form. */
  email: string;
  /**
   * Display name of the tool the visitor used (e.g. "Handoff Time
   * Calculator"). Lands in the hidden free_tool_used field on the
   * HubSpot form. Use the human-facing tool name, not a slug, so
   * HubSpot lists and reports read naturally without a lookup.
   */
  toolName: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  /**
   * HubSpot tracking cookie (hubspotutk) when the visitor has tracking
   * enabled. Forwarded to HubSpot so the form submission links to the
   * visitor's existing tracking session for source attribution.
   */
  hubspotutk?: string;
  /**
   * Visitor IP from request headers. Forwarded to HubSpot for geo and
   * IP fields on the submission record. Omit when unavailable so we
   * don't write a sentinel like "unknown" to HubSpot.
   */
  ipAddress?: string;
  /**
   * Public URL of the page that captured the lead (e.g.
   * https://www.dunamisstudios.net/tools/handoff-time-calculator).
   * Forwarded to HubSpot in the form context.
   */
  pageUri: string;
  /**
   * Human-readable label for the page in HubSpot's submission record
   * (e.g. "Handoff Time Calculator report request").
   */
  pageName: string;
}

export async function submitFreeToolLead(
  args: SubmitFreeToolLeadArgs,
): Promise<void> {
  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const formGuid = process.env.HUBSPOT_FREE_TOOLS_FORM_GUID;

  if (!portalId || !formGuid) {
    console.warn("[hubspot-free-tools] env vars missing; skipping mirror", {
      hasPortalId: !!portalId,
      hasFormGuid: !!formGuid,
      tool: args.toolName,
    });
    return;
  }

  const fields: Array<{ name: string; value: string }> = [
    { name: "email", value: args.email },
    { name: FREE_TOOL_USED_FIELD, value: args.toolName },
  ];
  if (args.firstName) fields.push({ name: "firstname", value: args.firstName });
  if (args.lastName) fields.push({ name: "lastname", value: args.lastName });
  if (args.company) fields.push({ name: "company", value: args.company });

  const context: Record<string, string> = {
    pageUri: args.pageUri,
    pageName: args.pageName,
  };
  if (args.hubspotutk) context.hutk = args.hubspotutk;
  if (args.ipAddress) context.ipAddress = args.ipAddress;

  const submitUrl = `${HUBSPOT_FORMS_BASE}/submissions/v3/integration/submit/${portalId}/${formGuid}`;

  try {
    const res = await fetch(submitUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields, context }),
    });
    if (!res.ok) {
      // Surface enough body for field-name mismatches to debug. The
      // most likely 400 cause is the free_tool_used internal name not
      // matching what HubSpot generated for the hidden field; a 400
      // body usually names the offending field.
      const body = await safeReadText(res);
      console.error("[hubspot-free-tools] form submission failed", {
        status: res.status,
        body: body.slice(0, 500),
        tool: args.toolName,
      });
    }
  } catch (err) {
    console.error("[hubspot-free-tools] form submission threw", {
      error: err instanceof Error ? err.message : String(err),
      tool: args.toolName,
    });
  }
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
