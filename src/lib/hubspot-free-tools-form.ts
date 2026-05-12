import "server-only";

import { submitToHubspotForm } from "@/lib/hubspot/submit-form";

/**
 * HubSpot mirror for /custom-development/tools/* email captures. Submits to the dedicated
 * "Free Tools - Lead Capture" form (GUID in HUBSPOT_FREE_TOOLS_FORM_GUID).
 * Reusable across every free-tool surface: callers pass the tool's
 * display name as `toolName` and it lands in the hidden "Free Tool Used"
 * single-line text field on the form so HubSpot segmentation can route
 * by tool downstream.
 *
 * Delegates the actual HTTP call to the shared submitToHubspotForm()
 * helper so URL building, timeouts, and response parsing live in one
 * place. The helper reads HUBSPOT_PORTAL_ID; this module only owns
 * HUBSPOT_FREE_TOOLS_FORM_GUID and the field mapping.
 *
 * Failure policy: every error is logged and swallowed. The caller has
 * already written the lead to Redis as source of truth; a HubSpot
 * outage must never bubble back to the visitor as a failed submit.
 */

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
   * https://www.dunamisstudios.net/custom-development/tools/handoff-time-calculator).
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
  const formGuid = process.env.HUBSPOT_FREE_TOOLS_FORM_GUID;

  if (!formGuid) {
    console.warn("[hubspot-free-tools] env var missing; skipping mirror", { // claude-code:allow-console
      hasFormGuid: false,
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

  const result = await submitToHubspotForm({
    formId: formGuid,
    fields,
    context: {
      ...(args.hubspotutk ? { hutk: args.hubspotutk } : {}),
      ...(args.ipAddress ? { ipAddress: args.ipAddress } : {}),
      pageUri: args.pageUri,
      pageName: args.pageName,
    },
  });
  if (!result.ok) {
    // The most likely 400 cause is the free_tool_used internal name
    // not matching what HubSpot generated for the hidden field; the
    // helper logs the truncated body to runtime logs already, so we
    // just attach the tool name here for fan-out grep.
    console.error("[hubspot-free-tools] form submission failed", {
      status: result.status,
      error: result.error,
      tool: args.toolName,
    });
  }
}
