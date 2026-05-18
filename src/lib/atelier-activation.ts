/**
 * Activation slot record + helpers for Atelier license enforcement.
 *
 * Each activated device is a separate Redis record; the license keeps
 * a SET of activation_ids in dunamis:atelier-activations-by-license:
 * so slot accounting is one SMEMBERS plus N GETs. The 2-of-3 hardware
 * matching rule (see matchesMachine) tolerates one component swap
 * without consuming a new slot.
 *
 * Related: src/lib/atelier-license-signing.ts (license records),
 * /api/atelier/activate (slot acquisition), /api/atelier/heartbeat
 * (last_heartbeat_at refresh), /admin/licenses (per-license slot
 * management UI).
 */
import { randomUUID } from "node:crypto";

import { redis, KEY } from "./redis";

/**
 * Atelier online activation primitives.
 *
 * Atelier ships a perpetual license that activates against a Dunamis-
 * hosted server. Each license carries up to 3 concurrent activations
 * (devices). The activate endpoint creates or refreshes an activation,
 * the heartbeat endpoint refreshes `last_heartbeat_at`, and the
 * deactivate endpoint flips status to "deactivated" so the slot frees
 * for another machine.
 *
 * The data model deliberately keeps activation state in Redis (the
 * same instance the rest of the studio uses) rather than building a
 * dedicated SQL table — the read pattern is "find all activations for
 * this lid", which a SET membership lookup answers in one round-trip.
 *
 * This module is the canonical API for any code path that touches an
 * activation record. The HTTP routes call into these helpers; admin
 * tooling reads the same shapes; the customer portal at
 * /account/atelier-licenses queries via `getActivationsForLicense`.
 */

// ---------------------------------------------------------------------------
// Constants — knobs the licensing model depends on
// ---------------------------------------------------------------------------

/** Maximum concurrent active activations per license. */
export const MAX_ACTIVATIONS_PER_LICENSE = 3;

/**
 * Once activated, Atelier works offline for this many days between
 * successful heartbeats. Past the cliff, the next launch shows the
 * "Reconnect to verify your license" lockdown screen. Documented
 * publicly in atelier-docs/install.md, atelier-docs/whats-included.md,
 * and EULA §6.8.
 */
export const OFFLINE_GRACE_DAYS = 30;

/**
 * First-launch provisional grace. If the very first activation attempt
 * fails because the customer has no internet, Atelier runs anyway and
 * retries on each subsequent launch. After this many days without a
 * successful first activation, the lockdown screen replaces the app.
 * Documented in EULA §6.9 and atelier-docs/install.md.
 */
export const FIRST_LAUNCH_GRACE_DAYS = 7;

/**
 * Revocation grace window for `grace_14d` mode. Documented in EULA
 * §6.10 and surfaced in the admin revocation modal.
 */
export const REVOCATION_GRACE_DAYS = 14;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The three SHA-256 component hashes that make up a machine identity.
 * Each is a 64-character hex string. The Atelier client computes these
 * from the Windows machine GUID, motherboard serial, and CPU id, then
 * sends them to the activation server. The server uses 2-of-3
 * matching to decide whether two activation attempts represent "the
 * same machine" — see `matchesMachine` below for the matching rule.
 *
 * Storing three components instead of one combined hash means a
 * hardware change (new motherboard, new CPU) doesn't invalidate the
 * activation. As long as 2 of 3 components match, the same activation
 * record refreshes rather than consuming a new slot.
 */
export interface AtelierMachineId {
  /** SHA-256 hex of the Windows machine GUID. */
  windows_guid: string;
  /** SHA-256 hex of the motherboard serial number. */
  motherboard_serial: string;
  /** SHA-256 hex of the CPU id. */
  cpu_id: string;
}

export type AtelierActivationStatus = "active" | "deactivated";

/**
 * Why an activation transitioned to "deactivated". Drives the inline
 * label shown in the admin UI ("This device deactivated itself" vs
 * "Customer deactivated from portal" vs "Admin deactivated this slot").
 */
export type AtelierActivationDeactivationReason =
  | "self"
  | "customer_portal"
  | "other_device"
  | "admin";

export interface AtelierActivation {
  activation_id: string;
  lid: string;
  machine_id: AtelierMachineId;
  /**
   * Customer-facing device label. Defaulted to the machine hostname
   * the client provides at activate time, renameable from the
   * customer portal so a buyer with three "DESKTOP-1234" hostnames
   * can disambiguate them.
   */
  device_label: string;
  /** Atelier client version that activated this slot. */
  atelier_version: string;
  /** First time this slot was activated. ISO-8601 UTC. */
  first_activated_at: string;
  /** Most recent successful heartbeat or activate. ISO-8601 UTC. */
  last_heartbeat_at: string;
  status: AtelierActivationStatus;
  deactivated_at?: string | null;
  deactivated_reason?: AtelierActivationDeactivationReason | null;
}

