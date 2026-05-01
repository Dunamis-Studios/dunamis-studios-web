/**
 * Static base64 PNG used as `blurDataURL` on cover images. A 4x3
 * neutral-gray pixel grid encoded inline so next/image can paint a
 * smooth blur while the real cover image streams in. Avoids the layout
 * shift and the blank rectangle that show during the LCP window on
 * image-heavy listing routes.
 *
 * Per next/image docs, `blurDataURL` accepts any data URI; using a
 * single shared placeholder lets us skip a per-image blur build
 * pipeline (cover images are stored on Vercel Blob, not in the repo).
 */
export const DEFAULT_IMAGE_BLUR =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAA1vQACAAAAGklEQVQI12NgYGD4z8DAwMDAwAAj/v//z8AAANgwBANaWHIaAAAAAElFTkSuQmCC";
