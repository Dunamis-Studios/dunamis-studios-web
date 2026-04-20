import { createHash } from "node:crypto";
import { redis, KEY } from "./redis";

/**
 * Help-center article rating storage.
 *
 * Redis shape:
 *   dunamis:kb:rating:{category}:{slug}  HSET up=<n>, down=<n>
 *   dunamis:kb:rated:{category}:{slug}   SET of hashed IPs, 180d TTL
 *
 * Dedup is IP-based (not account-based) so signed-out readers can rate.
 * IPs are SHA-256 hashed with KB_RATING_SALT before storage — we never
 * persist raw IPs, which keeps the dataset unable to re-identify
 * visitors even if the Redis dump were leaked.
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

const RAW_SALT = process.env.KB_RATING_SALT;
if (!RAW_SALT && process.env.NODE_ENV === "production") {
  // Module-load-time throw so `next build` fails loud on a missing
  // env. Vercel's build step imports every API route module, which
  // drags this file in and runs the check before the deploy
  // finishes. Secret generation, format, and provisioning are
  // operator decisions — this module's job is to fail if it's not
  // there, not to prescribe how to create one.
  throw new Error(
    "KB_RATING_SALT env var is required. Provision it alongside the other secrets this project uses (see README).",
  );
}
const SALT = RAW_SALT ?? "dev-only-insecure-kb-rating-salt-do-not-ship";
if (!RAW_SALT && process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
  console.warn(
    "[kb-rating] KB_RATING_SALT is unset — using an insecure dev fallback. Set a real salt before deploying.",
  );
}

/**
 * SHA-256(salt | ip) — the `|` separator makes length-extension
 * attacks harder than plain `salt + ip` concatenation. Returns hex.
 */
export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(SALT)
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

export async function hasAlreadyRated(
  category: string,
  slug: string,
  ipHash: string,
): Promise<boolean> {
  const r = redis();
  const member = await r.sismember(
    KEY.kbRated(articleKey(category, slug)),
    ipHash,
  );
  return member === 1;
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

export async function recordRating(
  category: string,
  slug: string,
  direction: "up" | "down",
  ipHash: string,
): Promise<RatingCounts> {
  const r = redis();
  const key = articleKey(category, slug);
  // Increment the counter first, then add the IP hash to the dedup set.
  // hasAlreadyRated() is the real dedup gate — callers check it before
  // invoking recordRating. If two concurrent votes slip past the gate
  // the worst case is a single double-count, which is cheap.
  await r.hincrby(KEY.kbRating(key), direction, 1);
  await r.sadd(KEY.kbRated(key), ipHash);
  await r.expire(KEY.kbRated(key), RATED_TTL_SEC);
  return getRatingCounts(category, slug);
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