// ---------------------------------------------------------------------------
// Machine identity matching
// ---------------------------------------------------------------------------

/**
 * Returns true when `incoming` matches `existing` strongly enough to
 * be considered the same machine. The rule is "at least 2 of the 3
 * SHA-256 component hashes are identical" — chosen to tolerate a
 * single hardware swap (replaced motherboard, replaced CPU, fresh
 * Windows install on the same hardware) without consuming a new slot.
 *
 * A 1-of-3 match is rejected because that's well within the noise
 * floor of "different machine, same model, same OEM image."
 */
export function matchesMachine(
  existing: AtelierMachineId,
  incoming: AtelierMachineId,
): boolean {
  let matches = 0;
  if (existing.windows_guid === incoming.windows_guid) matches++;
  if (existing.motherboard_serial === incoming.motherboard_serial) matches++;
  if (existing.cpu_id === incoming.cpu_id) matches++;
  return matches >= 2;
}

// ---------------------------------------------------------------------------
// Persistence — read / write
// ---------------------------------------------------------------------------

export async function getActivation(
  activationId: string,
): Promise<AtelierActivation | null> {
  const r = redis();
  return (
    (await r.get<AtelierActivation>(KEY.atelierActivation(activationId))) ??
    null
  );
}

/** Read every activation belonging to a license — active + deactivated. */
export async function getActivationsForLicense(
  lid: string,
): Promise<AtelierActivation[]> {
  const r = redis();
  const ids = await r.smembers(KEY.atelierActivationsByLicense(lid));
  if (ids.length === 0) return [];
  const records = await Promise.all(
    ids.map((id) => r.get<AtelierActivation>(KEY.atelierActivation(id))),
  );
  return records.filter((r): r is AtelierActivation => r != null);
}

/** Read only the active (slot-consuming) activations for a license. */
export async function getActiveActivationsForLicense(
  lid: string,
): Promise<AtelierActivation[]> {
  const all = await getActivationsForLicense(lid);
  return all.filter((a) => a.status === "active");
}

export interface CreateActivationInput {
  lid: string;
  machine_id: AtelierMachineId;
  device_label: string;
  atelier_version: string;
}

/**
 * Create a brand-new activation for a license. Caller must have
 * already verified that the license has < 3 active activations.
 */
export async function createActivation(
  input: CreateActivationInput,
): Promise<AtelierActivation> {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const activation: AtelierActivation = {
    activation_id: randomUUID(),
    lid: input.lid,
    machine_id: input.machine_id,
    device_label: input.device_label,
    atelier_version: input.atelier_version,
    first_activated_at: now,
    last_heartbeat_at: now,
    status: "active",
    deactivated_at: null,
    deactivated_reason: null,
  };
  const r = redis();
  await r.set(KEY.atelierActivation(activation.activation_id), activation);
  await r.sadd(
    KEY.atelierActivationsByLicense(input.lid),
    activation.activation_id,
  );
  return activation;
}

/**
 * Refresh an existing activation's heartbeat timestamp and (if the
 * caller's version differs) update the recorded Atelier version. Used
 * by both the activate endpoint (when 2-of-3 matches an existing slot)
 * and the heartbeat endpoint.
 */
export async function refreshActivationHeartbeat(
  activation: AtelierActivation,
  atelier_version: string,
): Promise<AtelierActivation> {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const updated: AtelierActivation = {
    ...activation,
    last_heartbeat_at: now,
    atelier_version,
  };
  const r = redis();
  await r.set(KEY.atelierActivation(activation.activation_id), updated);
  return updated;
}

export async function renameActivation(
  activationId: string,
  newLabel: string,
): Promise<AtelierActivation | null> {
  const existing = await getActivation(activationId);
  if (!existing) return null;
  const updated: AtelierActivation = { ...existing, device_label: newLabel };
  const r = redis();
  await r.set(KEY.atelierActivation(activationId), updated);
  return updated;
}

export async function deactivateActivation(
  activationId: string,
  reason: AtelierActivationDeactivationReason,
): Promise<AtelierActivation | null> {
  const existing = await getActivation(activationId);
  if (!existing) return null;
  if (existing.status === "deactivated") return existing;
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const updated: AtelierActivation = {
    ...existing,
    status: "deactivated",
    deactivated_at: now,
    deactivated_reason: reason,
  };
  const r = redis();
  await r.set(KEY.atelierActivation(activationId), updated);
  return updated;
}
