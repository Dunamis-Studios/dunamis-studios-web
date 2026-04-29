import { listPosts } from "@/lib/content";
import {
  KB_PRODUCTS,
  KB_PRODUCT_LABEL,
  getCategoriesForProduct,
  type KbCategory,
} from "@/lib/kb";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://www.dunamisstudios.net";

/**
 * llms.txt is the AI-crawler equivalent of robots.txt + sitemap. It
 * gives ChatGPT, Perplexity, Claude, and Google AI Overviews a
 * curated index of what is on the site, what matters most, and where
 * to find each surface, in a format optimized for token-budget-aware
 * fetchers. Convention: https://llmstxt.org.
 */
export const dynamic = "force-dynamic";
export const revalidate = 3600;

function escapeMarkdownTitle(title: string): string {
  // Strip square brackets that would break the [title](url) link
  // syntax. Other punctuation is fine to render verbatim.
  return title.replace(/[\[\]]/g, "");
}

function prettifyCategorySlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function categoryLine(c: KbCategory): string {
  const name = `${KB_PRODUCT_LABEL[c.product]}: ${prettifyCategorySlug(c.slug)}`;
  const url = `${SITE_URL}/help/${c.slug}`;
  const count = c.articles.length;
  const description = `${count} ${count === 1 ? "article" : "articles"} in this category.`;
  return `- [${name}](${url}): ${description}`;
}

export async function GET(): Promise<Response> {
  const [articles, guides, categoriesByProduct] = await Promise.all([
    listPosts("article", { includeDrafts: false }),
    listPosts("guide", { includeDrafts: false }),
    Promise.all(
      KB_PRODUCTS.map(async (p) => [p, await getCategoriesForProduct(p)] as const),
    ),
  ]);

  const lines: string[] = [];

  lines.push("# Dunamis Studios");
  lines.push("");
  lines.push(
    "> Precision tools for HubSpot. We build focused, single-purpose marketplace apps for HubSpot administrators and RevOps teams. Each app solves one real problem deeply rather than serving as part of an all-in-one suite.",
  );
  lines.push("");

  lines.push("## Products");
  lines.push("");
  lines.push(
    `- [Property Pulse](${SITE_URL}/products/property-pulse): A HubSpot marketplace app that surfaces property change history directly on every CRM record. Admins choose which properties to track per object type, and users see the full change log, prior values, current values, and source in a single CRM card with inline editing and filtering.`,
  );
  lines.push(
    `- [Debrief](${SITE_URL}/products/debrief): A HubSpot marketplace app that generates structured handoff briefs and conversational handoff messages whenever ownership of a CRM record changes. Reads the record's history, properties, and engagement to produce a brief for the new owner and a personalized message they can send to the contact.`,
  );
  lines.push("");

  if (articles.length > 0) {
    lines.push("## Articles");
    lines.push("");
    for (const a of articles) {
      const title = escapeMarkdownTitle(a.title);
      const desc = a.description.trim();
      const suffix = desc.endsWith(".") ? "" : ".";
      lines.push(
        `- [${title}](${SITE_URL}/articles/${a.slug}): ${desc}${suffix}`,
      );
    }
    lines.push("");
  }

  if (guides.length > 0) {
    lines.push("## Guides");
    lines.push("");
    for (const g of guides) {
      const title = escapeMarkdownTitle(g.title);
      const desc = g.description.trim();
      const suffix = desc.endsWith(".") ? "" : ".";
      lines.push(
        `- [${title}](${SITE_URL}/guides/${g.slug}): ${desc}${suffix}`,
      );
    }
    lines.push("");
  }

  lines.push("## Help center");
  lines.push("");
  lines.push(
    `- [Help center home](${SITE_URL}/help): Documentation, setup guides, and troubleshooting for Dunamis Studios products.`,
  );
  for (const [, categories] of categoriesByProduct) {
    for (const c of categories) {
      lines.push(categoryLine(c));
    }
  }
  lines.push("");

  lines.push("## About");
  lines.push("");
  lines.push(
    `- [Custom development](${SITE_URL}/custom-development): Direct engagement options for custom HubSpot work that the marketplace apps don't cover.`,
  );
  lines.push(
    `- [Pricing](${SITE_URL}/pricing): Pricing for Property Pulse, Debrief, and other products.`,
  );
  lines.push("");

  lines.push("## Optional");
  lines.push("");
  lines.push(`- [Terms](${SITE_URL}/terms)`);
  lines.push(`- [Privacy](${SITE_URL}/privacy)`);
  lines.push(`- [Subprocessors](${SITE_URL}/legal/subprocessors)`);
  lines.push(`- [DPA](${SITE_URL}/legal/dpa)`);
  lines.push("");

  const body = lines.join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
