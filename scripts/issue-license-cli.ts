/**
 * issue-license-cli.ts
 *
 * Issue an Atelier license from the command line. Useful for issuing
 * licenses while traveling without a browser, or for batch-issuing
 * during a migration. Mirrors the /api/admin/issue-license endpoint
 * but bypasses the HTTP layer entirely — calls signAndPersistLicense
 * directly and optionally fires the customer-delivery email.
 *
 * Args:
 *   --email <addr>          Customer email (required)
 *   --product <slug>        Defaults to "atelier"
 *   --major <n>             Major version (default 1)
 *   --tier <name>           Tier (default "self-serve")
 *   --first-name <name>     Optional first name for the email greeting
 *   --send-email            If present, emails the customer via Resend
 *   --issued-by <addr>      Admin email recorded in the audit field
 *
 * Required env (loaded from .env.local):
 *   ATELIER_LICENSE_SIGNING_PRIVATE_KEY  PEM-encoded Ed25519 key
 *   KV_REST_API_URL + KV_REST_API_TOKEN  Upstash Redis credentials
 *   RESEND_API_KEY                       only required when --send-email
 *
 * Outputs the license string + lid to stdout on success. Exits 1 on any
 * failure with a diagnostic on stderr.
 *
 * Run: npm run issue-license -- --email josh@example.com --send-email
 */

import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import {
  signAndPersistLicense,
  VALID_TIERS,
  type AtelierLicenseTier,
} from "../src/lib/atelier-license-signing";
import { sendAtelierLicenseEmail } from "../src/lib/email-atelier-license";

interface Args {
  email: string;
  product: "atelier";
  major: number;
  tier: AtelierLicenseTier;
  firstName: string | null;
  sendEmail: boolean;
  issuedBy: string | null;
}

function parseArgs(argv: string[]): Args {
  const out: Partial<Args> = {
    product: "atelier",
    major: 1,
    tier: "self-serve",
    firstName: null,
    sendEmail: false,
    issuedBy: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case "--email":
        out.email = next;
        i++;
        break;
      case "--product":
        if (next !== "atelier") {
          throw new Error(`--product must be "atelier" (got "${next}")`);
        }
        out.product = "atelier";
        i++;
        break;
      case "--major":
        out.major = Number(next);
        if (!Number.isInteger(out.major) || out.major < 1 || out.major > 99) {
          throw new Error(`--major must be an integer 1-99 (got "${next}")`);
        }
        i++;
        break;
      case "--tier":
        if (!(VALID_TIERS as readonly string[]).includes(next)) {
          throw new Error(
            `--tier must be one of ${VALID_TIERS.join(", ")} (got "${next}")`,
          );
        }
        out.tier = next as AtelierLicenseTier;
        i++;
        break;
      case "--first-name":
        out.firstName = next;
        i++;
        break;
      case "--send-email":
        out.sendEmail = true;
        break;
      case "--issued-by":
        out.issuedBy = next;
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
  if (!out.email) {
    throw new Error("--email is required");
  }
  return out as Args;
}

function printHelp(): void {
  console.log(`
Atelier license CLI

Usage:
  npm run issue-license -- --email <addr> [--major N] [--tier T]
                            [--first-name NAME] [--send-email]
                            [--issued-by ADMIN_EMAIL]

Options:
  --email        Customer email (required)
  --product      Defaults to "atelier"
  --major        Major version (default 1)
  --tier         ${VALID_TIERS.join(" | ")} (default "self-serve")
  --first-name   Optional first name for the email greeting
  --send-email   If present, emails the customer via Resend
  --issued-by    Admin email recorded in the audit field
  --help, -h     Show this message

Examples:
  # Sign + persist, print the license string. Don't email.
  npm run issue-license -- --email customer@example.com

  # Sign + persist + email the customer.
  npm run issue-license -- --email customer@example.com --send-email \\
    --first-name Pat --issued-by josh@dunamisstudios.com
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

  if (!process.env.ATELIER_LICENSE_SIGNING_PRIVATE_KEY) {
    console.error(
      "ATELIER_LICENSE_SIGNING_PRIVATE_KEY is not set. Add it to .env.local.",
    );
    process.exit(1);
  }
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error(
      "KV_REST_API_URL and KV_REST_API_TOKEN must be set for Redis writes.",
    );
    process.exit(1);
  }
  if (args.sendEmail && !process.env.RESEND_API_KEY) {
    console.error(
      "--send-email was specified but RESEND_API_KEY is not set.",
    );
    process.exit(1);
  }

  const { signed, record } = await signAndPersistLicense({
    email: args.email,
    product: args.product,
    versionMajor: args.major,
    tier: args.tier,
    issuedByAdminEmail: args.issuedBy,
  });

  if (args.sendEmail) {
    try {
      await sendAtelierLicenseEmail({
        to: args.email,
        firstName: args.firstName,
        licenseString: signed.licenseString,
        isResend: false,
      });
      console.error(`[issue-license] emailed to ${args.email}`);
    } catch (err) {
      console.error(
        `[issue-license] email failed (license still persisted): ${err instanceof Error ? err.message : err}`,
      );
      process.exitCode = 2;
    }
  }

  console.log(signed.licenseString);
  console.error(
    `[issue-license] lid=${record.lid} email=${record.email} major=${record.version_major} tier=${record.tier}`,
  );
}

main().catch((err) => {
  console.error("[issue-license] failed", err);
  process.exit(1);
});
