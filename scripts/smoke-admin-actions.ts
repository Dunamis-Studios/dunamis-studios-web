/**
 * Smoke-exercise every admin service function.
 *
 * Each service_admin_* helper in src/lib/admin/services.ts is called
 * once. Non-destructive services (trigger_data_export, refresh_from_
 * stripe) are invoked for real against a live account. Destructive
 * services (deactivate_device, revoke_license, resend_license_email,
 * set_refund_flag, delete_account, update_account_profile) are
 * invoked with invalid identifiers to exercise the validation path
 * without mutating data. We assert the expected AdminActionError
 * status code and message shape for each.
 *
 * Usage:
 *   npx tsx scripts/smoke-admin-actions.ts --email you@example.com
 *
 * The script does NOT speak HTTP. It exercises the service layer
 * directly so the smoke is meaningful even on a developer's machine
 * without the admin auth cookie. The route handlers add the auth +
 * rate-limit envelope; that surface is tested separately.
 */
import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import { getAccountByEmail } from "../src/lib/accounts";
import { AdminActionError } from "../src/lib/admin/action-runner";
import {
  service_admin_deactivate_device,
  service_admin_revoke_license,
  service_admin_resend_license_email,
  service_admin_update_account_profile,
  service_admin_delete_account,
  service_admin_trigger_data_export,
  service_admin_refresh_from_stripe,
  service_admin_set_refund_flag,
} from "../src/lib/admin/services";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i < 0) return undefined;
  return process.argv[i + 1];
}

const ADMIN_EMAIL = "smoke@dunamisstudios.com";
const BOGUS_LID = "smoke-bogus-lid-00000000-0000-0000-0000-000000000000";
const BOGUS_ACTIVATION_ID =
  "smoke-bogus-activation-00000000-0000-0000-0000-000000000000";
const BOGUS_ACCOUNT_ID = "smoke-bogus-account-id";

type Outcome =
  | { name: string; ok: true; detail: string }
  | { name: string; ok: false; detail: string };

async function expectError(
  name: string,
  status: number,
  fn: () => Promise<unknown>,
): Promise<Outcome> {
  try {
    await fn();
    return {
      name,
      ok: false,
      detail: `expected AdminActionError status ${status}, got success`,
    };
  } catch (err) {
    if (err instanceof AdminActionError && err.status === status) {
      return { name, ok: true, detail: `${status} ${err.message}` };
    }
    if (err instanceof AdminActionError) {
      return {
        name,
        ok: false,
        detail: `expected status ${status}, got ${err.status}: ${err.message}`,
      };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { name, ok: false, detail: `unexpected error: ${msg}` };
  }
}

async function expectSuccess(
  name: string,
  fn: () => Promise<string>,
): Promise<Outcome> {
  try {
    const detail = await fn();
    return { name, ok: true, detail };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { name, ok: false, detail: `unexpected error: ${msg}` };
  }
}

async function main() {
  const email = arg("--email");
  if (!email) {
    console.error("usage: tsx scripts/smoke-admin-actions.ts --email <email>");
    process.exit(2);
  }

  const account = await getAccountByEmail(email);
  if (!account) {
    console.error(`no account found for email ${email}`);
    process.exit(1);
  }
  const accountId = account.accountId;
  console.log(`# smoke against account ${accountId} (${account.email})`);

  const outcomes: Outcome[] = [];

  outcomes.push(
    await expectError(
      "deactivate_device(404 bogus activation)",
      404,
      () =>
        service_admin_deactivate_device({
          accountId,
          activationId: BOGUS_ACTIVATION_ID,
          adminEmail: ADMIN_EMAIL,
        }),
    ),
  );

  outcomes.push(
    await expectError("revoke_license(404 bogus lid)", 404, () =>
      service_admin_revoke_license({
        accountId,
        lid: BOGUS_LID,
        adminEmail: ADMIN_EMAIL,
        reason: "smoke test",
      }),
    ),
  );

  outcomes.push(
    await expectError("resend_license_email(404 bogus lid)", 404, () =>
      service_admin_resend_license_email({
        accountId,
        lid: BOGUS_LID,
        adminEmail: ADMIN_EMAIL,
      }),
    ),
  );

  outcomes.push(
    await expectError("update_account_profile(409 no changes)", 409, () =>
      service_admin_update_account_profile({
        accountId,
        adminEmail: ADMIN_EMAIL,
        firstName: account.firstName,
        lastName: account.lastName,
      }),
    ),
  );

  outcomes.push(
    await expectError(
      "delete_account(404 bogus account)",
      404,
      () =>
        service_admin_delete_account({
          accountId: BOGUS_ACCOUNT_ID,
          adminEmail: ADMIN_EMAIL,
          reason: "smoke test",
        }),
    ),
  );

  outcomes.push(
    await expectError("set_refund_flag(404 bogus lid)", 404, () =>
      service_admin_set_refund_flag({
        accountId,
        lid: BOGUS_LID,
        adminEmail: ADMIN_EMAIL,
      }),
    ),
  );

  outcomes.push(
    await expectSuccess("trigger_data_export(success)", async () => {
      const result = await service_admin_trigger_data_export({
        accountId,
        adminEmail: ADMIN_EMAIL,
      });
      const licenseCount = result.export.atelier.licenses.length;
      return `${result.filename} (${licenseCount} licenses)`;
    }),
  );

  outcomes.push(
    await expectSuccess("refresh_from_stripe(success)", async () => {
      const result = await service_admin_refresh_from_stripe({
        accountId,
        adminEmail: ADMIN_EMAIL,
      });
      return `${result.entitlementCount} entitlements, ${result.snapshots.length} snapshots, ${result.errors.length} errors`;
    }),
  );

  let failed = 0;
  for (const o of outcomes) {
    const marker = o.ok ? "ok  " : "FAIL";
    console.log(`${marker}  ${o.name}: ${o.detail}`);
    if (!o.ok) failed++;
  }
  console.log(`# ${outcomes.length - failed}/${outcomes.length} passed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
