/**
 * Self-serve GDPR Article 15 / CCPA right-to-know data export for
 * the signed-in account. Builds the export server-side from the
 * shared data-export library and streams it as a JSON download.
 * See GET docstring for the lost-credentials fallback path.
 */
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { buildAccountDataExport, dataExportFilename } from "@/lib/data-export";

/**
 * GET /api/account/data-export
 *
 * Returns a JSON file containing every Dunamis-stored record keyed to
 * the authenticated account. Self-serve fulfillment of the GDPR
 * Article 15 (right of access) and CCPA "right to know" request for
 * accounts that can sign in. Customers who cannot sign in (lost
 * credentials, deleted account in 30-day recovery window, etc.) email
 * dsr@dunamisstudios.net and we run the same builder server-side.
 */
export async function GET() {
  const current = await getCurrentSession();
  if (!current) return apiError(401, "unauthenticated", "Please sign in.");

  const data = await buildAccountDataExport(current.account.accountId);
  const filename = dataExportFilename(current.account.email);
  const body = JSON.stringify(data, null, 2);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
