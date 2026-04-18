import type { MetadataRoute } from "next";

function baseUrl(): string {
  return (
    process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net"
  );
}

export default function robots(): MetadataRoute.Robots {
  const base = baseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account/",
          "/api/",
          "/reset-password",
          "/verify-email",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
