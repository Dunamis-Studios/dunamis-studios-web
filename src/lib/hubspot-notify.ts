import "server-only";

import { submitToHubspotForm } from "@/lib/hubspot/submit-form";

/**
 * HubSpot side of the /api/notify capture flow. Mirrors the visitor's
 * signup into the "Notify Interests" HubSpot form so the contact gets
 * created (or updated) inside the Dunamis Studios portal alongside the
 * existing Redis row.
 *
 * Two HTTP calls per submission:
 *   1. GET  /crm/v3/objects/contacts/{email}?idProperty=email
 *      reads the contact's existing notify_interests so we can append
 *      the new product name without clobbering prior interests.
 *      Stays inline here because the lookup uses a different endpoint
 *      and an authenticated Bearer token; the shared submit helper
 *      only covers the unauthenticated v3 form submissions endpoint.
 *   2. submitToHubspotForm() submits the merged notify_interests
 *      through the public form endpoint, which handles contact upsert,
 *      list membership, and legal-basis tracking on HubSpot's side.
 *
 * Failure policy: every error is logged and swallowed. The caller has
 * already written the signup to Redis, which is the source of truth;
 * a HubSpot outage must never bubble back to the visitor as a failed
 * form submission.
 */

interface SubmitArgs {
  email: string;
  firstName: string;
  lastName: string;
  slug: string;
  productName: string;
  /**
   * Visitor's HubSpot tracking cookie (hubspotutk) value. When present,
   * HubSpot links the form submission to the visitor's existing
   * tracking session so source attribution and page journey data
   * populate on the contact. Omit when the cookie is not available
   * (visitor with tracking blocked, ad blocker, server-to-server
   * smoke test): HubSpot will still create the contact, just without
   * session linkage.
   */
  hubspotutk?: string;
  /**
   * Visitor's IP address as derived from the request headers. When
   * present, HubSpot uses it for geolocation and for the IP fields on
   * the form submission record. Omit when unavailable (the route
   * passes undefined when the IP would be the literal "unknown"
   * fallback) so HubSpot does not record a sentinel value.
   */
  ipAddress?: string;
}

const HUBSPOT_API_BASE = "https://api.hubapi.com";
const PUBLIC_PAGE_BASE = "https://www.dunamisstudios.net";

interface ContactLookupResponse {
  properties?: { notify_interests?: string | null };
}

export async function submitToHubSpotNotifyForm({
  email,
  firstName,
  lastName,
  slug,
  productName,
  hubspotutk,
  ipAddress,
}: SubmitArgs): Promise<void> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  const formGuid = process.env.HUBSPOT_NOTIFY_FORM_GUID;

  if (!accessToken || !formGuid) {
    // Config-missing case in dev / preview envs: skip the HubSpot
    // mirror entirely. Redis already captured the signup.
    console.warn("[hubspot-notify] env vars missing; skipping HubSpot mirror", { // claude-code:allow-console
      hasAccessToken: !!accessToken,
      hasFormGuid: !!formGuid,
      slug,
    });
    return;
  }

  // Step 1: read existing notify_interests so the merge can preserve
  // prior interests without echoing duplicates.
  let existingInterests = "";
  try {
    const lookupUrl = `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${encodeURIComponent(
      email,
    )}?idProperty=email&properties=notify_interests`;
    const res = await fetch(lookupUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 200) {
      const data = (await res.json()) as ContactLookupResponse;
      existingInterests = data.properties?.notify_interests ?? "";
    } else if (res.status === 404) {
      // Contact does not exist yet. The form submission below will
      // create it. existingInterests stays empty.
      existingInterests = "";
    } else {
      const body = await safeReadText(res);
      console.error("[hubspot-notify] contact lookup failed", {
        step: "lookup",
        status: res.status,
        body: body.slice(0, 500),
        slug,
      });
      return;
    }
  } catch (err) {
    console.error("[hubspot-notify] contact lookup threw", {
      step: "lookup",
      error: err instanceof Error ? err.message : String(err),
      slug,
    });
    return;
  }

  const merged = mergeInterests(existingInterests, productName);

  // Step 2: submit through the shared helper. Upserts the contact on
  // HubSpot's side, applies any list memberships configured on the
  // form, and writes the merged semicolon-joined notify_interests
  // multi-select. Log-and-swallow on any non-ok result so a HubSpot
  // brownout never bubbles back to the visitor (Redis is truth).
  const result = await submitToHubspotForm({
    formId: formGuid,
    fields: [
      { name: "email", value: email },
      { name: "firstname", value: firstName },
      { name: "lastname", value: lastName },
      { name: "notify_interests", value: merged },
    ],
    context: {
      ...(hubspotutk ? { hutk: hubspotutk } : {}),
      ...(ipAddress ? { ipAddress } : {}),
      pageUri: `${PUBLIC_PAGE_BASE}/custom-development/products/${slug}`,
      pageName: `${productName} notify signup`,
    },
  });
  if (!result.ok) {
    console.error("[hubspot-notify] form submission failed", {
      step: "submit",
      status: result.status,
      error: result.error,
      slug,
    });
  }
}

/**
 * Merge a new product display name into an existing semicolon-joined
 * notify_interests value. Splits, trims, drops empties, dedupes by
 * exact-string match (HubSpot dropdown internal values are case
 * sensitive per CLAUDE.md §15), then rejoins with ";".
 */
export function mergeInterests(existing: string, addition: string): string {
  const parts = existing
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (!parts.includes(addition)) {
    parts.push(addition);
  }
  return parts.join(";");
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
