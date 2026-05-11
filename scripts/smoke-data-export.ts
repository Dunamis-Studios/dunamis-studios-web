/**
 * Smoke-exercise the data-export builder against a live account.
 *
 * The builder under test is src/lib/data-export.ts. We pull a real
 * account by email and run buildAccountDataExport() against the
 * live Upstash Redis namespace, then inspect the shape.
 *
 * Usage (reads .env.local automatically):
 *   npx tsx scripts/smoke-data-export.ts --email you@example.com
 *
 * Passing --write-to <path> dumps the export to a file instead of
 * printing the size summary, useful for ad-hoc inspection.
 */
import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import { writeFileSync } from "node:fs";
import { buildAccountDataExport } from "../src/lib/data-export";
import { getAccountByEmail } from "../src/lib/accounts";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i < 0) return undefined;
  return process.argv[i + 1];
}

async function main() {
  const email = arg("--email");
  if (!email) {
    console.error("usage: tsx scripts/smoke-data-export.ts --email <email>");
    process.exit(2);
  }
  const writeTo = arg("--write-to");

  const account = await getAccountByEmail(email);
  if (!account) {
    console.error(`no account found for email ${email}`);
    process.exit(1);
  }

  const t0 = Date.now();
  const data = await buildAccountDataExport(account.accountId);
  const elapsedMs = Date.now() - t0;

  if (writeTo) {
    writeFileSync(writeTo, JSON.stringify(data, null, 2), "utf8");
    console.log(`wrote ${writeTo} (${elapsedMs} ms)`);
    return;
  }

  const sessionCount = data.sessions.length;
  const entitlementCount = data.entitlements.length;
  const licenseCount = data.atelier.licenses.length;
  const activationCount = Object.values(data.atelier.activations_by_license)
    .map((arr) => arr.length)
    .reduce((a, b) => a + b, 0);
  const acceptanceCount = Object.values(
    data.atelier.eula_acceptances_by_license,
  )
    .map((arr) => arr.length)
    .reduce((a, b) => a + b, 0);

  console.log(`account_id: ${data.account?.accountId ?? "<missing>"}`);
  console.log(`generated_at: ${data.generated_at}`);
  console.log(`format_version: ${data.format_version}`);
  console.log(`elapsed_ms: ${elapsedMs}`);
  console.log(`sessions: ${sessionCount}`);
  console.log(`entitlements: ${entitlementCount}`);
  console.log(`atelier_licenses: ${licenseCount}`);
  console.log(`atelier_activations: ${activationCount}`);
  console.log(`atelier_eula_acceptances: ${acceptanceCount}`);

  if (!data.account) throw new Error("account missing from export");
  if (data.account.accountId !== account.accountId) {
    throw new Error("account_id mismatch in export");
  }
  for (const s of data.sessions) {
    if (s.accountId !== account.accountId) {
      throw new Error("session account_id mismatch in export");
    }
  }
  for (const e of data.entitlements) {
    if (e.accountId !== account.accountId) {
      throw new Error("entitlement account_id mismatch in export");
    }
  }

  console.log("ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
