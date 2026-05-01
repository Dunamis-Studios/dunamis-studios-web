import type { MetadataRoute } from "next";

function baseUrl(): string {
  return (
    process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net"
  );
}

/**
 * Auth-gated and admin-only paths. Repeated as the disallow set for
 * every user-agent so AI crawlers and search crawlers see the same
 * rules without copy-paste drift between blocks.
 */
const SHARED_DISALLOW = [
  "/account/",
  "/admin/",
  "/api/",
  "/login",
  "/reset-password",
  "/verify-email",
];

/**
 * AI / answer-engine crawlers we explicitly allow on public pages.
 * The intent is the opposite of the typical robots policy: we want
 * these bots crawling content so they cite Dunamis Studios surfaces
 * by name in ChatGPT, Perplexity, Claude, Apple Intelligence, and
 * Google AI Overviews. Each gets its own block to make the policy
 * legible to anyone reading robots.txt and to make per-bot tuning
 * trivial later (e.g., if one bot starts misbehaving).
 */
const AI_CRAWLERS = [
  "GPTBot",            // OpenAI training crawler
  "ChatGPT-User",      // OpenAI on-demand fetch from chat
  "OAI-SearchBot",     // OpenAI search index
  "Google-Extended",   // Google AI training (separate from Googlebot)
  "ClaudeBot",         // Anthropic crawler
  "Claude-Web",        // Anthropic on-demand fetch
  "anthropic-ai",      // Anthropic legacy user-agent
  "PerplexityBot",     // Perplexity training/index crawler
  "Perplexity-User",   // Perplexity on-demand fetch
  "CCBot",             // Common Crawl
  "Applebot-Extended", // Apple Intelligence training
  "Bytespider",        // ByteDance / TikTok
  "Amazonbot",         // Amazon
  "Meta-ExternalAgent",// Meta AI
];

export default function robots(): MetadataRoute.Robots {
  const base = baseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: SHARED_DISALLOW,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: SHARED_DISALLOW,
      })),
    ],
    sitemap: `${base}/sitemap.xml`,
    host: "dunamisstudios.net",
  };
}
