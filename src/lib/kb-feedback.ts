import { redis, KEY } from "./redis";

/**
 * Free-text feedback left on a help-center article. Stored in a Redis
 * LIST, newest first (LPUSH), capped at MAX_ENTRIES via LTRIM. The
 * cap bounds storage and keeps "last N entries" queries cheap.
 *
 * We store only the first 8 chars of the IP hash — enough for an
 * admin triaging the feedback to see "this prefix shows up three
 * times, that reader is frustrated", not enough to re-identify the
 * visitor even if combined with the full rating-set hash (which
 * isn't stored alongside the feedback anyway).
 *
 * No admin UI consumes this yet. Josh reads it directly via the
 * Upstash console or `lrange` until the /admin/kb/ratings page lands
 * (see BACKLOG in README).
 */

const MAX_ENTRIES = 100;
const IP_PREFIX_LEN = 8;

export interface FeedbackEntry {
  /** ISO timestamp of when the feedback was recorded. */
  ts: string;
  /** Which direction the reader voted before leaving this feedback. */
  direction: "up" | "down";
  /** Trimmed body, 1-500 chars after validation. */
  body: string;
  /** First 8 hex chars of the hashed IP — correlation signal, not identity. */
  ipHashPrefix: string;
}

export function ipHashPrefix(fullHash: string): string {
  return fullHash.slice(0, IP_PREFIX_LEN);
}

function articleKey(category: string, slug: string): string {
  return `${category}:${slug}`;
}

export async function recordFeedback(
  category: string,
  slug: string,
  entry: FeedbackEntry,
): Promise<void> {
  const r = redis();
  const key = KEY.kbFeedback(articleKey(category, slug));
  // @upstash/redis auto-serializes objects on write and parses them on
  // read (via the generic on lrange). One round trip per write, no
  // manual JSON.stringify plumbing.
  await r.lpush(key, entry);
  // LTRIM keeps [0, MAX_ENTRIES - 1] — i.e., the MAX_ENTRIES newest
  // entries. Older feedback falls off; the cap is a storage budget,
  // not an audit log.
  await r.ltrim(key, 0, MAX_ENTRIES - 1);
}

export async function listFeedback(
  category: string,
  slug: string,
  limit = MAX_ENTRIES,
): Promise<FeedbackEntry[]> {
  const r = redis();
  const end = Math.max(0, Math.min(limit, MAX_ENTRIES) - 1);
  const raw = await r.lrange<FeedbackEntry>(
    KEY.kbFeedback(articleKey(category, slug)),
    0,
    end,
  );
  // lrange is typed to return FeedbackEntry[], but nothing in Redis
  // guarantees shape — if a garbage entry lands in the list we drop
  // it rather than throw.
  return (raw ?? []).filter(
    (e): e is FeedbackEntry =>
      !!e &&
      typeof e === "object" &&
      typeof (e as FeedbackEntry).body === "string" &&
      typeof (e as FeedbackEntry).ts === "string",
  );
}
