/**
 * Pull the actual (untruncated) client IP off a Next.js / standard
 * Request, for use with services that benefit from the precise value
 * (Cloudflare Turnstile siteverify, abuse-fingerprint correlation,
 * etc.). Returns undefined when no header surfaces the IP.
 *
 * Distinct from src/lib/truncate-ip.ts's truncatedClientIp, which
 * trims to a /24 (IPv4) or /48 (IPv6) before persistence. Persistence
 * paths should keep using that helper; this one is for ephemeral
 * forwarding to a third-party verifier that does not store the value.
 *
 * Order:
 *   1. x-forwarded-for, first hop (Vercel sets this; the first IP in
 *      the comma-separated list is the originating client per RFC 7239
 *      conventions and Vercel's own header behavior).
 *   2. x-real-ip (some proxies pass this instead).
 *   3. Give up and return undefined.
 */
export function getClientIp(req: Request): string | undefined {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return undefined;
}
