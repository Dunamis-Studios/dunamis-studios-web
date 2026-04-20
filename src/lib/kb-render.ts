import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

/**
 * Render markdown to HTML using the unified pipeline.
 *
 * Plugins, in order:
 *   remark-parse           → markdown AST
 *   remark-gfm             → tables, task lists, strikethrough, autolinks
 *   remark-rehype          → markdown AST → HTML AST
 *   rehype-slug            → id="…" on every heading (from text)
 *   rehype-autolink-headings → wrap headings with a "#" anchor link
 *   rehype-highlight       → syntax-highlight code fences (highlight.js)
 *   rehype-stringify       → HTML AST → string
 *
 * `allowDangerousHtml: false` — raw HTML inside markdown is stripped.
 * Content authors can't inject <script> or unsafe elements even if
 * someone commits a malicious article.
 */
export async function renderMarkdown(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: {
        className: "kb-anchor",
        ariaLabel: "Link to this heading",
      },
      content: {
        type: "element",
        tagName: "span",
        properties: { className: "kb-anchor-hash", ariaHidden: "true" },
        children: [{ type: "text", value: "#" }],
      },
    })
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeStringify)
    .process(md);
  return String(file);
}

/**
 * Truncate a markdown body to approximately the first `n` words while
 * preserving whitespace (so paragraph breaks survive). Used to build
 * the teaser served to signed-in-no-entitlement readers of
 * customer-gated articles.
 *
 * CRITICAL: the returned string is what gets passed to renderMarkdown
 * and written into the HTML response. Words beyond `n` never reach the
 * renderer, which is why view-source on a teaser response only
 * contains the excerpt — not the full body hidden behind CSS.
 *
 * Chopping mid-list or mid-code-block is acceptable; the CSS fade
 * gradient at the bottom of the teaser hides the rough edge, and
 * remark parses the truncated string without error.
 */
export function takeFirstWords(md: string, n: number): string {
  if (n <= 0) return "";
  const parts = md.trim().split(/(\s+)/);
  let wordCount = 0;
  let out = "";
  for (const part of parts) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      out += part;
      continue;
    }
    if (wordCount >= n) break;
    out += part;
    wordCount++;
  }
  return out.trimEnd();
}
