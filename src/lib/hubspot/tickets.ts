/**
 * HubSpot ticket-search helpers used by the admin Verification Keys
 * panel at /admin/customers/[account_id]. Resolves a Dunamis account
 * email to its tickets and pulls the identity_verification_reference
 * the customer submitted on the support form, so a support agent can
 * see at a glance which key the customer typed and whether it
 * matches a current-window key.
 *
 * Cached 5 minutes in Redis under dunamis:admin-verification-key-tickets:
 * The Refresh button on the admin page DELs the cache to force a
 * fresh fetch from HubSpot's Search API.
 */
import "server-only";

import { hubspotFetch, HubSpotApiError } from "./client";

/**
 * Subset of HubSpot ticket properties the admin Verification Keys
 * section reads. The shape is intentionally narrow: the section only
 * needs ticket id + subject + createdate + the verification key value
 * that was submitted with the form. Everything else (pipeline stage,
 * owner, etc.) belongs to the HubSpot Help Desk UI.
 */
export interface HubSpotTicketSummary {
  id: string;
  subject: string | null;
  createdAt: string;
  identityVerificationReference: string | null;
}

interface SearchResponse {
  total: number;
  results: Array<{
    id: string;
    properties: Record<string, string | null>;
    createdAt: string;
  }>;
}

interface ContactSearchResponse {
  total: number;
  results: Array<{ id: string }>;
}

/**
 * Resolve a HubSpot contact id by email. Returns null when the email
 * has no contact (no tickets to find). Uses the v3 search endpoint
 * rather than GET-by-email so we can request only the id and avoid
 * paging through all properties; an email match is unique on HubSpot
 * (the platform enforces uniqueness) so we take the first hit.
 */
async function findContactIdByEmail(email: string): Promise<string | null> {
  try {
    const body = {
      filterGroups: [
        {
          filters: [
            {
              propertyName: "email",
              operator: "EQ",
              value: email.toLowerCase(),
            },
          ],
        },
      ],
      properties: ["email"],
      limit: 1,
    };
    const res = await hubspotFetch<ContactSearchResponse>(
      "/crm/v3/objects/contacts/search",
      { method: "POST", body: JSON.stringify(body) },
    );
    return res.results[0]?.id ?? null;
  } catch (err) {
    if (err instanceof HubSpotApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Pull every ticket associated with a contact, surfacing the
 * identity_verification_reference property the support form writes
 * on submission. Returns newest-first by createdate.
 *
 * Why the contact lookup hop: HubSpot's ticket object has no native
 * email property. Tickets are linked to contacts via the standard
 * ticket-to-contact association. The search query `associations.contact
 * = <contactId>` is the canonical way to fetch a customer's tickets
 * without scanning the whole ticket namespace.
 *
 * When the customer has no HubSpot contact (no tickets ever submitted
 * from this address), returns an empty array rather than throwing.
 * That keeps the admin section's "no tickets yet" empty state intact
 * for fresh accounts.
 *
 * Caller is responsible for any caching layer; this helper hits the
 * HubSpot API every call.
 */
export async function listTicketsForCustomerEmail(
  email: string,
): Promise<HubSpotTicketSummary[]> {
  const contactId = await findContactIdByEmail(email);
  if (!contactId) return [];

  const body = {
    filterGroups: [
      {
        filters: [
          {
            propertyName: "associations.contact",
            operator: "EQ",
            value: contactId,
          },
        ],
      },
    ],
    properties: [
      "subject",
      "createdate",
      "identity_verification_reference",
    ],
    sorts: [{ propertyName: "createdate", direction: "DESCENDING" }],
    limit: 50,
  };

  const res = await hubspotFetch<SearchResponse>(
    "/crm/v3/objects/tickets/search",
    { method: "POST", body: JSON.stringify(body) },
  );

  return res.results.map((row) => ({
    id: row.id,
    subject: row.properties.subject ?? null,
    createdAt: row.createdAt,
    identityVerificationReference:
      row.properties.identity_verification_reference ?? null,
  }));
}
