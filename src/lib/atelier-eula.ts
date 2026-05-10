import { redis, KEY } from "./redis";

/**
 * Atelier EULA acceptance records — server-side persistence of the
 * "customer accepted version X of the EULA at moment T" event.
 *
 * The Atelier desktop's onboarding flow surfaces an EULA screen
 * after license activation, with the customer's profile snapshot
 * pre-rendered as the "Accepting as:" block. On click, the desktop
 * POSTs to /api/atelier/record-eula-acceptance which calls into
 * recordEulaAcceptance below.
 *
 * The acceptance record is the source of truth for legal
 * compliance. Atelier's local SQLite mirror in pending_eula_sync /
 * accepted_eulas is a cache for offline UX; it is not authoritative
 * because a determined user could mutate the local DB. The server
 * record is what we cite in any future enforcement / audit.
 *
 * Records are append-only. A re-acceptance after an EULA version
 * bump creates a second record alongside the first; we never mutate
 * or delete an existing record. The admin history modal at
 * /admin/licenses surfaces every record for a license in
 * chronological order so support can see the full consent trail.
 */

export interface AtelierEulaAcceptanceRecord {
  /** License id this acceptance binds to. */
  lid: string;
  /**
   * Owning Dunamis account id at the moment of acceptance. Always
   * required — pre-account-bound license issuance is no longer
   * supported (the issuance picker enforces it), so a record can
   * only be created for a license that has an account_id.
   */
  account_id: string;
  /**
   * EULA version string at acceptance time. The desktop reads this
   * from the bundled EULA-TEMPLATE.md frontmatter, the site reads
   * it from atelier-docs/eula.md frontmatter / a build-time
   * constant. Same string on both sides.
   */
  eula_version: string;
  /** ISO-8601 UTC timestamp at second precision. */
  accepted_at: string;
  /** Atelier desktop version that posted the acceptance. */
  atelier_version: string;
  /**
   * Customer-facing email at acceptance time, snapshotted onto the
   * record so a later email rotation on the account doesn't change
   * what the audit trail reports. Pulled off the activation
   * customer_profile, not user-typed.
   */
  email_at_accept: string;
  /**
   * First+last name at acceptance time, also snapshotted off the
   * activation customer_profile. Same rationale as email_at_accept.
   */
  first_name_at_accept: string;
  last_name_at_accept: string;
  /** Company / studio name at acceptance time. May be null on legacy
   *  accounts that never filled the field. */
  company_name_at_accept: string | null;
  /**
   * Source IP and user-agent of the request that posted the
   * acceptance. Recorded for forensic value (which install fired the
   * accept) but never surfaced to the customer. Optional — Vercel
   * sometimes elides them on certain edges; the record is still
   * valid without them.
   */
  ip_at_accept: string | null;
  user_agent_at_accept: string | null;
}

export interface RecordEulaAcceptanceInput {
  lid: string;
  account_id: string;
  eula_version: string;
  atelier_version: string;
  email_at_accept: string;
  first_name_at_accept: string;
  last_name_at_accept: string;
  company_name_at_accept: string | null;
  ip_at_accept: string | null;
  user_agent_at_accept: string | null;
}

/**
 * Persist an EULA acceptance record. Idempotent on (lid,
 * eula_version): a second call with the same pair updates the
 * existing record instead of creating a duplicate. The desktop's
 * pending_eula_sync table re-tries on transient failures, so
 * idempotency at the persistence layer is required to avoid
 * duplicate records when a retry races a successful initial write.
 */
export async function recordEulaAcceptance(
  input: RecordEulaAcceptanceInput,
): Promise<AtelierEulaAcceptanceRecord> {
  const accepted_at = new Date()
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");
  const record: AtelierEulaAcceptanceRecord = {
    lid: input.lid,
    account_id: input.account_id,
    eula_version: input.eula_version,
    accepted_at,
    atelier_version: input.atelier_version,
    email_at_accept: input.email_at_accept,
    first_name_at_accept: input.first_name_at_accept,
    last_name_at_accept: input.last_name_at_accept,
    company_name_at_accept: input.company_name_at_accept,
    ip_at_accept: input.ip_at_accept,
    user_agent_at_accept: input.user_agent_at_accept,
  };
  const r = redis();
  // If a prior record exists for this (lid, version), preserve its
  // original accepted_at — re-acceptance of an unchanged version
  // shouldn't shift the legal moment forward. The retry semantics
  // expect this: a desktop that POSTed once successfully but failed
  // to mark the local accept-flag retries; the server returns the
  // same record without rewriting accepted_at.
  const existing = (await r.get<AtelierEulaAcceptanceRecord>(
    KEY.atelierEulaAcceptance(input.lid, input.eula_version),
  )) as AtelierEulaAcceptanceRecord | null;
  if (existing) {
    record.accepted_at = existing.accepted_at;
  }
  await r.set(KEY.atelierEulaAcceptance(input.lid, input.eula_version), record);
  await r.sadd(KEY.atelierEulaAcceptancesByLicense(input.lid), input.eula_version);
  return record;
}

/** Read every EULA acceptance record for a license, newest first. */
export async function listEulaAcceptancesForLicense(
  lid: string,
): Promise<AtelierEulaAcceptanceRecord[]> {
  const r = redis();
  const versions = await r.smembers(KEY.atelierEulaAcceptancesByLicense(lid));
  if (versions.length === 0) return [];
  const records = await Promise.all(
    versions.map((v) =>
      r.get<AtelierEulaAcceptanceRecord>(KEY.atelierEulaAcceptance(lid, v)),
    ),
  );
  return records
    .filter((r): r is AtelierEulaAcceptanceRecord => r != null)
    .sort((a, b) => (a.accepted_at < b.accepted_at ? 1 : -1));
}

/**
 * Current EULA version. Constant for now — a future slice can lift
 * this to a build-time read from atelier-docs/eula.md frontmatter
 * (or from a versioned constant module shared with the desktop). For
 * the slice that ships the acceptance pipeline, "1.0" is fine.
 */
export const CURRENT_ATELIER_EULA_VERSION = "1.0";
