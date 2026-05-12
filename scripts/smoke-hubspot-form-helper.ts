/**
 * Structural smoke for the shared HubSpot form helper.
 *
 * Exercises submitToHubspotForm()'s envelope behavior without
 * round-tripping to a live HubSpot form. The helper itself is
 * exercised by every form-submission surface in production, so a
 * dedicated test-form spike is overkill for this slice. Instead we
 * verify the contract: env handling, URL construction, timeout,
 * response parsing.
 *
 * Usage:
 *   npx tsx scripts/smoke-hubspot-form-helper.ts
 *
 * Optional: HUBSPOT_PORTAL_ID + LIVE_TEST_FORM_GUID set in the
 * environment to also run a live submission against a sacrificial
 * test form. Without those, only the structural cases run.
 */
import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import { submitToHubspotForm } from "../src/lib/hubspot/submit-form";

type Outcome =
  | { name: string; ok: true; detail: string }
  | { name: string; ok: false; detail: string };

const outcomes: Outcome[] = [];

async function check(
  name: string,
  fn: () => Promise<{ ok: boolean; detail: string }>,
): Promise<void> {
  try {
    const r = await fn();
    outcomes.push({ name, ok: r.ok, detail: r.detail });
  } catch (err) {
    outcomes.push({
      name,
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

async function main(): Promise<void> {
  await check("returns ok:false when HUBSPOT_PORTAL_ID is missing", async () => {
    const prev = process.env.HUBSPOT_PORTAL_ID;
    delete process.env.HUBSPOT_PORTAL_ID;
    try {
      const r = await submitToHubspotForm({
        formId: "any",
        fields: [{ name: "email", value: "x@example.com" }],
      });
      const passed = !r.ok && r.status === 0;
      return {
        ok: passed,
        detail: passed
          ? `status=${r.status} error="${r.error}"`
          : `unexpected result ${JSON.stringify(r)}`,
      };
    } finally {
      if (prev) process.env.HUBSPOT_PORTAL_ID = prev;
    }
  });

  await check("returns ok:false when formId is empty", async () => {
    process.env.HUBSPOT_PORTAL_ID = "20867488";
    const r = await submitToHubspotForm({
      formId: "",
      fields: [{ name: "email", value: "x@example.com" }],
    });
    const passed = !r.ok && r.status === 0;
    return {
      ok: passed,
      detail: passed ? `status=${r.status} error="${r.error}"` : "did not fail",
    };
  });

  await check("AbortController fires when timeout is 1ms", async () => {
    process.env.HUBSPOT_PORTAL_ID = "20867488";
    const start = Date.now();
    const r = await submitToHubspotForm({
      formId: "00000000-0000-0000-0000-000000000000",
      fields: [{ name: "email", value: "x@example.com" }],
      timeoutMs: 1,
    });
    const elapsed = Date.now() - start;
    const passed = !r.ok && r.status === 0 && elapsed < 5000;
    return {
      ok: passed,
      detail: `status=${r.status} elapsed=${elapsed}ms error="${r.error}"`,
    };
  });

  await check("rejects bogus form id with 4xx and surfaces error", async () => {
    process.env.HUBSPOT_PORTAL_ID = "20867488";
    const r = await submitToHubspotForm({
      formId: "00000000-0000-0000-0000-000000000000",
      fields: [
        { name: "email", value: "smoke@dunamisstudios.net" },
        { name: "firstname", value: "Smoke" },
        { name: "lastname", value: "Test" },
      ],
      context: { pageName: "smoke-hubspot-form-helper" },
    });
    // HubSpot returns 404 for unknown form ids in our portal. Either
    // way, the helper should report ok:false with a non-zero status.
    const passed = !r.ok && r.status > 0;
    return {
      ok: passed,
      detail: `status=${r.status} error="${r.error}"`,
    };
  });

  const liveFormId = process.env.LIVE_TEST_FORM_GUID; // claude-code:allow-undocumented-env
  if (liveFormId) {
    await check("live submission to LIVE_TEST_FORM_GUID succeeds", async () => {
      const r = await submitToHubspotForm({
        formId: liveFormId,
        fields: [
          { name: "email", value: "smoke@dunamisstudios.net" },
          { name: "firstname", value: "Smoke" },
          { name: "lastname", value: "Test" },
        ],
        context: { pageName: "smoke-hubspot-form-helper live test" },
      });
      return {
        ok: r.ok,
        detail: r.ok
          ? `ok hubspotResponse=${JSON.stringify(r.hubspotResponse).slice(0, 120)}`
          : `status=${r.status} error="${r.error}"`,
      };
    });
  } else {
    console.log(
      "# skip live submission: set LIVE_TEST_FORM_GUID in .env.local to enable",
    );
  }

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
