/**
 * backfill-license-account-id.ts
 *
 * One-shot backfill for Atelier license records that pre-date the
 * `account_id` field. For each license:
 *   1. Resolve the Dunamis account id by `email` lookup
 *      (dunamis:email-to-account:{email}).
 *   2. Write `account_id` onto the license record.
 *   3. Add the lid to `dunamis:atelier-licenses-by-account:{account_id}`.
 *
 * Licenses whose email does not resolve to an account stay with
 * `account_id: null` — typical of admin-issued comp/test licenses
 * that never went through site signup. They are surfaced in the
 * report so the operator can decide whether to claim them by hand.
 *
 * Idempotent: re-running on an already-backfilled record is a no-op
 * (the record's account_id matches the resolved account id, the
 * SADD into the per-account set is a no-op).
 *
 * Usage:
 *   npm run backfill:license-account-id              # dry-run by default
 *   npm run backfill:license-account-id -- --apply   # actually write
 *   npm run backfill:license-account-id -- --apply --lid <lid>   # single lid
 *
 * Run from the dunamisstudios-site repo root with `.env.local` in
 * place so the Upstash Redis env vars are loaded the same way the
 * Next.js app loads them.
 */

import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";

// --------------------------------------------------------------------------
// CLI parsing
// --------------------------------------------------------------------------
const argv = process.argv.slice(2);
function arg(flag: string): string | undefined {
  const i = argv.indexOf(flag);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined;
}
function has(flag: string): boolean {
  return argv.includes(flag);
}
if (has("--help") || has("-h")) {
  console.log(`
backfill-license-account-id — populate account_id on existing Atelier licenses

Optional:
  --apply                  Actually write changes (default is dry-run)
  --lid <lid>              Backfill just one lid (skip the product index walk)
  --product <slug>         Product index to walk (default: atelier)
  --help, -h               Show this message
`);
  process.exit(0);
}

const apply = has("--apply");
const product = arg("--product") ?? "atelier";
const singleLid = arg("--lid");

const url = process.env.KV_REST_API_URL ?? process.env.REDIS_URL;
const token = process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error(
    "Redis env vars missing. Set KV_REST_API_URL and KV_REST_API_TOKEN " +
      "(auto-populated by the Upstash integration in Vercel; in local dev " +
      "make sure .env.local has them).",
  );
  process.exit(1);
}
const r = new Redis({ url, token });

// --------------------------------------------------------------------------
// Key builders — duplicated from src/lib/redis.ts because this script
// runs outside the Next.js TS path mapping. Keep in lockstep with the
// canonical KEY object there.
// --------------------------------------------------------------------------
const KEY = {
  atelierLicense: (lid: string) => `dunamis:atelier-license:${lid}`,
  atelierLicensesByProduct: (p: string) =>
    `dunamis:atelier-licenses-by-product:${p}`,
  atelierLicensesByAccount: (accountId: string) =>
    `dunamis:atelier-licenses-by-account:${accountId}`,
  emailIndex: (email: string) =>
    `dunamis:email-to-account:${email.toLowerCase()}`,
};

interface LicenseRecord {
  lid: string;
  email: string;
  account_id?: string | null;
  status: string;
  product: string;
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------
async function main() {
  const lids = singleLid
    ? [singleLid]
    : ((await r.smembers(KEY.atelierLicensesByProduct(product))) as string[]);

  if (lids.length === 0) {
    console.log(`No licenses found for product=${product}.`);
    return;
  }

  console.log(
    `${apply ? "APPLYING" : "DRY-RUN"} backfill across ${lids.length} license(s) ` +
      `(product=${product}${singleLid ? `, single lid=${singleLid}` : ""}).`,
  );
  console.log("");

  let alreadyOk = 0;
  let resolved = 0;
  let unresolvedEmail = 0;
  let missingRecord = 0;

  for (const lid of lids) {
    const record = (await r.get<LicenseRecord>(
      KEY.atelierLicense(lid),
    )) as LicenseRecord | null;
    if (!record) {
      console.warn(`  [missing] lid=${lid} — record not found, skipping`);
      missingRecord++;
      continue;
    }

    const email = record.email;
    const resolvedAccountId = (await r.get<string>(
      KEY.emailIndex(email),
    )) as string | null;

    if (!resolvedAccountId) {
      console.warn(
        `  [unresolved] lid=${lid} email=${email} — no account exists for this address; ` +
          `leaving account_id:null. Operator may need to create the account or claim by hand.`,
      );
      unresolvedEmail++;
      continue;
    }

    if (record.account_id === resolvedAccountId) {
      // Already backfilled. Confirm the index entry exists and move on.
      if (apply) {
        await r.sadd(
          KEY.atelierLicensesByAccount(resolvedAccountId),
          lid,
        );
      }
      alreadyOk++;
      continue;
    }

    if (record.account_id && record.account_id !== resolvedAccountId) {
      console.warn(
        `  [conflict] lid=${lid} email=${email} ` +
          `existing_account_id=${record.account_id} ` +
          `email_resolves_to=${resolvedAccountId} — leaving as-is. ` +
          `An operator should reconcile by hand.`,
      );
      continue;
    }

    const updated = { ...record, account_id: resolvedAccountId };
    if (apply) {
      await r.set(KEY.atelierLicense(lid), updated);
      await r.sadd(
        KEY.atelierLicensesByAccount(resolvedAccountId),
        lid,
      );
    }
    console.log(
      `  [${apply ? "wrote" : "would-write"}] lid=${lid} email=${email} ` +
        `→ account_id=${resolvedAccountId}`,
    );
    resolved++;
  }

  console.log("");
  console.log(`Summary:`);
  console.log(`  resolved (newly bound): ${resolved}`);
  console.log(`  already ok:             ${alreadyOk}`);
  console.log(`  unresolved (no acct):   ${unresolvedEmail}`);
  console.log(`  missing record:         ${missingRecord}`);
  if (!apply) {
    console.log("");
    console.log("Dry-run only. Re-run with --apply to write.");
  }
}

// Suppress unused-import warning from the standard "imported but only
// for typing" pattern when the file is run via tsx — `createHash` is
// reserved here for future per-record audit hashes if drift is
// observed during the migration window.
void createHash;

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
