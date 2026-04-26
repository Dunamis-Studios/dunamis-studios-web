import type { Post, ContentType } from "./content";

const BASE_URL = process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

export function buildArticleJsonLd(post: Post, type: ContentType) {
  const typePath = type === "guide" ? "guides" : "articles";
  const canonical = `${BASE_URL}/${typePath}/${post.slug}`;
  const ogImage = post.coverImageUrl || `${BASE_URL}/api/og/${type}/${post.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: ogImage,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
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
    mainEntityOfPage: canonical,
  };
}

export function getOgImageUrl(post: Post, type: ContentType): string {
  if (post.coverImageUrl) return post.coverImageUrl;
  return `${BASE_URL}/api/og/${type}/${post.slug}`;
}

export function computeReadingTime(contentHtml: string): number {
  const text = contentHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const wc = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(wc / 225));
}
