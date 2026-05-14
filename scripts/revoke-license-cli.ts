/**
 * revoke-license-cli.ts
 *
 * Mark an Atelier license as revoked from the command line. Mirrors
 * the /api/admin/license-status endpoint but bypasses the HTTP layer
 * entirely — calls setLicenseStatus directly. Useful for one-off
 * cleanups where the leaked license string is in chat logs or
 * screenshots and needs to be killed immediately.
 *
 * The license string itself remains cryptographically valid by design
 * (offline Ed25519 verification still passes), but the activation
 * and heartbeat endpoints branch on the recorded status:
 *   - immediate: hard-locks the next activate or heartbeat
 *   - grace_14d: soft-warn for 14 days, hard-lock after
 *
 * Args:
 *   --lid <id>              License id to revoke (required)
 *   --mode <m>              "immediate" or "grace_14d" (default "immediate")
 *   --reason <text>         Audit-trail commentary (admin-only, never customer-visible)
 *   --revoked-by <addr>     Admin email recorded on the audit field
 *
 * Required env (loaded from .env.local):
 *   KV_REST_API_URL + KV_REST_API_TOKEN  Upstash Redis credentials
 *
 * Run: npm run revoke-license -- --lid <id> --mode immediate --reason "..."
 */

import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import {
  setLicenseStatus,
  type AtelierRevocationMode,
} from "../src/lib/atelier-license-signing";

interface Args {
  lid: string;
  mode: AtelierRevocationMode;
  reason: string | null;
  revokedBy: string | null;
}

function parseArgs(argv: string[]): Args {
  const out: Partial<Args> = {
    mode: "immediate",
    reason: null,
    revokedBy: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case "--lid":
        out.lid = next;
        i++;
        break;
      case "--mode":
        if (next !== "immediate" && next !== "grace_14d") {
          throw new Error(
            `--mode must be "immediate" or "grace_14d" (got "${next}")`,
          );
        }
        out.mode = next;
        i++;
        break;
      case "--reason":
        out.reason = next;
        i++;
        break;
      case "--revoked-by":
        out.revokedBy = next;
        i++;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!out.lid) {
    throw new Error("--lid is required");
  }
  return out as Args;
}

function printHelp(): void {
  console.log(`
Atelier license revoke CLI

Usage:
  npm run revoke-license -- --lid <id> [--mode immediate|grace_14d]
                            [--reason "..."] [--revoked-by ADMIN_EMAIL]

Options:
  --lid          License id to revoke (required)
  --mode         "immediate" (default) or "grace_14d"
  --reason       Audit-trail commentary, admin-only
  --revoked-by   Admin email recorded in the audit field
  --help, -h     Show this message

Examples:
  npm run revoke-license -- --lid abc-123 --reason "Leaked in support ticket"
  npm run revoke-license -- --lid abc-123 --mode grace_14d \\
    --reason "Refund processed" --revoked-by admin@example.com
`);
}

async function main(): Promise<void> {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    console.error("Run with --help for usage.");
    process.exit(1);
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error(
      "KV_REST_API_URL and KV_REST_API_TOKEN must be set for Redis writes.",
    );
    process.exit(1);
  }

  const updated = await setLicenseStatus(args.lid, "revoked", {
    revocation_mode: args.mode,
    revocation_reason: args.reason ?? undefined,
    revoked_by_admin_email: args.revokedBy ?? undefined,
  });

  if (!updated) {
    console.error(`[revoke-license] no license found with lid=${args.lid}`);
    process.exit(1);
  }

  console.error(
    `[revoke-license] lid=${updated.lid} status=${updated.status} mode=${updated.revocation_mode ?? "n/a"} revoked_at=${updated.revoked_at ?? "n/a"} email=${updated.email}`,
  );
}

main().catch((err) => {
  console.error("[revoke-license] failed", err);
  process.exit(1);
});
