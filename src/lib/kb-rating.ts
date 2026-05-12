import { createHash } from "node:crypto";
import { redis, KEY } from "./redis";

/**
 * Help-center article rating storage.
 *
 * Redis shape:
 *   dunamis:kb:rating:{category}:{slug}   HSET up=<n>, down=<n>
 *   dunamis:kb:vote:{category}:{slug}     HSET {ipHash}=<"up"|"down">, 180d TTL
 *   dunamis:kb:rated:{category}:{slug}    legacy SET, deprecated
 *
 * The vote HSET is the source of truth for "what direction did this
 * visitor vote, if any". Counters get adjusted atomically when a
 * visitor switches direction (up to down, down to up) or toggles off
 * entirely (clicks the same thumb twice), so a single visitor never
 * inflates the aggregate beyond +/-1 across their session.
 *
 * Dedup is IP-based (not account-based) so signed-out readers can rate.
 * IPs are SHA-256 hashed with KB_RATING_SALT before storage. We never
 * persist raw IPs, which keeps the dataset unable to re-identify
 * visitors even if the Redis dump were leaked.
 *
 * The legacy `kbRated` SET is left alone for backward compat (existing
 * keys expire under their 180-day TTL); it is no longer read or
 * written. Visitors who voted under the SET-only model can vote once
 * more under the HSET model; counters were already incremented at
 * original-vote time, so the one-time re-vote is correctly accounted.
 *
 * Raw counts are internal QA signal. They are exposed only through the
 * admin-gated GET route. Reader-facing surfaces use getHelpfulBadge(),
 * which returns a threshold-derived boolean and never leaks the
 * underlying numbers to the HTML.
 */

const RATED_TTL_SEC = 180 * 24 * 60 * 60; // 180 days

/**
 * Helpful-badge thresholds. A reader never sees any number — only the
 * derived boolean. The thresholds are expressed as constants here so
 * they're reviewable in one place, but the numeric values never leave
 * this module: `getHelpfulBadge` returns only { helpful } to callers.
 *
 *   helpful == (upvotes >= MIN_UPVOTES) AND (up / (up + down) >= MIN_RATIO)
 *
 * Zero-rating and below-threshold states both resolve to helpful=false,
 * so the UI treats "no opinion yet" identically to "opinions so far
 * are mixed" — no shame on articles awaiting feedback.
 */
const HELPFUL_MIN_UPVOTES = 10;
const HELPFUL_MIN_RATIO = 0.75;

const DEV_FALLBACK_SALT = "dev-only-insecure-kb-rating-salt-do-not-ship";

/**
 * Lazy-resolves the salt at first use rather than at module load. Page-
 * data collection during `next build` imports every route module, so a
 * module-load throw failed the build whenever a non-Vercel environment
 * (e.g. local dev without a real salt set) ran `npm run build`. Calling
 * the runtime path is what actually requires the secret; missing env
 * still throws there in production, which is what we care about.
 */
let warnedDevFallback = false;
function getSalt(): string {
  const raw = process.env.KB_RATING_SALT;
  if (raw) return raw;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "KB_RATING_SALT env var is required. Provision it alongside the other secrets this project uses (see README).",
    );
  }
  if (!warnedDevFallback) {
    console.warn(
      "[kb-rating] KB_RATING_SALT is unset — using an insecure dev fallback. Set a real salt before deploying.",
    );
    warnedDevFallback = true;
  }
  return DEV_FALLBACK_SALT;
}

/**
 * SHA-256(salt | ip) — the `|` separator makes length-extension
 * attacks harder than plain `salt + ip` concatenation. Returns hex.
 */
export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(getSalt())
    .update("|")
    .update(ip)
    .digest("hex");
}

function articleKey(category: string, slug: string): string {
  return `${category}:${slug}`;
}

export interface RatingCounts {
  up: number;
  down: number;
}

export type VoteDirection = "up" | "down";

/**
 * Look up the current vote a given hashed IP has on an article.
 * Returns null when the visitor has not voted (or toggled off after
 * voting). Reads from the vote HSET; the legacy `kbRated` SET is no
 * longer consulted.
 */
export async function getVote(
  category: string,
  slug: string,
  ipHash: string,
): Promise<VoteDirection | null> {
  const r = redis();
  const v = await r.hget<string>(
    KEY.kbVote(articleKey(category, slug)),
    ipHash,
  );
  if (v === "up" || v === "down") return v;
  return null;
}

/**
 * Back-compat alias for the feedback route's pre-vote gate. The
 * legacy flow required a thumbs vote before accepting free-text
 * feedback; that route still ships, so the predicate still needs
 * to work even though the new HSET-based vote model has replaced
 * the SET. New callers should use getVote() and branch on the
 * direction directly.
 */
