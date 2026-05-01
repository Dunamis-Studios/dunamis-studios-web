import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown> & { className?: string[] | string };
  children?: HastNode[];
};

/**
 * Walk a hast tree and tag every <input type="checkbox"> inside a
 * <li class="task-list-item"> with an aria-label derived from the
 * surrounding li text. GFM task lists (`- [ ] item`) emit the input as
 * the first child of the li with the readable text following as a
 * sibling text node, which Lighthouse's `label` audit (and most screen
 * readers without sibling-aware heuristics) treat as unlabelled.
 */
function rehypeTaskListLabels() {
  function collectText(node: HastNode): string {
    if (node.type === "text") return node.value ?? "";
    if (!node.children) return "";
    return node.children.map(collectText).join("");
  }
  function hasClass(props: HastNode["properties"], cls: string): boolean {
    const c = props?.className;
    if (Array.isArray(c)) return c.includes(cls);
    if (typeof c === "string") return c.split(/\s+/).includes(cls);
    return false;
  }
  function visit(node: HastNode) {
    if (!node.children) return;
    if (node.tagName === "li" && hasClass(node.properties, "task-list-item")) {
      const text = node.children
        .filter((c) => !(c.tagName === "input"))
        .map(collectText)
        .join("")
        .trim();
      for (const child of node.children) {
        if (child.tagName !== "input") continue;
        const props = (child.properties ??= {});
        if (props.type !== "checkbox") continue;
        if (props["aria-label"] || props["ariaLabel"]) continue;
        props["ariaLabel"] = text || "Task list item";
      }
    }
    for (const child of node.children) visit(child);
  }
  return (tree: HastNode) => visit(tree);
}

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
    .use(rehypeTaskListLabels)
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
