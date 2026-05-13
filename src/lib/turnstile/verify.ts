import "server-only";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 10_000;

/**
 * Structured result from a Cloudflare Turnstile siteverify call.
 *
 *   valid             true iff Cloudflare returned success=true.
 *   errors            the error-codes array Cloudflare returned (empty
 *                     when the call short-circuited locally on a
 *                     missing token, timed out, or threw).
 *   hostname          the hostname Cloudflare saw the token issued on,
 *                     when present. Useful in logs to spot key reuse
 *                     across domains.
 *   challengeTimestamp ISO-8601 instant the challenge was solved, when
 *                     present. Lets the caller reject very old tokens
 *                     beyond Cloudflare's own freshness window if it
 *                     wants extra defense-in-depth.
 */
export interface TurnstileVerifyResult {
  valid: boolean;
  errors: string[];
  hostname?: string;
  challengeTimestamp?: string;
}

interface SiteverifyResponse {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
  challenge_ts?: string;
  action?: string;
}

/**
 * Lazy secret read. Throws on first verifyTurnstileToken call when
 * TURNSTILE_SECRET_KEY is unset, rather than at module load. The
 * lazy posture matches src/lib/verification-key/service.ts: routes
 * that import the helper at build time on a deploy where the secret
 * is intentionally unset (dev, preview without the env var) still
 * compile; the first request that tries to verify a token fails
 * loud with a clear message.
 */
function requireSecret(): string {
  const s = process.env.TURNSTILE_SECRET_KEY;
  if (!s) {
    throw new Error(
      "TURNSTILE_SECRET_KEY env var is required. Provision a Turnstile " +
        "site in Cloudflare and set both NEXT_PUBLIC_TURNSTILE_SITE_KEY " +
        "(client) and TURNSTILE_SECRET_KEY (server) on Vercel.",
    );
  }
  return s;
}

/**
 * Verify a Turnstile token against Cloudflare's siteverify API.
 *
 * Empty / missing token: short-circuits without a network call and
 * returns valid=false with a synthetic "missing-input-response" error
 * code so callers do not need to do their own empty check before
 * calling this.
 *
 * Timeout / network failure: returns valid=false with a synthetic
 * "internal-error" code; the caller should treat this as an
 * upstream-failure 502, not a 400, since the failure was on our side.
 *
 * The remoteIp arg is optional. Cloudflare's docs say it improves
 * fraud detection but is not required, and we pull it lazily from
 * src/lib/get-client-ip.ts so an unforwarded local dev request can
 * still verify a token.
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string,
): Promise<TurnstileVerifyResult> {
  const trimmed = typeof token === "string" ? token.trim() : "";
  if (!trimmed) {
    return { valid: false, errors: ["missing-input-response"] };
  }

  const secret = requireSecret();
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", trimmed);
  if (remoteIp) body.set("remoteip", remoteIp);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error("[turnstile] siteverify non-2xx", {
        status: res.status,
      });
      return { valid: false, errors: ["internal-error"] };
    }
    const json = (await res.json()) as SiteverifyResponse;
    if (!json.success) {
      console.error("[turnstile] siteverify rejected token", {
        errors: json["error-codes"],
        hostname: json.hostname,
      });
      return {
        valid: false,
        errors: json["error-codes"] ?? [],
        hostname: json.hostname,
        challengeTimestamp: json.challenge_ts,
      };
    }
    return {
      valid: true,
      errors: [],
      hostname: json.hostname,
      challengeTimestamp: json.challenge_ts,
    };
  } catch (err) {
    const aborted =
      err instanceof Error && err.name === "AbortError";
    console.error("[turnstile] siteverify call failed", {
      error: err instanceof Error ? err.message : String(err),
      aborted,
    });
    return { valid: false, errors: ["internal-error"] };
  } finally {
    clearTimeout(timeout);
  }
}
