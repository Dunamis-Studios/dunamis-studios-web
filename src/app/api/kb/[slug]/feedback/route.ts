import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getArticleBySlug } from "@/lib/kb";
import { hasAlreadyRated, hashIp } from "@/lib/kb-rating";
import { ipHashPrefix, recordFeedback } from "@/lib/kb-feedback";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9-]+$/;

const postBodySchema = z.object({
  direction: z.enum(["up", "down"]),
  body: z.string().trim().min(1).max(500),
  category: z.string().min(1).regex(SLUG_RE, {
    message: "category must be kebab-case",
  }),
});

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * POST /api/kb/[slug]/feedback
 *
 * Body: { direction: "up" | "down", body: string (1-500), category: string }
 * Response: { ok: true }
 *
 * Gate: the caller's IP hash must already appear in kbRated for this
 * article — i.e., they rated before trying to leave feedback. This
 * prevents feedback spam from IPs that never actually read the page,
 * without forcing account signups on readers.
 *
 * Storage: appended to dunamis:kb:feedback:{category}:{slug} as a
 * JSON-encoded LIST entry. LTRIM keeps only the 100 newest entries.
 * Only the first 8 chars of the hashed IP are persisted — enough for
 * admin correlation, not enough to re-identify the visitor.
 *
 * Rate limit: 10 / 15 min / IP. Separate bucket from the rate
 * endpoint so a burst of feedback doesn't starve someone else's vote.
 */
export async function POST(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  if (!SLUG_RE.test(slug)) {
    return apiError(400, "invalid_slug", "Invalid article slug.");
  }

  const ip = clientIp(req.headers);
  const rl = await rateLimit("kb-feedback", ip, 10, 15 * 60);
  if (!rl.ok) {
    return apiError(
      429,
      "rate_limited",
      "Too many feedback submissions. Try again in a few minutes.",
    );
  }

  const parsed = await parseJson(req, postBodySchema);
  if (!parsed.ok) return parsed.response;
  const { direction, body, category } = parsed.data;

  const article = await getArticleBySlug(category, slug);
  if (!article) {
    return apiError(404, "not_found", "Article not found.");
  }

  const ipHash = hashIp(ip);

  // Must have rated before leaving feedback. In the normal widget
  // flow the thumbs-down POST to /rate runs right before this one, so
  // the set membership check passes. Direct POSTs from anyone who
  // hasn't rated are rejected.
  if (!(await hasAlreadyRated(category, slug, ipHash))) {
    return apiError(
      403,
      "not_rated",
      "Rate the article before leaving feedback.",
    );
  }

  await recordFeedback(category, slug, {
    ts: new Date().toISOString(),
    direction,
    body,
    ipHashPrefix: ipHashPrefix(ipHash),
  });

  return NextResponse.json({ ok: true });
}
