"use client";

import * as React from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Client-side rating widget. Both the up/down rating POST and the
 * optional free-text feedback POST are wired to real endpoints.
 *
 * State machine:
 *   idle          → default; user hasn't clicked yet (or previous POST errored)
 *   down-form     → thumbs-down recorded; textarea visible for optional feedback
 *   submitted     → "thanks" state; persists across reload via localStorage
 *
 * `busy` tracks an in-flight POST regardless of state so repeat
 * clicks don't flood the endpoints.
 *
 * localStorage key `dunamis:kb:rated:{category}:{slug}` stores "1"
 * after a successful rating. Source of truth for dedup is the
 * server's IP-hash Redis set; localStorage just keeps the UI from
 * asking a returning rater the same question twice.
 */
type State = "idle" | "down-form" | "submitted";

const STORAGE_PREFIX = "dunamis:kb:rated:";
const FEEDBACK_MAX = 500;

function storageKey(category: string, slug: string): string {
  return `${STORAGE_PREFIX}${category}:${slug}`;
}

export function ArticleRating({
  slug,
  category,
}: {
  slug: string;
  category: string;
}) {
  const [state, setState] = React.useState<State>("idle");
  const [busy, setBusy] = React.useState(false);
  const [text, setText] = React.useState("");
  const [errMsg, setErrMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      if (localStorage.getItem(storageKey(category, slug)) === "1") {
        setState("submitted");
      }
    } catch {
      // Privacy mode or blocked storage. Treat as not rated.
    }
  }, [category, slug]);

  async function onVote(direction: "up" | "down") {
    setErrMsg(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/kb/${encodeURIComponent(slug)}/rate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ direction, category }),
      });
      if (!res.ok) {
        setErrMsg(await extractErrorMessage(res, "Something went wrong. Try again."));
        return;
      }
      try {
        localStorage.setItem(storageKey(category, slug), "1");
      } catch {
        // Storage unavailable. Server dedup still protects us.
      }
      setState(direction === "down" ? "down-form" : "submitted");
    } catch {
      setErrMsg("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitFeedback(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      // Feedback textarea is optional. Empty submit just acknowledges
      // and moves on; the thumbs-down rating was already captured by
      // onVote("down") before this form appeared.
      setState("submitted");
      return;
    }
    setErrMsg(null);
    setBusy(true);
    try {
      const res = await fetch(
        `/api/kb/${encodeURIComponent(slug)}/feedback`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ direction: "down", body: trimmed, category }),
        },
      );
      if (!res.ok) {
        setErrMsg(
          await extractErrorMessage(res, "Couldn't send feedback. Try again."),
        );
        return;
      }
      setState("submitted");
    } catch {
      setErrMsg("Network error. Feedback not sent. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "submitted") {
    return (
      <div
        role="status"
        className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-5 py-4 text-sm text-[var(--fg-muted)]"
      >
        Thanks for the feedback. We read every note.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--fg)]">
          Was this article helpful?
        </p>
        <div className="flex items-center gap-2">
          <RatingButton
            label="Yes"
            disabled={busy}
            onClick={() => onVote("up")}
          >
            <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
            Yes
          </RatingButton>
          <RatingButton
            label="No"
            disabled={busy}
            onClick={() => onVote("down")}
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

      {state === "down-form" ? (
        <form onSubmit={onSubmitFeedback} className="mt-4 space-y-2">
          <label
            htmlFor="kb-feedback"
            className="block text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]"
          >
            What was missing or wrong?
          </label>
          <textarea
            id="kb-feedback"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, FEEDBACK_MAX))}
            maxLength={FEEDBACK_MAX}
            rows={3}
            className="block w-full rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--fg)] outline-none placeholder:text-[var(--fg-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            placeholder="Optional. What would make this article more useful?"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-[var(--fg-subtle)]">
              {text.length}/{FEEDBACK_MAX}
            </span>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-fg)] shadow-sm transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-60"
            >
              Send feedback
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function RatingButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-sm text-[var(--fg-muted)] transition-colors",
        "hover:border-[var(--border-strong)] hover:text-[var(--fg)]",
        "disabled:opacity-60 disabled:pointer-events-none",
      )}
    >
      {children}
    </button>
  );
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    if (body?.error?.message) return body.error.message;
  } catch {
    // Non-JSON error body; fall through.
  }
  return fallback;
}
