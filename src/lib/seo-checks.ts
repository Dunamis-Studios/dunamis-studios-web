export type CheckStatus = "pass" | "warn" | "fail" | "skip";

export interface CheckResult {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
}

export interface SEOInput {
  title: string;
  slug: string;
  description: string;
  contentHtml: string;
  coverImageUrl: string;
  targetKeyword: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function wordCount(html: string): number {
  const text = stripHtml(html);
  if (!text) return 0;
  return text.split(/\s+/).length;
}

function containsKeyword(text: string, keyword: string): boolean {
  if (!keyword) return false;
  return text.toLowerCase().includes(keyword.toLowerCase());
}

export function runAllChecks(input: SEOInput): CheckResult[] {
  const { title, slug, description, contentHtml, coverImageUrl, targetKeyword } = input;
  const kw = targetKeyword.trim();
  const wc = wordCount(contentHtml);

  const checks: CheckResult[] = [];

  // --- Title checks ---
  const titleLen = title.length;
  checks.push({
    id: "title-length",
    label: "Title length",
    ...titleLen >= 30 && titleLen <= 60
      ? { status: "pass", message: `${titleLen} chars (ideal: 30–60)` }
      : titleLen >= 20 && titleLen <= 70
        ? { status: "warn", message: `${titleLen} chars (ideal: 30–60)` }
        : { status: "fail", message: `${titleLen} chars (ideal: 30–60)` },
  });

  checks.push({
    id: "title-keyword",
    label: "Title contains keyword",
    ...!kw
      ? { status: "skip", message: "No target keyword set" }
      : containsKeyword(title, kw)
        ? { status: "pass", message: `Contains "${kw}"` }
        : { status: "fail", message: `Missing "${kw}" in title` },
  });

  // --- Slug checks ---
  const slugLen = slug.length;
  checks.push({
    id: "slug-length",
    label: "Slug length",
    ...slugLen >= 3 && slugLen <= 60
      ? { status: "pass", message: `${slugLen} chars` }
      : { status: "warn", message: `${slugLen} chars (ideal: 3–60)` },
  });

  checks.push({
    id: "slug-keyword",
    label: "Slug contains keyword",
    ...!kw
      ? { status: "skip", message: "No target keyword set" }
      : containsKeyword(slug, kw)
        ? { status: "pass", message: `Contains "${kw}"` }
        : { status: "warn", message: `"${kw}" not in slug` },
  });

  checks.push({
    id: "slug-hyphens",
    label: "Slug uses hyphens",
    ...slug.includes("_")
      ? { status: "fail", message: "Contains underscores — use hyphens" }
      : { status: "pass", message: "Uses hyphens correctly" },
  });

  // --- Description checks ---
  const descLen = description.length;
  checks.push({
    id: "desc-length",
    label: "Meta description length",
    ...descLen >= 120 && descLen <= 160
      ? { status: "pass", message: `${descLen} chars (ideal: 120–160)` }
      : descLen >= 80 && descLen <= 200
        ? { status: "warn", message: `${descLen} chars (ideal: 120–160)` }
        : { status: "fail", message: `${descLen} chars (ideal: 120–160)` },
  });

  checks.push({
    id: "desc-keyword",
    label: "Description contains keyword",
    ...!kw
      ? { status: "skip", message: "No target keyword set" }
      : containsKeyword(description, kw)
        ? { status: "pass", message: `Contains "${kw}"` }
        : { status: "warn", message: `"${kw}" not in description` },
  });

  // --- Content checks ---
  checks.push({
    id: "word-count",
    label: "Word count",
    ...wc >= 300
      ? { status: "pass", message: `${wc} words` }
      : wc >= 150
        ? { status: "warn", message: `${wc} words (aim for 300+)` }
        : { status: "fail", message: `${wc} words (aim for 300+)` },
  });

  // H1 in body
  const h1Count = (contentHtml.match(/<h1[\s>]/gi) || []).length;
  checks.push({
    id: "no-h1-in-body",
    label: "No H1 in body content",
    ...h1Count === 0
      ? { status: "pass", message: "Page H1 is the post title" }
      : { status: "fail", message: `Found ${h1Count} H1 tag(s) in body — use H2+` },
  });

  // Heading hierarchy
  const headingMatches = [...contentHtml.matchAll(/<h([2-4])[\s>]/gi)];
  let hierarchyOk = true;
  let prevLevel = 1; // starts after H1 (the title)
  for (const m of headingMatches) {
    const level = parseInt(m[1], 10);
    if (level > prevLevel + 1) {
      hierarchyOk = false;
      break;
    }
    prevLevel = level;
  }
  checks.push({
    id: "heading-hierarchy",
    label: "Heading hierarchy",
    ...headingMatches.length === 0
      ? { status: "pass", message: "No subheadings (ok for short posts)" }
      : hierarchyOk
        ? { status: "pass", message: "Headings follow correct order" }
        : { status: "fail", message: "Heading level skipped (e.g. H2 → H4)" },
  });

  // Images have alt text
  const imgTags = [...contentHtml.matchAll(/<img\s[^>]*>/gi)];
  if (imgTags.length === 0) {
    checks.push({ id: "img-alt", label: "Images have alt text", status: "skip", message: "No images in content" });
  } else {
    const missingAlt = imgTags.filter((tag) => {
      const altMatch = tag[0].match(/alt=["']([^"']*)["']/i);
      return !altMatch || !altMatch[1].trim();
    });
    checks.push({
      id: "img-alt",
      label: "Images have alt text",
      ...missingAlt.length === 0
        ? { status: "pass", message: `All ${imgTags.length} image(s) have alt text` }
        : { status: "fail", message: `${missingAlt.length} of ${imgTags.length} image(s) missing alt` },
    });
  }

  // Internal links
  const internalLinks = (contentHtml.match(/href=["']\/(guides|articles)\//gi) || []).length;
  if (wc < 300) {
    checks.push({ id: "internal-links", label: "Internal links", status: "skip", message: "Content too short to evaluate" });
  } else {
    checks.push({
      id: "internal-links",
      label: "Internal links",
      ...internalLinks > 0
        ? { status: "pass", message: `${internalLinks} internal link(s)` }
        : { status: "warn", message: "No internal links — add links to other guides/articles" },
    });
  }

  // External links
  const externalLinks = (contentHtml.match(/href=["']https?:\/\//gi) || []).length - internalLinks;
  if (wc < 300) {
    checks.push({ id: "external-links", label: "External links", status: "skip", message: "Content too short to evaluate" });
  } else {
    checks.push({
      id: "external-links",
      label: "External links",
      ...externalLinks > 0
        ? { status: "pass", message: `${externalLinks} external link(s)` }
        : { status: "warn", message: "No external links" },
    });
  }

  // Keyword in first paragraph
  const firstPMatch = contentHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const firstPText = firstPMatch ? stripHtml(firstPMatch[1]) : "";
  checks.push({
    id: "keyword-first-para",
    label: "Keyword in first paragraph",
    ...!kw
      ? { status: "skip", message: "No target keyword set" }
      : containsKeyword(firstPText, kw)
        ? { status: "pass", message: `"${kw}" found in first paragraph` }
        : { status: "warn", message: `"${kw}" not in first paragraph` },
  });

  // Keyword density
  if (!kw) {
    checks.push({ id: "keyword-density", label: "Keyword density", status: "skip", message: "No target keyword set" });
  } else {
    const bodyText = stripHtml(contentHtml).toLowerCase();
    const kwLower = kw.toLowerCase();
    let count = 0;
    let idx = 0;
    while ((idx = bodyText.indexOf(kwLower, idx)) !== -1) {
      count++;
      idx += kwLower.length;
    }
    const density = wc > 0 ? (count / wc) * 100 : 0;
    checks.push({
      id: "keyword-density",
      label: "Keyword density",
      ...density > 3
        ? { status: "warn", message: `${density.toFixed(1)}% — possible keyword stuffing (>3%)` }
        : { status: "pass", message: `${density.toFixed(1)}%` },
    });
  }

  // --- Cover image ---
  checks.push({
    id: "cover-image",
    label: "Cover image set",
    ...coverImageUrl
      ? { status: "pass", message: "Cover image provided" }
      : { status: "warn", message: "No cover image — adds visual interest" },
  });

  return checks;
}

export function computeScore(checks: CheckResult[]): { score: number; total: number } {
  let score = 0;
  let total = 0;
  for (const c of checks) {
    if (c.status === "skip") continue;
    total++;
    if (c.status === "pass") score += 1;
    else if (c.status === "warn") score += 0.5;
  }
  return { score, total };
}

export function computeReadingTime(contentHtml: string): number {
  const wc = wordCount(contentHtml);
  return Math.max(1, Math.ceil(wc / 225));
}
