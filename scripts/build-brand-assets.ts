/**
 * build-brand-assets.ts
 *
 * Rasterizes every SVG in brand/ to PNGs at the canonical sizes
 * (16, 32, 64, 128, 256, 512, 1024). Outputs go to brand/png/, matching
 * the prompt naming convention: {filename-stem}-{size}.png.
 *
 * Uses @resvg/resvg-js instead of sharp because resvg accepts explicit
 * font buffers (fontFiles), which guarantees "Dunamis Studios"
 * renders in Fraunces on any build machine regardless of system font
 * availability. sharp / libvips / cairo would fall back to the nearest
 * system serif on machines without Fraunces installed, producing
 * committed PNGs that look different per build host.
 *
 * Usage:
 *   npm run brand:build
 */

import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const ROOT = join(process.cwd(), "brand");
const PNG_OUT = join(ROOT, "png");
const SIZES = [16, 32, 64, 128, 256, 512, 1024];

mkdirSync(PNG_OUT, { recursive: true });

// Load every Fraunces font variant @fontsource/fraunces ships. resvg
// handles woff2 decoding internally, so we can pass the compressed
// files directly without a prior conversion step.
const fontDir = join(
  process.cwd(),
  "node_modules",
  "@fontsource",
  "fraunces",
  "files",
);
const FONT_WEIGHT = "500-normal"; // wordmark weight
const fontFiles: string[] = [];
try {
  const fonts = readdirSync(fontDir).filter(
    (f) => f.endsWith(".woff2") && f.includes(FONT_WEIGHT) && f.includes("latin"),
  );
  for (const f of fonts) {
    fontFiles.push(join(fontDir, f));
  }
  if (fontFiles.length === 0) {
    console.warn(
      `[brand:build] WARN: no matching Fraunces ${FONT_WEIGHT} woff2 found in ${fontDir}. Text in PNGs will fall back to Georgia / system serif.`,
    );
  } else {
    console.log(
      `[brand:build] loaded ${fontFiles.length} Fraunces font file(s)`,
    );
  }
} catch (err) {
  console.warn(
    `[brand:build] WARN: couldn't load Fraunces fonts from @fontsource/fraunces. Text will fall back to Georgia / system serif. (${
      err instanceof Error ? err.message : String(err)
    })`,
  );
}

// Resolve each SVG in brand/ (skip png/ and non-svg).
const svgFiles = readdirSync(ROOT).filter((f) => f.endsWith(".svg"));
if (svgFiles.length === 0) {
  console.error("[brand:build] no SVG files found in brand/");
  process.exit(1);
}

let written = 0;
for (const svgFile of svgFiles) {
  const svgPath = join(ROOT, svgFile);
  const svgSource = readFileSync(svgPath, "utf8");
  const stem = basename(svgFile, extname(svgFile));

  // Parse viewBox for aspect ratio so non-square sources (horizontal
  // wordmark / stacked lockup) rasterize at the right height given a
  // target width. resvg's fitTo API needs explicit width/height in the
  // SVG root to avoid silently defaulting; injecting them per-size is
  // the reliable path.
  const vbMatch = /viewBox\s*=\s*"([^"]+)"/.exec(svgSource);
  if (!vbMatch) {
    console.warn(`[brand:build] ${svgFile} has no viewBox — skipping`);
    continue;
  }
  // viewBox = "minX minY width height" — skip the two origin values.
  const [, , vbWidth, vbHeight] = vbMatch[1]
    .split(/\s+/)
    .map(Number);
  const aspect =
    vbHeight && vbWidth ? vbHeight / vbWidth : 1;

  for (const size of SIZES) {
    const width = size;
    const height = Math.max(1, Math.round(size * aspect));
    // Inject explicit width/height onto the root <svg> so resvg knows
    // the target pixel footprint.
    const sized = svgSource.replace(
      /<svg\b([^>]*)>/,
      `<svg$1 width="${width}" height="${height}">`,
    );

    const resvg = new Resvg(sized, {
      fitTo: { mode: "width", value: width },
      font: {
        fontFiles,
        loadSystemFonts: true,
        defaultFontFamily: "Georgia",
        serifFamily: "Georgia",
      },
      background: "rgba(0, 0, 0, 0)",
      shapeRendering: 2, // geometricPrecision
      textRendering: 2, // geometricPrecision — best at large sizes
    });
    const pngBuf = resvg.render().asPng();
    const outPath = join(PNG_OUT, `${stem}-${size}.png`);
    writeFileSync(outPath, pngBuf);
    written++;
  }
  console.log(`  ${svgFile} -> ${SIZES.length} PNGs (aspect ${aspect.toFixed(2)})`);
}

console.log(
  `\n[brand:build] wrote ${written} PNG(s) under brand/png/ (${svgFiles.length} SVG source(s), ${SIZES.length} size(s) each).`,
);
