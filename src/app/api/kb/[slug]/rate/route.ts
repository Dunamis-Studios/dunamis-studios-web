import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getArticleBySlug } from "@/lib/kb";
import {
  getRatingCounts,
  hasAlreadyRated,
  hashIp,
  recordRating,
} from "@/lib/kb-rating";
import { getCurrentSession } from "@/lib/session";
import type { Account } from "@/lib/types";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9-]+$/;

const postBodySchema = z.object({
  direction: z.enum(["up", "down"]),
  category: z.string().min(1).regex(SLUG_RE, {
    message: "category must be kebab-case",
  }),
});

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * Account role check. The Account type doesn't yet carry a `role`
 * field (see deviation note in this commit) — until the admin role
 * system lands, this check always returns false, which means the GET
 * handler below fails closed for every caller. That's the intended
 * safety posture: no one inspects raw counts through the endpoint
 * until the role system actually exists.
 */
function isAdminAccount(account: Account): boolean {
  return (account as Account & { role?: string }).role === "admin";
}

/**
 * POST /api/kb/[slug]/rate
 *
 * Body: { direction: "up" | "down", category: string }
 * Response: { up: number, down: number, alreadyRated: boolean }
 *
 * Dedup is IP-hash based. A repeat vote from the same hashed IP is a
 * no-op — the response's counts reflect the stored state and
 * alreadyRated is true. The client treats either outcome the same
 * (show "thanks"); alreadyRated is a hint for future product decisions
 * (e.g., offer to change vote), not a hard error.
 *
 * The counts in the response are NOT surfaced to readers — the client
 * uses them only to populate the admin-bound widget if ever needed,
 * and the reader-facing badge is derived server-side via
 * getHelpfulBadge() in the article page.
 *
 * Rate limit: 100 requests / 1h / IP. Large enough that a user who
 * reads a handful of articles and rates each one won't trip the limit
 * (especially behind NAT / corporate proxies that aggregate many real
 * users onto one IP), tight enough to keep a runaway bot from
 * pounding Redis.
 */
export async function POST(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  if (!SLUG_RE.test(slug)) {
    return apiError(400, "invalid_slug", "Invalid article slug.");
  }

  const ip = clientIp(req.headers);
  const rl = await rateLimit("kb-rate", ip, 100, 60 * 60);
  if (!rl.ok) {
    return apiError(
      429,
      "rate_limited",
      "Too many rating requests. Try again in a few minutes.",
    );
  }

  const parsed = await parseJson(req, postBodySchema);
  if (!parsed.ok) return parsed.response;
  const { direction, category } = parsed.data;

  const article = await getArticleBySlug(category, slug);
  if (!article) {
    return apiError(404, "not_found", "Article not found.");
  }

  const ipHash = hashIp(ip);
  if (await hasAlreadyRated(category, slug, ipHash)) {
    const counts = await getRatingCounts(category, slug);
    return NextResponse.json({ ...counts, alreadyRated: true });
  }

  const counts = await recordRating(category, slug, direction, ipHash);
  return NextResponse.json({ ...counts, alreadyRated: false });
}

/**
 * GET /api/kb/[slug]/rate?category={category}
 *
 * ADMIN-GATED. Returns { up, down } for operational inspection. Raw
 * counts are internal QA signal — never shown to readers in any form.
 * Reader-facing surfaces derive a boolean "Helpful" flag via
 * getHelpfulBadge() directly against Redis in server components; the
 * thresholds live in src/lib/kb-rating.ts and never transit this
 * endpoint.
 *
 * Response codes:
 *   200 — admin, returns { up, down }
 *   401 — no session cookie
 *   403 — session present but account is not an admin
 *   404 — article does not exist
 *
 * Cache: no-store. Admins poking the endpoint are actively triaging;
 * a stale 60s cache would hide fresh signal.
 */
export async function GET(req: Request, { params }: RouteParams) {
  const session = await getCurrentSession().catch(() => null);
  if (!session) {
    return apiError(401, "unauthenticated", "Sign in required.");
  }
  if (!isAdminAccount(session.account)) {
    return apiError(403, "forbidden", "Admin role required.");
  }

  const { slug } = await params;
  if (!SLUG_RE.test(slug)) {
    return apiError(400, "invalid_slug", "Invalid article slug.");
  }
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? "";
  if (!SLUG_RE.test(category)) {
    return apiError(
      400,
      "missing_category",
      "category query param is required",
    );
  }

  const article = await getArticleBySlug(category, slug);
  if (!article) {
    return apiError(404, "not_found", "Article not found.");
  }

  const counts = await getRatingCounts(category, slug);
  return NextResponse.json(counts, {
    headers: { "cache-control": "no-store" },
  });
}
