import type { Post, ContentType } from "./content";

const BASE_URL = process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

/**
 * Strip HTML tags and count whitespace-delimited words. Used both
 * for `wordCount` in the Article schema and for the human-facing
 * reading-time estimate. Keeping a single text-extraction pass means
 * the two numbers stay aligned even if the HTML shape changes.
 */
function extractText(contentHtml: string): string {
  return contentHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function countWords(contentHtml: string): number {
  const text = extractText(contentHtml);
  return text ? text.split(/\s+/).length : 0;
}

export function buildArticleJsonLd(post: Post, type: ContentType) {
  const typePath = type === "guide" ? "guides" : "articles";
  const canonical = `${BASE_URL}/${typePath}/${post.slug}`;
  const ogImage = post.coverImageUrl || `${BASE_URL}/api/og/${type}/${post.slug}`;
  const wordCount = countWords(post.contentHtml);

  // isPartOf points at the corresponding index page so search engines
  // and answer engines can treat the surface as a Blog with consistent
  // membership. Both indexes already exist as routes.
  const isPartOf = {
    "@type": "Blog",
    "@id": `${BASE_URL}/${typePath}`,
  };

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: ogImage,
    datePublished: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined,
    dateModified: new Date(post.updatedAt).toISOString(),
    author: { "@type": "Organization", name: "Dunamis Studios" },
    publisher: {
      "@type": "Organization",
      name: "Dunamis Studios",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/opengraph-image`,
      },
    },
    // Richer mainEntityOfPage matches the KB Article schema shape and
    // Google's recommended form. Bare URL strings still validate but
    // the WebPage wrapper gives the schema a stable @id for cross-
    // reference from BreadcrumbList and similar.
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    inLanguage: "en",
    isPartOf,
    // Optional fields. Each is omitted (left undefined) when the
    // source data has nothing to contribute, so a stripped-down post
    // round-trips to the same minimal schema as before this change.
    keywords: post.targetKeyword || undefined,
    wordCount: wordCount > 0 ? wordCount : undefined,
  };
}

export function getOgImageUrl(post: Post, type: ContentType): string {
  if (post.coverImageUrl) return post.coverImageUrl;
  return `${BASE_URL}/api/og/${type}/${post.slug}`;
}

export function computeReadingTime(contentHtml: string): number {
  const wc = countWords(contentHtml);
  return Math.max(1, Math.ceil(wc / 225));
}
