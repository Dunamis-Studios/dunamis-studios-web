import type { MetadataRoute } from "next";

/**
 * Last-modified timestamp bumped per deploy. A single constant keeps every
 * entry aligned without sprinkling `new Date()` calls that would make the
 * sitemap non-deterministic across requests on a cold-started serverless
 * instance.
 */
const LAST_MODIFIED = new Date("2026-04-18T00:00:00.000Z");

function baseUrl(): string {
  return (
    process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net"
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = baseUrl();

  return [
    {
      url: `${base}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/products/debrief`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/products/property-pulse`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/pricing`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/terms`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/privacy`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/login`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${base}/signup`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/forgot-password`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
