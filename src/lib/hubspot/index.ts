import "server-only";

import { sendCustomEvent, upsertContactByEmail } from "./client";
import { applyIncrements, deriveContactUpdates } from "./contact-properties";
import {
  HUBSPOT_EVENT_NAMES,
  type EventPayloads,
  type TrackingEventType,
} from "./events";

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
 * Fire-and-forget event tracker. Sends the custom event occurrence and
 * applies the contact property side effects in a single call. Failures
 * are logged but NEVER thrown to the caller — HubSpot tracking must not
 * break user-facing flows.
 *
 * No-ops silently (with a one-time warning) when HUBSPOT_ACCESS_TOKEN
 * is unset, so dev and preview deploys without the token don't spam
 * error logs on every event.
 *
 * When you need error propagation (e.g., to retry from a queue later),
 * call sendCustomEvent / upsertContactByEmail / applyIncrements directly.
 */
export async function trackEvent<K extends TrackingEventType>(
  type: K,
  email: string,
  properties: EventPayloads[K],
  occurredAt: Date = new Date(),
): Promise<void> {
  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    if (!loggedMissingToken) {
      console.warn(
        "[hubspot] HUBSPOT_ACCESS_TOKEN is not set — trackEvent calls will be skipped",
      );
      loggedMissingToken = true;
    }
    return;
  }

  const eventName = HUBSPOT_EVENT_NAMES[type];
  const { patch, increments } = deriveContactUpdates(type, properties, occurredAt);

  try {
    // upsertContactByEmail runs first so the contact definitely exists
    // before the event is sent. /events/v3/send will create the contact
    // if missing, but upserting here guarantees the property patch lands
    // on the same contact that receives the event.
    await upsertContactByEmail(email, patch);

    await sendCustomEvent({
      eventName,
      email,
      properties: properties as unknown as Record<string, unknown>,
      occurredAt,
    });

    if (increments.length > 0) {
      await applyIncrements(email, increments);
    }
  } catch (err) {
    console.error(
      `[hubspot] trackEvent(${type}) failed for ${email}:`,
      err instanceof Error ? err.message : err,
    );
  }
}
