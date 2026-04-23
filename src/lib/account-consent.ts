import { LEGAL_METADATA } from "@/content/legal/metadata";
import type { Account, Product } from "./types";

/**
 * Consent helpers shared across every acceptance surface: signup
 * (stamps ToS + Privacy unconditionally; also DPA + relevant Service
 * Addendum when the signup carries a claim), and both claim-link
 * paths (stamp DPA + Service Addendum on existing users whose stamped
 * versions don't match the current LEGAL_METADATA versions).
 *
 * "Already accepted" means the stamped version on the Account record
 * matches the current LEGAL_METADATA version. A bumped document
 * counts as not-yet-accepted and requires re-stamp at the next
 * acceptance surface.
 */

export interface PendingConsent {
  needsDpa: boolean;
  needsAddendum: boolean;
}

/**
 * Returns which product-scoped consents still need the user's
 * acceptance. UI-side predicate used by the claim page to compute
 * disclosure copy; the server-side stamper below uses the same rule.
 */
export function needsConsent(
  account: Account,
  product: Product,
): PendingConsent {
  const currentDpa = LEGAL_METADATA.dpa.version;
  const currentAddendum =
    product === "debrief"
      ? LEGAL_METADATA.debriefAddendum.version
      : LEGAL_METADATA.propertyPulseAddendum.version;
  const stampedAddendum =
    product === "debrief"
      ? account.debriefAddendumVersionAccepted
      : account.propertyPulseAddendumVersionAccepted;
  return {
    needsDpa: account.dpaVersionAccepted !== currentDpa,
    needsAddendum: stampedAddendum !== currentAddendum,
  };
}

/**
 * Returns the set of Account field updates needed to bring consent
 * current for this product at `now`. Spread into saveAccount alongside
 * the existing account state. Returns an empty object when everything
 * is already at the current version.
 */
export function computePendingConsentStamps(
  account: Account,
  product: Product,
  now: string,
): Partial<Account> {
  const pending: Partial<Account> = {};
  const { needsDpa, needsAddendum } = needsConsent(account, product);
  if (needsDpa) {
    pending.dpaVersionAccepted = LEGAL_METADATA.dpa.version;
    pending.dpaAcceptedAt = now;
  }
  if (needsAddendum) {
    if (product === "debrief") {
      pending.debriefAddendumVersionAccepted =
        LEGAL_METADATA.debriefAddendum.version;
      pending.debriefAddendumAcceptedAt = now;
    } else {
      pending.propertyPulseAddendumVersionAccepted =
        LEGAL_METADATA.propertyPulseAddendum.version;
      pending.propertyPulseAddendumAcceptedAt = now;
    }
  }
  return pending;
}

/**
 * Map an Account to the primitive-typed args expected by
 * buildAccountContactPatch(). Keeps hubspot lib decoupled from the
 * Account type while every HubSpot sync site can still produce a full
 * account-level patch in one call: buildAccountContactPatch(accountConsentArgs(account)).
 */
export function accountConsentArgs(account: Account) {
  return {
    accountId: account.accountId,
    createdAt: account.createdAt,
    deletedAt: account.deletedAt ?? null,
    tosVersion: account.tosVersionAccepted,
    tosAcceptedAt: account.tosAcceptedAt,
    privacyVersion: account.privacyVersionAccepted,
    privacyAcceptedAt: account.privacyAcceptedAt,
    dpaVersion: account.dpaVersionAccepted,
    dpaAcceptedAt: account.dpaAcceptedAt,
    debriefAddendumVersion: account.debriefAddendumVersionAccepted,
    debriefAddendumAcceptedAt: account.debriefAddendumAcceptedAt,
    propertyPulseAddendumVersion: account.propertyPulseAddendumVersionAccepted,
    propertyPulseAddendumAcceptedAt: account.propertyPulseAddendumAcceptedAt,
  };
}