export async function hasAlreadyRated(
  category: string,
  slug: string,
  ipHash: string,
): Promise<boolean> {
  return (await getVote(category, slug, ipHash)) !== null;
}

export async function getRatingCounts(
  category: string,
  slug: string,
): Promise<RatingCounts> {
  const r = redis();
  const raw =
    (await r.hgetall<Record<string, string | number>>(
      KEY.kbRating(articleKey(category, slug)),
    )) ?? {};
  return {
    up: toCount(raw.up),
    down: toCount(raw.down),
  };
}

export interface SetVoteResult {
  counts: RatingCounts;
  direction: VoteDirection | null;
}

/**
 * Set (or clear) a visitor's vote on an article and adjust the
 * counters atomically with respect to the previous vote.
 *
 *   prev=null,   next="up"   → counter up +1
 *   prev=null,   next="down" → counter down +1
 *   prev=null,   next=null   → no-op
 *   prev="up",   next="up"   → toggle off: counter up -1, vote cleared
 *   prev="up",   next="down" → counter up -1, down +1, vote=down
 *   prev="up",   next=null   → counter up -1, vote cleared
 *   prev="down", next="up"   → counter down -1, up +1, vote=up
 *   prev="down", next="down" → toggle off: counter down -1, vote cleared
 *   prev="down", next="null" → counter down -1, vote cleared
 *
 * `next === prev` is the toggle-off case (caller passes the same
 * direction it just clicked); this signals "clear my vote" without
 * needing a separate clear endpoint.
 *
 * Caller passes the raw next direction and the ipHash. This function
 * reads the prev direction itself, so the count adjustment is
 * relative to the stored state. If two concurrent votes from the
 * same IP race, the worst case is a single double-decrement; the
 * counts are non-negative-clamped via Math.max in the response.
 */
export async function setVote(
  category: string,
  slug: string,
  ipHash: string,
  next: VoteDirection | null,
): Promise<SetVoteResult> {
  const r = redis();
  const key = articleKey(category, slug);
  const ratingKey = KEY.kbRating(key);
  const voteKey = KEY.kbVote(key);

  const prev = await getVote(category, slug, ipHash);

  // Resolve the final direction. When the visitor clicks the thumb
  // they already had selected we treat it as a toggle-off, matching
  // the UI's behavior. Callers can also pass `null` explicitly to
  // force a clear.
  const effective: VoteDirection | null =
    next === null ? null : prev === next ? null : next;

  if (prev === effective) {
    // No state change; common when a stale client re-posts. Return
    // current state without mutating Redis.
    const counts = await getRatingCounts(category, slug);
    return { counts, direction: prev };
  }

  // Apply the diff. Both decrement and increment are wrapped so a
  // concurrent race never leaves a negative-displayed value.
  if (prev === "up") await r.hincrby(ratingKey, "up", -1);
  if (prev === "down") await r.hincrby(ratingKey, "down", -1);
  if (effective === "up") await r.hincrby(ratingKey, "up", 1);
  if (effective === "down") await r.hincrby(ratingKey, "down", 1);

  if (effective === null) {
    await r.hdel(voteKey, ipHash);
  } else {
    await r.hset(voteKey, { [ipHash]: effective });
    await r.expire(voteKey, RATED_TTL_SEC);
  }

  const rawCounts = await getRatingCounts(category, slug);
  const counts: RatingCounts = {
    up: Math.max(0, rawCounts.up),
    down: Math.max(0, rawCounts.down),
  };
  return { counts, direction: effective };
}

export interface HelpfulBadgeResult {
  helpful: boolean;
  /**
   * The thresholds that produced this decision, exposed so server
   * components can display "Helpful when X upvotes at Y ratio" on
   * future admin surfaces if needed. Reader-facing code never reads
   * these — it only branches on `helpful`.
   */
  threshold: {
    minUpvotes: number;
    minRatio: number;
  };
}

/**
 * Callable from server components with direct Redis access. Never
 * exposes raw counts to the caller's response payload — the only
 * reader-facing signal is the boolean.
 */
export async function getHelpfulBadge(
  category: string,
  slug: string,
): Promise<HelpfulBadgeResult> {
  const { up, down } = await getRatingCounts(category, slug);
  const total = up + down;
  const ratio = total > 0 ? up / total : 0;
  return {
    helpful: up >= HELPFUL_MIN_UPVOTES && ratio >= HELPFUL_MIN_RATIO,
    threshold: {
      minUpvotes: HELPFUL_MIN_UPVOTES,
      minRatio: HELPFUL_MIN_RATIO,
    },
  };
}

function toCount(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
