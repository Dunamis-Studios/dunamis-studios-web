import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { ATELIER_DOCS_BASE_PATH, loadAtelierDocs } from "./atelier-docs";

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown> & { className?: string[] | string };
  children?: HastNode[];
};

/**
 * Custom rehype plugin: rewrite `[label](doc:slug)` cross-doc links.
 *
 * Atelier docs reference each other constantly. Hardcoding URL paths
 * everywhere is fragile — rename a doc and dozens of references break.
 * Instead, doc authors write
 *
 *     See the [install guide](doc:install) for details.
 *
 * and this plugin rewrites the href to the canonical
 * `/build-services/products/atelier/docs/install` path at render time.
 *
 * The plugin runs against the rehype tree (not remark) because by the
 * time we see it, links are HAST `<a>` elements with the `doc:slug`
 * href intact. We resolve against the loaded docs index so a typo
 * surfaces as an unresolved link rather than a stale URL: if no
 * matching slug is found, the href is rewritten to
 * `/build-services/products/atelier/docs/{slug}` anyway and the doc
 * link will hit the same 404 a hand-written URL would have hit. That
 * keeps the failure mode visible without crashing the build.
 *
 * Optional behavior: if the link's visible text is exactly equal to
 * the slug (i.e. the author wrote `[install](doc:install)` because
 * they didn't want to think up a label), the plugin replaces the
 * text with the doc's frontmatter `title`. Authors who want a
 * different label keep the explicit text. This sidesteps the
 * "what label do I use?" friction the spec's `<DocLink slug="..." />`
 * component was designed to solve.
 */
function rehypeDocLinks(slugToTitle: Map<string, string>) {
  function visit(node: HastNode) {
    if (!node.children) return;
    if (node.tagName === "a" && node.properties) {
      const href = node.properties.href;
      if (typeof href === "string" && href.startsWith("doc:")) {
        const slug = href.slice("doc:".length);
        node.properties.href = `${ATELIER_DOCS_BASE_PATH}/${slug}`;
        // If the visible text equals the slug, swap in the doc title.
        if (slugToTitle.has(slug) && node.children.length === 1) {
          const child = node.children[0];
          if (
            child.type === "text" &&
            typeof child.value === "string" &&
            child.value === slug
          ) {
            child.value = slugToTitle.get(slug)!;
          }
        }
      }
    }
    for (const child of node.children) visit(child);
  }
  return (tree: HastNode) => visit(tree);
}

/**
 * GFM task-list label fix — same plugin used in src/lib/kb-render.ts.
 * Lifted here so atelier-docs-render stays a self-contained module
 * rather than reaching into kb-render for an internal helper.
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
 * Render an Atelier docs markdown body to HTML. Mirrors the kb-render
 * pipeline (remark → rehype → stringify) and adds the doc:slug
 * resolver as a rehype pass.
 *
 * Caller responsibility: the returned HTML is rendered with
 * `dangerouslySetInnerHTML`. Every plugin in the chain produces safe
 * HTML (allowDangerousHtml: false strips raw <script> and friends),
 * so the output is safe to inject into the DOM.
 */
export async function renderAtelierDocMarkdown(md: string): Promise<string> {
  // Build the slug-to-title map up front so the rehype plugin can
  // swap raw-slug link text for human-readable titles in one pass.
  const docs = await loadAtelierDocs();
  const slugToTitle = new Map<string, string>(
    docs.map((d) => [d.slug, d.frontmatter.title]),
  );

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
    .use(rehypeDocLinks, slugToTitle)
    .use(rehypeStringify)
    .process(md);
  return String(file);
}
