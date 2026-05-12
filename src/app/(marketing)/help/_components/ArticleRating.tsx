"use client";

import * as React from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { SupportForm } from "@/components/help/support-form";
import type { SupportCategory } from "@/lib/validation";

/**
 * Article rating widget with bidirectional thumbs voting.
 *
 * State model:
 *   vote = "up" | "down" | null
 *
 * Transitions on click:
 *   click thumb already at  null  : vote becomes that direction
 *   click thumb already at "up"   : vote becomes null (toggle off)
 *   click thumb already at "down" : vote becomes null (toggle off)
 *   click the opposite thumb      : vote becomes the clicked direction
 *
 * Side effects per transition:
 *   becomes "up"   : show "Thanks for the feedback." card; hide the form.
 *   becomes "down" : show the inline SupportForm prefilled with article
 *                    context; smooth-scroll the form into view; hide
 *                    the thanks card.
 *   becomes null   : hide both surfaces; thumbs row remains.
 *
 * Persistence: the resulting vote is stored two places:
 *   1. Server: dunamis:kb:vote:{cat}:{slug} HSET keyed by hashed IP.
 *      Source of truth across sessions / devices on the same network.
 *   2. localStorage: dunamis:kb:vote:{cat}:{slug} stores "up"/"down".
 *      Lets a returning visitor on the SAME device see their vote
 *      reflected immediately on page load without waiting for a
 *      round trip. The server is authoritative; localStorage just
 *      primes the UI.
 */

const STORAGE_PREFIX = "dunamis:kb:vote:";

type VoteDirection = "up" | "down";
type Vote = VoteDirection | null;

function storageKey(category: string, slug: string): string {
  return `${STORAGE_PREFIX}${category}:${slug}`;
}

function readStoredVote(category: string, slug: string): Vote {
  try {
    const raw = localStorage.getItem(storageKey(category, slug));
    if (raw === "up" || raw === "down") return raw;
    return null;
  } catch {
    return null;
  }
}

function writeStoredVote(
  category: string,
  slug: string,
  vote: Vote,
): void {
  try {
    if (vote === null) {
      localStorage.removeItem(storageKey(category, slug));
    } else {
      localStorage.setItem(storageKey(category, slug), vote);
    }
  } catch {
    // Privacy mode or blocked storage; server is the source of truth
    // so the UI just won't pre-warm on the next visit.
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export interface ArticleRatingProps {
  slug: string;
  category: string;
  /**
   * Title of the article (from the markdown frontmatter). Used to
   * pre-fill the support form's Subject line on thumbs-down.
   */
  articleTitle: string;
  /**
   * Absolute path of the article (e.g. /help/billing/refunds). Used
   * to pre-fill the support form's "What happened?" placeholder so
   * the customer can describe what they were looking for relative
   * to the article they were on.
   */
  articleHref: string;
}

export function ArticleRating({
  slug,
  category,
  articleTitle,
  articleHref,
}: ArticleRatingProps) {
  const [vote, setVote] = React.useState<Vote>(null);
  const [busy, setBusy] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);
  const formWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const prevVoteRef = React.useRef<Vote>(null);

  // Hydrate from localStorage on mount. The server is the real
  // source of truth, but reading localStorage here is synchronous
  // and visually correct for a returning visitor on the same device.
  React.useEffect(() => {
    const stored = readStoredVote(category, slug);
    if (stored !== null) {
      setVote(stored);
      prevVoteRef.current = stored;
    }
  }, [category, slug]);

  // Smooth-scroll the form into view on the transition into "down".
  // Respect prefers-reduced-motion: snap-scroll for users who opted
  // out of motion. Small delay so the conditional rendering and
  // layout settle before scrolling.
  React.useEffect(() => {
    const prior = prevVoteRef.current;
    prevVoteRef.current = vote;
    if (vote !== "down" || prior === "down") return;
    const el = formWrapperRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      el.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    }, 100);
    return () => clearTimeout(t);
  }, [vote]);

  async function onClick(direction: VoteDirection) {
    if (busy) return;
    setErrMsg(null);
    setBusy(true);

    // Optimistic update: flip the UI immediately, then reconcile
    // with the server. If the server returns a different direction
    // (rare, only when the server's stored state diverged from
    // ours), the server wins.
    const optimistic: Vote = vote === direction ? null : direction;
    setVote(optimistic);
    writeStoredVote(category, slug, optimistic);

    try {
      const res = await fetch(`/api/kb/${encodeURIComponent(slug)}/rate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ direction, category }),
      });
      if (!res.ok) {
        // Roll back the optimistic flip.
        setVote(vote);
        writeStoredVote(category, slug, vote);
        setErrMsg(
          await extractErrorMessage(res, "Couldn't save your vote. Try again."),
        );
        return;
      }
      const body = (await res.json().catch(() => null)) as { // claude-code:allow-swallowed-error
        direction?: Vote;
      } | null;
      const serverVote: Vote =
        body && (body.direction === "up" || body.direction === "down")
          ? body.direction
          : null;
      if (serverVote !== optimistic) {
        setVote(serverVote);
        writeStoredVote(category, slug, serverVote);
      }
    } catch {
      setVote(vote);
      writeStoredVote(category, slug, vote);
      setErrMsg("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-[var(--fg)]">
            Was this article helpful?
          </p>
          <div className="flex items-center gap-2">
            <RatingButton
              label="Yes"
              active={vote === "up"}
              disabled={busy}
              onClick={() => onClick("up")}
            >
              <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
              Yes
            </RatingButton>
            <RatingButton
              label="No"
              active={vote === "down"}
              disabled={busy}
              onClick={() => onClick("down")}
            >
              <ThumbsDown className="h-3.5 w-3.5" aria-hidden />
              No
            </RatingButton>
          </div>
        </div>

        {errMsg ? (
          <p
            role="alert"
            className="mt-3 text-xs text-[var(--color-danger)]"
          >
            {errMsg}
          </p>
        ) : null}
      </div>

      {vote === "up" ? (
        <div
          role="status"
          className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-5 py-4 text-sm text-[var(--fg-muted)]"
        >
          Thanks for the feedback. We read every note.
        </div>
      ) : null}

      {vote === "down" ? (
        <div ref={formWrapperRef} className="mt-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <h3 className="font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
              Sorry this article didn&apos;t fully answer your question.
            </h3>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              Send us the details and a real person will follow up
              within 1 business day.
            </p>
            <div className="mt-6">
              <SupportForm
                initialValues={{
                  subject: `Feedback on: ${articleTitle}`,
                  category: "General Question" as SupportCategory,
                }}
                whatHappenedPlaceholder={`I was reading the article on https://www.dunamisstudios.net${articleHref} and...`}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RatingButton({
  label,
  onClick,
  active,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active ? true : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-[var(--accent)] bg-[color-mix(in_oklch,var(--accent)_12%,transparent)] text-[var(--accent)]"
          : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:border-[var(--border-strong)] hover:text-[var(--fg)]",
        "disabled:opacity-60 disabled:pointer-events-none",
      )}
    >
      {children}
    </button>
  );
}

async function extractErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await res.json()) as {
      error?: { message?: string };
    };
    if (body?.error?.message) return body.error.message;
  } catch {
    // Non-JSON error body; fall through.
  }
  return fallback;
}
