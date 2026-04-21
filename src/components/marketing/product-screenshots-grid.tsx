"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { ProductScreenshot } from "./product-page-shell";

interface Props {
  items: ProductScreenshot[];
}

// Fade duration in ms. Exit animation runs the same length before the
// dialog unmounts, so keep these in lockstep.
const FADE_MS = 200;

/**
 * Clickable screenshot grid with an inline lightbox.
 *
 * Behavior:
 *  - Thumbnails render as real <button>s so keyboard users can activate
 *    with Enter/Space and get a focus ring.
 *  - Clicking a thumbnail opens a full-viewport dialog with the image at
 *    max 90vw x 90vh. Click the backdrop, press Escape, or click the
 *    close button (top-right) to dismiss.
 *  - Click on the image itself is swallowed so users can't accidentally
 *    close the lightbox while inspecting detail.
 *  - Focus moves to the close button on open and returns to the
 *    originating thumbnail on close. Tab is trapped to the close button
 *    while the dialog is open.
 *  - Body scroll is locked while the dialog is open.
 *
 * Scoped to the "A look inside" section on the Property Pulse product
 * page. Not a generic lightbox -- if another surface needs this
 * treatment, lift to a shared primitive rather than extending this
 * component's scope.
 */
export function ProductScreenshotsGrid({ items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastOpenedRef = useRef<number | null>(null);

  const openAt = (i: number) => {
    lastOpenedRef.current = i;
    setOpenIndex(i);
    // Next frame so the mount → opacity-100 transition actually runs.
    requestAnimationFrame(() => setIsVisible(true));
  };

  const close = () => {
    setIsVisible(false);
    window.setTimeout(() => {
      setOpenIndex(null);
      if (lastOpenedRef.current !== null) {
        triggerRefs.current[lastOpenedRef.current]?.focus();
        lastOpenedRef.current = null;
      }
    }, FADE_MS);
  };

  // While open: lock body scroll, trap focus, listen for Escape.
  useEffect(() => {
    if (openIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "Tab") {
        // Close button is the only focusable element inside the dialog;
        // pin focus there so Tab never escapes the modal.
        e.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex]);

  // Move focus to the close button once the dialog is mounted + visible.
  useEffect(() => {
    if (openIndex !== null && isVisible) {
      closeButtonRef.current?.focus();
    }
  }, [openIndex, isVisible]);

  const activeItem = openIndex !== null ? items[openIndex] : null;

  return (
    <>
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
        {items.map((shot, i) => (
          <figure key={i} className="flex flex-col gap-4">
            <button
              ref={(el) => {
                triggerRefs.current[i] = el;
              }}
              type="button"
              onClick={() => openAt(i)}
              aria-label={`Expand screenshot: ${shot.alt}`}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-left shadow-sm transition-all hover:border-[var(--border-strong)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-pulse-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            >
              <Image
                src={shot.src}
                alt={shot.alt}
                width={shot.width}
                height={shot.height}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="h-auto w-full rounded-xl transition-transform group-hover:scale-[1.01]"
              />
            </button>
            <figcaption>
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                {shot.captionEyebrow}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--fg-muted)]">
                {shot.caption}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>

      {activeItem ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.alt}
          onClick={close}
          style={{ transitionDuration: `${FADE_MS}ms` }}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-2 shadow-2xl"
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]/90 text-[var(--fg)] backdrop-blur transition-colors hover:bg-[var(--bg-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-pulse-500)]"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
            <Image
              src={activeItem.src}
              alt={activeItem.alt}
              width={activeItem.width}
              height={activeItem.height}
              sizes="90vw"
              className="h-auto max-h-[calc(90vh-1rem)] w-auto max-w-[calc(90vw-1rem)] rounded-lg"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
