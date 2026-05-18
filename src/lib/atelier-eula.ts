/**
 * Server-side persistence for "customer accepted Atelier EULA version
 * X at moment T" events. Append-only: a re-acceptance creates a new
 * record alongside the prior one rather than mutating it, so the
 * audit trail tells the full consent story.
 *
 * The Atelier desktop's local SQLite mirror is a UX cache only. The
 * record persisted here, including the verbatim rendered EULA text
 * stored once at acceptance time, is what we would cite in any future
 * enforcement or dispute. The rendered_eula_text is immutable once
 * written; recordEulaAcceptance preserves the original bytes on
 * retry even when the caller passes a fresh render.
 *
 * Related: src/lib/eula-renderer.ts (canonical template loader,
 * version source of truth), src/lib/atelier-content.ts (the public
 * EULA copy this template generates).
 */
import { redis, KEY } from "./redis";
import { loadAtelierEulaTemplate } from "./eula-renderer";

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
   * EULA version string at acceptance time, read from the
   * canonical template's frontmatter at render time. Stamped onto
   * the record alongside the rendered text so an audit can verify
   * which template version produced the bytes.
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
  /**
   * The verbatim rendered EULA text the customer accepted. This is
   * the authoritative legal artifact — stored once at acceptance
   * time, never re-rendered. Audit reads return this byte-for-byte;
   * the substitution_values field below is a sanity-check companion
   * but the rendered_eula_text is what the customer actually agreed
   * to.
   *
   * Optional in the type for back-compat with the pre-renderer
   * record shape; new records always populate it. A read path that
   * encounters a record with rendered_eula_text:null is reading a
   * pre-renderer record and should surface that explicitly rather
   * than synthesizing one.
   */
  rendered_eula_text?: string | null;
  /**
   * Exact substitution values used to render rendered_eula_text.
   * Lets a future audit verify the rendering was correct. Distinct
   * from the snapshot fields above (email_at_accept etc.) because
   * those track customer state at accept time even when no rendering
   * was performed; substitution_values is rendering-specific.
   */
  substitution_values?: Record<string, string> | null;
  /**
   * SHA-256 hash of rendered_eula_text. Stored alongside the text so
   * a later integrity audit can verify storage hasn't been mutated.
   * Recomputed by callers; the persistence layer just stores what
   * it's given.
   */
  rendered_eula_sha256?: string | null;
  /**
   * Device fingerprint full SHA-256 (NOT truncated) tied to the
   * activation that posted the acceptance. Per the addendum: this
   * is the same fingerprint used in the Parties block, stored for
   * audit cross-check.
   */
  device_fingerprint?: string | null;
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
  rendered_eula_text: string;
  substitution_values: Record<string, string>;
  rendered_eula_sha256: string;
  device_fingerprint: string;
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
    rendered_eula_text: input.rendered_eula_text,
    substitution_values: input.substitution_values,
    rendered_eula_sha256: input.rendered_eula_sha256,
    device_fingerprint: input.device_fingerprint,
  };
  const r = redis();
  // If a prior record exists for this (lid, version), preserve its
  // original accepted_at AND its original rendered_eula_text /
  // substitution_values / sha256 — the rendered text is the legal
  // artifact, immutable once stored. A retry from the desktop must
  // not overwrite the original bytes the customer accepted.
  // Re-acceptance of an unchanged version doesn't shift the legal
  // moment forward and doesn't re-render.
  const existing = (await r.get<AtelierEulaAcceptanceRecord>(
    KEY.atelierEulaAcceptance(input.lid, input.eula_version),
  )) as AtelierEulaAcceptanceRecord | null;
  if (existing) {
    record.accepted_at = existing.accepted_at;
    if (existing.rendered_eula_text) {
      record.rendered_eula_text = existing.rendered_eula_text;
      record.substitution_values =
        existing.substitution_values ?? input.substitution_values;
      record.rendered_eula_sha256 =
        existing.rendered_eula_sha256 ?? input.rendered_eula_sha256;
      record.device_fingerprint =
        existing.device_fingerprint ?? input.device_fingerprint;
    }
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
 * Current EULA version. Read from the canonical renderable template's
 * frontmatter `version:` field at module load. Locking the version to
 * the template means a template edit + frontmatter version bump is
 * the single source of truth for "what version of the EULA do we
 * record acceptances against." Eliminates the typo class where the
 * template said one version and the acceptance pipeline stamped
 * another.
 */
export const CURRENT_ATELIER_EULA_VERSION =
  loadAtelierEulaTemplate().metadata.version;
