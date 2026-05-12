"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Confirmation modal for admin actions. Two variants:
 *
 *   - "simple":  title + description + Cancel / Confirm buttons.
 *     For non-destructive but non-trivial actions like "resend
 *     license email". Confirm is the primary brand color.
 *
 *   - "typed":   adds a typed-confirmation field (must match the
 *     supplied target, e.g. the customer's email) plus a required
 *     "Why are you taking this action?" reason text. Confirm
 *     stays disabled until the typed match is exact and (if
 *     reason is required) the reason is non-empty. Confirm is
 *     the danger color. For revokes, deletes, refund-flag,
 *     anything destructive.
 *
 * On submit:
 *   - Confirm button calls onConfirm({ reason? }) and awaits.
 *   - On success the modal closes and the caller is responsible
 *     for refreshing whatever data view the action mutated.
 *   - On failure the modal stays open with the thrown error's
 *     message rendered above the form; the buttons re-enable.
 */

interface BaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface SimpleProps extends BaseProps {
  variant: "simple";
  onConfirm: () => Promise<void>;
}

interface TypedProps extends BaseProps {
  variant: "typed";
  /** The exact string the admin must type to enable Confirm. */
  typedConfirmationTarget: string;
  /** Label for the typed-confirmation input (e.g., "Type the customer's email to confirm"). */
  typedConfirmationLabel: string;
  /** Whether the reason field is required. Defaults true for typed variant. */
  requireReason?: boolean;
  onConfirm: (params: { reason: string }) => Promise<void>;
}

export type ConfirmationModalProps = SimpleProps | TypedProps;

export function ConfirmationModal(props: ConfirmationModalProps) {
  const [typedValue, setTypedValue] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset transient state every time the modal opens.
  React.useEffect(() => {
    if (props.open) {
      setTypedValue("");
      setReason("");
      setSubmitting(false);
      setError(null);
    }
  }, [props.open]);

  const isTyped = props.variant === "typed";
  const typedMatches =
    !isTyped || typedValue.trim() === props.typedConfirmationTarget;
  const reasonOk =
    !isTyped ||
    !(props.requireReason ?? true) ||
    reason.trim().length > 0;
  const canConfirm = !submitting && typedMatches && reasonOk;

  async function handleConfirm() {
    if (!canConfirm) return;
    setSubmitting(true);
    setError(null);
    try {
      if (props.variant === "simple") {
        await props.onConfirm();
      } else {
        await props.onConfirm({ reason: reason.trim() });
      }
      props.onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Action failed. Try again?";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle
            className={isTyped ? "text-[var(--color-danger-700,#991b1b)] dark:text-[#fca5a5]" : undefined}
          >
            {props.title}
          </DialogTitle>
          <DialogDescription asChild>
            <div>{props.description}</div>
          </DialogDescription>
        </DialogHeader>

        {isTyped ? (
          <div className="space-y-3">
            <label className="block text-xs text-[var(--fg-muted)]">
              {props.typedConfirmationLabel}
              <input
                type="text"
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                disabled={submitting}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </label>
            {(props.requireReason ?? true) ? (
              <label className="block text-xs text-[var(--fg-muted)]">
                Why are you taking this action?
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  required
                  disabled={submitting}
                  placeholder="Briefly explain. Becomes part of the audit log entry."
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </label>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="rounded-md border border-[var(--color-danger-border,#fecaca)] bg-[var(--color-danger-bg,#fef2f2)] px-3 py-2 text-sm text-[var(--color-danger-fg,#991b1b)] dark:border-[#5b1f1f] dark:bg-[#2a1010] dark:text-[#fca5a5]"
          >
            {error}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={() => props.onOpenChange(false)}
          >
            {props.cancelLabel ?? "Cancel"}
          </Button>
          <Button
            type="button"
            variant={isTyped ? "danger" : "primary"}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {submitting
              ? "Working..."
              : (props.confirmLabel ?? "Confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
