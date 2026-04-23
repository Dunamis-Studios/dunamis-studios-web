import "server-only";

import {
  ContactPatch,
  HubSpotApiError,
  sendCustomEvent,
  upsertContactByEmail,
} from "./client";
import { applyIncrements, deriveContactUpdates } from "./contact-properties";
import {
  HUBSPOT_EVENT_NAMES,
  type EventPayloads,
  type TrackingEventType,
} from "./events";

/**
 * Format an error for console.error so HubSpotApiError surfaces its
 * status + response body (essential for diagnosing 400s from HubSpot's
 * event-definition validation — the body names the rejected property
 * and value). Non-API errors fall back to .message.
 */
function formatHubspotError(err: unknown): Record<string, unknown> | string {
  if (err instanceof HubSpotApiError) {
    return { status: err.status, message: err.message, body: err.body };
  }
  return err instanceof Error ? err.message : String(err);
}

export type {
  AppName,
  EventPayloads,
  HubspotAccountStatus,
  HubspotLicenseStatus,
  HubspotSubscriptionStatus,
  HubspotTier,
  ProductAppName,
  TrackingEventType,
} from "./events";
export * from "./client";
export * from "./contact-properties";

let loggedMissingToken = false;

/**
 * Describes one event to track. Generic over K so `properties` is
 * narrowed to the payload shape for `type` — callers can't build a
 * spec with a mismatched payload.
 *
 * `additionalContactPatch` lets a wire-up site contribute contact-only
 * properties that shouldn't live in the event payload (e.g.
 * stripe_customer_id, or a conditionally-set first_install_at computed
 * from a prior getContactByEmail). Merged alongside the deriver output
 * in trackEvents; collisions are resolved last-write-wins so the
 * additional patch overrides the deriver if the wire-up knows better.
 */
export interface EventSpec<K extends TrackingEventType = TrackingEventType> {
  type: K;
  properties: EventPayloads[K];
  occurredAt?: Date;
  additionalContactPatch?: ContactPatch;
}

/**
 * Fire a batch of events for a single contact. Does ONE merged contact
 * upsert up front (so concurrent signup-time events don't race on
 * create-by-email), then sends each custom event in parallel, then
 * applies any summed counter increments serially. All failures are
 * logged per-phase and per-event and NEVER thrown — HubSpot tracking
 * must not break user-facing flows.
 *
 * Why one upsert instead of N: /crm/v3/objects/contacts has no atomic
 * upsert-by-email primitive. The client's upsertContactByEmail
 * PATCH-then-POST-on-404 fallback races when N parallel calls hit a
 * not-yet-existing email; only one POST wins, the others 409 and lose
 * their property patches. Merging into a single PATCH eliminates the
 * race without needing distributed locks. Events themselves can safely
 * fire in parallel — /events/v3/send is append-only per occurrence.
 *
 * Property collisions in the merged patch: later events in `events`
 * win. In practice the signup batch never sets the same property from
 * two events, but if a future batch does, order the array so the
 * canonical value comes last.
 *
 * No-ops silently (with a one-time warning) when HUBSPOT_ACCESS_TOKEN
 * is unset, so dev / preview deploys without the token stay quiet.
 */
export async function trackEvents(
  email: string,
  events: ReadonlyArray<EventSpec>,
): Promise<void> {
  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    if (!loggedMissingToken) {
      console.warn(
        "[hubspot] HUBSPOT_ACCESS_TOKEN is not set — trackEvents calls will be skipped",
      );
      loggedMissingToken = true;
    }
    return;
  }
  if (events.length === 0) return;

  // 1. Merge contact patches and sum increments across all events.
  const mergedPatch: ContactPatch = {};
  const mergedIncrements = new Map<string, number>();
  for (const ev of events) {
    const { patch, increments } = deriveContactUpdates(
      ev.type,
      ev.properties,
      ev.occurredAt ?? new Date(),
    );
    Object.assign(mergedPatch, patch);
    if (ev.additionalContactPatch) {
      Object.assign(mergedPatch, ev.additionalContactPatch);
    }
    for (const { property, delta } of increments) {
      mergedIncrements.set(
        property,
        (mergedIncrements.get(property) ?? 0) + delta,
      );
    }
  }

  // 2. Single upsert — the whole point of batching. If this fails we
  // still fire the event sends below; /events/v3/send creates the
  // contact lazily by email so the occurrence lands even if the patch
  // didn't.
  try {
    await upsertContactByEmail(email, mergedPatch);
  } catch (err) {
    console.error(
      `[hubspot] trackEvents upsert failed for ${email}:`,
      formatHubspotError(err),
    );
  }

  // 3. Parallel event sends. Each has its own try/catch so one
  // malformed payload or rejected event definition doesn't cancel the
  // siblings. Log tags the event type so failures are pinpointable
  // in Vercel logs.
  await Promise.all(
    events.map(async (ev) => {
      try {
        await sendCustomEvent({
          eventName: HUBSPOT_EVENT_NAMES[ev.type],
          email,
          properties: ev.properties as unknown as Record<string, unknown>,
          occurredAt: ev.occurredAt ?? new Date(),
        });
      } catch (err) {
        console.error(
          `[hubspot] trackEvents send(${ev.type}) failed for ${email}:`,
          formatHubspotError(err),
        );
      }
    }),
  );

  // 4. Apply merged increments. These are read-modify-write so stay
  // serial (HubSpot has no atomic increment on contact properties).
  if (mergedIncrements.size > 0) {
    try {
      await applyIncrements(
        email,
        Array.from(mergedIncrements, ([property, delta]) => ({
          property,
          delta,
        })),
      );
    } catch (err) {
      console.error(
        `[hubspot] trackEvents increments failed for ${email}:`,
        formatHubspotError(err),
      );
    }
  }
}

/**
 * Single-event convenience. Delegates to trackEvents() so there is one
 * implementation of the upsert-then-send-then-increment pipeline; the
 * singular form is fine when a caller fires exactly one event and
 * prefer trackEvents for any batch (signup, etc.) that would otherwise
 * race on contact creation.
 */
export async function trackEvent<K extends TrackingEventType>(
  type: K,
  email: string,
  properties: EventPayloads[K],
  occurredAt: Date = new Date(),
): Promise<void> {
  await trackEvents(email, [{ type, properties, occurredAt } as EventSpec<K>]);
}
