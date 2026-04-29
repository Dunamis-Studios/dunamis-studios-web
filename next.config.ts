import { execSync } from "node:child_process";
import type { NextConfig } from "next";

/**
 * Derive the current commit's author date at build time. Vercel does
 * not expose a commit-timestamp env var (only SHA, REF, MESSAGE,
 * AUTHOR_LOGIN, AUTHOR_NAME), so we compute it from git directly. The
 * value is injected into process.env via Next's `env` field so server
 * routes (sitemap.ts) can read it as GIT_COMMIT_AUTHOR_DATE. Falls
 * back to empty string if git is unavailable; sitemap.ts handles that.
 */
function gitCommitAuthorDate(): string {
  try {
    return execSync("git log -1 --format=%aI HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  env: {
    GIT_COMMIT_AUTHOR_DATE: gitCommitAuthorDate(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            // CSP: unsafe-inline on script/style stays until Next.js App
            // Router inline boot scripts can be nonce'd without breaking
            // streaming render. Stripe + Vercel Analytics are allowlisted
            // explicitly; everything else defaults to self.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://js.stripe.com https://cdn.vercel-insights.com https://va.vercel-scripts.com https://js.hs-scripts.com https://js.hs-analytics.net https://js.hs-banner.com https://js.hubspot.com https://js.usemessages.com https://js.hsadspixel.net https://js.hscollectedforms.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: https://track.hubspot.com https://*.hubspot.com https://forms.hsforms.com https://*.hs-banner.com",
              "font-src 'self' data:",
              "connect-src 'self' https://api.stripe.com https://vitals.vercel-insights.com https://api.hubapi.com https://forms.hubspot.com https://track.hubspot.com https://api.hubspot.com https://*.hubspot.com https://*.hs-analytics.net https://*.hscollectedforms.net https://js.hs-banner.com https://*.hs-banner.com https://forms.hsforms.com https://*.hubapi.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com https://app.hubspot.com https://forms.hsforms.com https://*.hubspot.com",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
