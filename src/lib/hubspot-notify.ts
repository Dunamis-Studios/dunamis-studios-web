import "server-only";

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
 *   2. POST https://api.hsforms.com/submissions/v3/integration/submit/...
 *      submits the merged notify_interests through the public form
 *      endpoint, which handles contact upsert, list membership, and
 *      legal-basis tracking on HubSpot's side. The form submission
 *      endpoint is unauthenticated (no Bearer token).
 *
 * Failure policy: every error is logged and swallowed. The caller has
 * already written the signup to Redis, which is the source of truth;
 * a HubSpot outage must never bubble back to the visitor as a failed
 * form submission. Logs include enough context (step, status, slug,
 * truncated body) to debug after the fact.
 */

interface SubmitArgs {
  email: string;
  slug: string;
  productName: string;
}

const HUBSPOT_API_BASE = "https://api.hubapi.com";
const HUBSPOT_FORMS_BASE = "https://api.hsforms.com";
const PUBLIC_PAGE_BASE = "https://www.dunamisstudios.net";

interface ContactLookupResponse {
  properties?: { notify_interests?: string | null };
}

export async function submitToHubSpotNotifyForm({
  email,
  slug,
  productName,
}: SubmitArgs): Promise<void> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const formGuid = process.env.HUBSPOT_NOTIFY_FORM_GUID;

  if (!accessToken || !portalId || !formGuid) {
    console.warn("[hubspot-notify] env vars missing; skipping HubSpot mirror", {
      hasAccessToken: !!accessToken,
      hasPortalId: !!portalId,
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

  // Step 2: submit to the public form endpoint. This endpoint upserts
  // the contact, applies any list memberships configured on the form,
  // and sets the multi-select notify_interests property to the merged
  // semicolon-joined value. No Authorization header.
  try {
    const submitUrl = `${HUBSPOT_FORMS_BASE}/submissions/v3/integration/submit/${portalId}/${formGuid}`;
    const res = await fetch(submitUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: [
          { name: "email", value: email },
          { name: "notify_interests", value: merged },
        ],
        context: {
          pageUri: `${PUBLIC_PAGE_BASE}/products/${slug}`,
          pageName: `${productName} notify signup`,
        },
      }),
    });
    if (!res.ok) {
      const body = await safeReadText(res);
      console.error("[hubspot-notify] form submission failed", {
        step: "submit",
        status: res.status,
        body: body.slice(0, 500),
        slug,
      });
      return;
    }
  } catch (err) {
    console.error("[hubspot-notify] form submission threw", {
      step: "submit",
      error: err instanceof Error ? err.message : String(err),
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
