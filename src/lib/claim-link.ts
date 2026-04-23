import "server-only";

import { LEGAL_METADATA } from "@/content/legal/metadata";
import { accountConsentArgs } from "./account-consent";
import {
  buildAccountContactPatch,
  buildInstallContactPatch,
  trackEvents,
  type ContactPatch,
  type EventSpec,
  type ProductAppName,
} from "./hubspot";
import type { Account, Entitlement } from "./types";

/**
 * Fire the HubSpot events that accompany a successful claim-link
 * (existing user or newly-signed-up user completing a claim). Called
 * from every link surface — signup's tryLinkClaim, the non-UI
 * /api/entitlements/claim POST, and the UI-driven Server Action at
 * /account/[product]/[portalId]/claim/page.tsx — so the same events
 * and the same account-level HubSpot contact patch land regardless
 * of entry point.
 *
 * Fires:
 *   - terms_accepted for dpa (only if needsDpa)
 *   - terms_accepted for the relevant Service Addendum (only if
 *     needsAddendum)
 *   - app_installed (always)
 *
 * All events carry the merged account + install contact patch on the
 * first event in the batch so trackEvents's single-upsert path writes
 * every current account field (id, created-at, status, all consent
 * versions + timestamps) plus the install-specific fields
 * (*_installed=true, *_first_install_at stamped only if currently
 * blank, stripe_customer_id when available).
 *
 * Caller stamps Account consent BEFORE calling this so the `account`
 * arg reflects the post-stamp state. That lets buildAccountContactPatch
 * read the just-written version + timestamp rather than the pre-claim
 * blanks.
 */
export async function fireClaimAcceptance(args: {
  email: string;
  account: Account;
  entitlement: Entitlement;
  needsDpa: boolean;
  needsAddendum: boolean;
  ip: string;
  userAgent: string;
}): Promise<void> {
  const {
    email,
    account,
    entitlement,
    needsDpa,
    needsAddendum,
    ip,
    userAgent,
  } = args;

  const appName: ProductAppName = entitlement.product;

  if (!entitlement.hubspotUserId) {
    console.warn(
      `[claim-link] entitlement ${entitlement.product}:${entitlement.portalId} is missing hubspotUserId — app_installed will fire with empty hubspot_user_id; user should reinstall to refresh the stub`,
    );
  }

  const accountPatch = buildAccountContactPatch(accountConsentArgs(account));
  const installPatch = await buildInstallContactPatch({ email, appName });
  const mergedPatch: ContactPatch = { ...accountPatch, ...installPatch };

  const addendumMeta =
    appName === "debrief"
      ? { docType: "debrief_addendum" as const, version: LEGAL_METADATA.debriefAddendum.version }
      : {
          docType: "property_pulse_addendum" as const,
          version: LEGAL_METADATA.propertyPulseAddendum.version,
        };

  const events: EventSpec[] = [];

  if (needsDpa) {
    events.push({
      type: "terms_accepted",
      properties: {
        dunamis_account_id: account.accountId,
        document_type: "dpa",
        document_version: LEGAL_METADATA.dpa.version,
        accepted_via: "claim_flow",
        ip_address: ip,
        user_agent: userAgent,
      },
    });
  }
  if (needsAddendum) {
    events.push({
      type: "terms_accepted",
      properties: {
        dunamis_account_id: account.accountId,
        document_type: addendumMeta.docType,
        document_version: addendumMeta.version,
        accepted_via: "claim_flow",
        ip_address: ip,
        user_agent: userAgent,
      },
    });
  }

  events.push({
    type: "app_installed",
    properties: {
      app_name: appName,
      portal_id: entitlement.portalId,
      dunamis_account_id: entitlement.accountId ?? "",
      hubspot_user_id: entitlement.hubspotUserId ?? "",
    },
    // Put the merged account + install patch on the first event in
    // the batch — trackEvents merges all per-event additionalContactPatch
    // values into one upsert, so placing it on any single event is
    // sufficient and keeps the subsequent events' payloads lean.
    additionalContactPatch: events.length === 0 ? mergedPatch : undefined,
  });

  // If there are preceding terms_accepted events (dpa / addendum), put
  // the merged patch on the first of those instead of app_installed.
  // Either way, trackEvents merges into a single upsert.
  if (events.length > 1) {
    events[0] = {
      ...events[0],
      additionalContactPatch: mergedPatch,
    } as EventSpec;
  }

  await trackEvents(email, events);
}
