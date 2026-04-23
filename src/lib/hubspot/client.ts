import "server-only";

const HUBSPOT_API_BASE = "https://api.hubapi.com";
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 250;

class HubSpotConfigurationError extends Error {}

export class HubSpotApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "HubSpotApiError";
  }
}

function requireAccessToken(): string {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    throw new HubSpotConfigurationError(
      "HUBSPOT_ACCESS_TOKEN env var is required for HubSpot API calls",
    );
  }
  return token;
}

function jitter(baseMs: number): number {
  return baseMs + Math.floor(Math.random() * 100);
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Low-level HubSpot API call with retry-on-429/5xx and exponential backoff.
 * Respects Retry-After on 429 when present. Throws HubSpotApiError on
 * non-retryable 4xx or after retries are exhausted.
 */
export async function hubspotFetch<T>(
  path: string,
  init: Omit<RequestInit, "headers"> & { headers?: Record<string, string> } = {},
): Promise<T> {
  const token = requireAccessToken();
  const url = `${HUBSPOT_API_BASE}${path}`;

  let lastError: HubSpotApiError | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: `Bearer ${token}`,
        ...(init.headers ?? {}),
      },
    });

    if (res.ok) {
      if (res.status === 204) return undefined as T;
      return (await readBody(res)) as T;
    }

    const body = await readBody(res);
    const err = new HubSpotApiError(
      `HubSpot ${res.status} on ${init.method ?? "GET"} ${path}`,
      res.status,
      body,
    );

    if (!isRetryable(res.status) || attempt === MAX_RETRIES) {
      lastError = err;
      break;
    }

    const retryAfterHeader = res.headers.get("retry-after");
    const retryAfterMs = retryAfterHeader
      ? Number.parseInt(retryAfterHeader, 10) * 1000
      : null;
    const backoff =
      Number.isFinite(retryAfterMs) && retryAfterMs !== null
        ? retryAfterMs
        : jitter(BASE_BACKOFF_MS * 2 ** attempt);

    console.warn(
      `[hubspot] ${res.status} on ${path} (attempt ${attempt + 1}/${MAX_RETRIES + 1}) — retrying in ${backoff}ms`,
    );
    await new Promise((resolve) => setTimeout(resolve, backoff));
  }

  throw lastError ?? new HubSpotApiError(`HubSpot fetch failed: ${path}`, 0, null);
}

export interface SendCustomEventArgs {
  eventName: string;
  email: string;
  properties: Record<string, unknown>;
  occurredAt?: Date;
}

/**
 * Send a single custom event occurrence via /events/v3/send. Primary
 * object is Contact matched by email (HubSpot creates the contact if
 * one with that email does not exist yet, but callers that need the
 * contact to exist with specific properties should upsertContactByEmail
 * first).
 */
export async function sendCustomEvent(args: SendCustomEventArgs): Promise<void> {
  await hubspotFetch<void>("/events/v3/send", {
    method: "POST",
    body: JSON.stringify({
      eventName: args.eventName,
      email: args.email,
      occurredAt: (args.occurredAt ?? new Date()).toISOString(),
      properties: flattenProperties(args.properties),
    }),
  });
}

/**
 * HubSpot rejects arrays and objects as property values. Coerce
 * arrays to comma-joined strings and objects to JSON. Undefined
 * values are dropped so the caller doesn't have to filter.
 */
function flattenProperties(
  input: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      out[key] = value.join(",");
    } else if (typeof value === "object") {
      out[key] = JSON.stringify(value);
    } else {
      out[key] = value as string | number | boolean;
    }
  }
  return out;
}

export interface ContactPatch {
  [property: string]: string | number | boolean | null;
}

interface HubSpotContact {
  id: string;
  properties: Record<string, string>;
}

/**
 * Idempotent upsert by email. Tries PATCH with idProperty=email first
 * (works when the contact already exists); falls back to POST create
 * when the PATCH returns 404. Returns the contact id.
 */
export async function upsertContactByEmail(
  email: string,
  properties: ContactPatch,
): Promise<string> {
  const patchPath = `/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`;
  const body = {
    properties: cleanPatch({ ...properties, email }),
  };
  try {
    const updated = await hubspotFetch<HubSpotContact>(patchPath, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return updated.id;
  } catch (err) {
    if (err instanceof HubSpotApiError && err.status === 404) {
      const created = await hubspotFetch<HubSpotContact>("/crm/v3/objects/contacts", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return created.id;
    }
    throw err;
  }
}

/**
 * Update properties on an existing contact by email. Does NOT create
 * the contact if missing; prefer upsertContactByEmail when you want
 * create-on-miss semantics.
 */
export async function updateContactPropertiesByEmail(
  email: string,
  properties: ContactPatch,
): Promise<void> {
  await hubspotFetch<HubSpotContact>(
    `/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`,
    {
      method: "PATCH",
      body: JSON.stringify({ properties: cleanPatch(properties) }),
    },
  );
}

/**
 * Fetch a contact's current property values by email. Returns null if
 * the contact does not exist. Used by incrementContactProperty for
 * read-modify-write operations.
 */
export async function getContactByEmail(
  email: string,
  properties: string[],
): Promise<HubSpotContact | null> {
  const params = new URLSearchParams({
    idProperty: "email",
    properties: properties.join(","),
  });
  try {
    return await hubspotFetch<HubSpotContact>(
      `/crm/v3/objects/contacts/${encodeURIComponent(email)}?${params.toString()}`,
    );
  } catch (err) {
    if (err instanceof HubSpotApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Read-modify-write increment of a numeric contact property. Used for
 * counters (lifetime_value_cents, debrief_install_count, etc.). Races
 * with other concurrent increments for the same contact; HubSpot has
 * no atomic increment primitive on contact properties, so concurrent
 * purchases from one account in the same second may undercount. For
 * the expected traffic profile (single-digit purchases per customer
 * spread across time) this is acceptable. If this assumption changes,
 * migrate the counter to a HubSpot calculated property backed by a
 * related object (Deal or a Custom Object) with one record per
 * purchase and let HubSpot sum it.
 */
export async function incrementContactProperty(
  email: string,
  property: string,
  delta: number,
): Promise<void> {
  const contact = await getContactByEmail(email, [property]);
  const current = Number.parseInt(contact?.properties[property] ?? "0", 10) || 0;
  await updateContactPropertiesByEmail(email, {
    [property]: current + delta,
  });
}

function cleanPatch(input: ContactPatch): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) continue;
    out[key] = value;
  }
  return out;
}
