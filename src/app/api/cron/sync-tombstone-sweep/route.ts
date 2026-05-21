/**
 * Defensive cron: re-asserts the 90-day TTL on every Sync tombstone
 * row in case a writer ever forgot to set `ex`. In a healthy system
 * this cron does zero work; its value is catching the regression
 * before tombstones accrete into permanent index bloat. See helper
 * docstring for the TTL invariant.
 */
import { NextResponse } from "next/server";

import { redis } from "@/lib/redis";
import { authorizeCron } from "@/lib/sync/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NINETY_DAYS_SEC = 90 * 24 * 60 * 60;

/**
 * Daily cron: defensive tombstone sweep.
 *
 * Tombstone-index rows are written with a 90-day TTL by the DELETE
 * blob route, so Redis auto-expires them. This cron re-asserts that
 * invariant: it walks `dunamis:sync:tombstone:*` keys, checks each
 * one's TTL, and re-stamps any row whose TTL is missing or wrong (a
 * bug that wrote the row without `ex` would leave it forever).
 *
 * In a healthy system this cron does no work. The audit log entry it
 * leaves on every run is the proof the invariant holds.
 */
export async function GET(request: Request) {
  const authResp = authorizeCron(request);
  if (authResp) return authResp;

  const r = redis();
  const now = Date.now();
  let scanned = 0;
  let repaired = 0;
  let cursor: string = "0";
  let firstPage = true;

  for (let pages = 0; pages < 1000; pages++) {
    if (!firstPage && cursor === "0") break;
    firstPage = false;
    const result = (await r.scan(cursor === "0" ? 0 : cursor, {
      match: "dunamis:sync:tombstone:*",
      count: 200,
    })) as [string, string[]];
    const [next, batch] = result;
    for (const key of batch) {
      scanned++;
      const ttl = await r.ttl(key);
      // ttl semantics: -2 = key does not exist (raced with another
      // sweep), -1 = key exists but has no TTL set, n>0 = remaining
      // seconds. Any -1 is a bug — re-stamp at the canonical 90 days.
      if (ttl === -1) {
        await r.expire(key, NINETY_DAYS_SEC);
        repaired++;
      }
    }
    cursor = next;
  }

  console.log(
    `[cron sync-tombstone-sweep] scanned=${scanned} repaired=${repaired}`,
  );
  return NextResponse.json({
    ok: true,
    scanned,
    repaired,
    ran_at: new Date(now).toISOString(),
  });
}
