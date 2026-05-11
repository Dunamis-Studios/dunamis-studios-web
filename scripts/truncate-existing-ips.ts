/**
 * Walk every Atelier EULA acceptance record in Redis and rewrite its
 * ip_at_accept field to the truncated /24 (IPv4) or /48 (IPv6)
 * representation produced by src/lib/truncate-ip.ts. Records whose IP
 * is already truncated or null are left alone.
 *
 * EULA acceptance is the only Dunamis-stored record that carries a
 * client IP (activation and heartbeat persist machine fingerprints
 * and timestamps but not an IP, confirmed by audit before writing
 * this script). The migration brings the historical archive in line
 * with the post-truncation invariant the live route now enforces.
 *
 * Usage (loads .env.local automatically):
 *   npx tsx scripts/truncate-existing-ips.ts            # dry run, prints diff
 *   npx tsx scripts/truncate-existing-ips.ts --apply    # rewrites in place
 *
 * Re-runnable: subsequent runs on already-truncated records detect
 * no diff and write nothing.
 */
import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import { redis, KEY } from "../src/lib/redis";
import { truncateIp } from "../src/lib/truncate-ip";

const APPLY = process.argv.includes("--apply");

async function scanAcceptanceKeys(): Promise<string[]> {
  const r = redis();
  const out: string[] = [];
  let cursor = "0";
  // Serialization is required: Upstash SCAN must thread its cursor
  // and parallelizing would race. claude-code:allow-await-in-loop
  do {
    const [next, batch] = await r.scan(cursor, {
      match: "dunamis:atelier-eula-acceptance:*",
      count: 200,
    });
    cursor = String(next);
    for (const k of batch) {
      if (k.startsWith("dunamis:atelier-eula-acceptances-by-license:")) continue;
      out.push(k);
    }
  } while (cursor !== "0");
  return out;
}

async function processKey(
  key: string,
): Promise<"changed" | "unchanged" | "null"> {
  const r = redis();
  const record = await r.get<Record<string, unknown>>(key);
  if (!record) return "unchanged";
  const original = (record.ip_at_accept ?? null) as string | null;
  if (original == null) return "null";
  const truncated = truncateIp(original);
  if (truncated === original) return "unchanged";
  console.log(`  ${key}  ${original} -> ${truncated}`);
  if (APPLY) {
    const next = { ...record, ip_at_accept: truncated };
    await r.set(key, next);
  }
  return "changed";
}

async function main() {
  void KEY;
  const keys = await scanAcceptanceKeys();
  console.log(`scanned ${keys.length} acceptance keys`);

  const results = await Promise.all(keys.map(processKey));
  const changed = results.filter((r) => r === "changed").length;
  const unchanged = results.filter((r) => r === "unchanged").length;
  const nullIp = results.filter((r) => r === "null").length;

  console.log(
    `done. changed=${changed} unchanged=${unchanged} nullIp=${nullIp} mode=${
      APPLY ? "apply" : "dry-run"
    }`,
  );
  if (!APPLY && changed > 0) {
    console.log("re-run with --apply to write the truncated values");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
