"use client";

import * as React from "react";
import { Copy, Check, RefreshCcw, Send, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError, FieldHint } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Verification key widget. Lives above the consent checkbox on the
 * support form and gates the submit button by handing a freshly-
 * derived key back to the parent form.
 *
 * Two modes, picked once at mount based on the `user` prop:
 *
 *   Mode A: authenticated customer with an active Atelier license.
 *     Renders a single Generate button. On click, POSTs to
 *     /api/support/verification-key/account, which returns the key
 *     inline. Customer copies / uses; no email round-trip.
 *
 *   Mode B: everyone else (logged-out, or logged-in without an
 *     active license, or HubSpot / Build Services customer).
 *     Renders an email input + Send Key to Email button. On click,
 *     POSTs to /api/support/verification-key/email which sends the
 *     key via Resend. The widget then shows a paste field; the
 *     customer pulls the key from their inbox and types or pastes
 *     it back. As soon as the paste field's value is the expected
 *     UUID shape we hand the (key, email) pair to the parent.
 *
 * Parent integration: the widget never owns the verification-key
 * field on the form itself. It calls `onKeyAvailable(key, email)`
 * whenever it has a stable (key, email) pair to publish; the parent
 * SupportForm reads those into its own state for the actual submit.
 */

const UUID_KEY_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface AccountKeyResponse {
  ok: true;
  key: string;
  email: string;
  generated_at: string;
  expires_at: string;
}

interface ErrorResponse {
  error?: { message?: string } | string;
}

export interface VerificationKeyUser {
  email: string;
  hasActiveProduct: boolean;
}

export interface VerificationKeyWidgetProps {
  /**
   * Pre-resolved viewer context from the server component hosting
   * the form. Pass `null` for "definitely not authenticated"; pass a
   * concrete object for "definitely authenticated, here's what to
   * render". Omit (or pass `undefined`) and the widget self-resolves
   * via /api/support/verification-key/whoami on mount, which is the
   * right call for surfaces that are statically rendered (the KB
   * article inline form is the load-bearing case).
   */
  user?: VerificationKeyUser | null;
  onKeyAvailable: (key: string, email: string) => void;
  onEmailChange?: (email: string) => void;
}

export function VerificationKeyWidget(props: VerificationKeyWidgetProps) {
  // `propUser` is the value passed in (could be a User, null, or
  // undefined). `resolved` is what we actually render against, after
  // optionally self-resolving via whoami when propUser is undefined.
  const propUser = props.user;
  const [resolved, setResolved] = React.useState<
    VerificationKeyUser | null | "loading"
  >(propUser === undefined ? "loading" : propUser);

  React.useEffect(() => {
    if (propUser !== undefined) {
      setResolved(propUser);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/support/verification-key/whoami", {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setResolved(null);
          return;
        }
        const body = (await res.json().catch(() => null)) as // claude-code:allow-swallowed-error
          | { user: VerificationKeyUser | null }
          | null;
        if (cancelled) return;
        if (body && body.user && typeof body.user.email === "string") {
          setResolved({
            email: body.user.email,
            hasActiveProduct: Boolean(body.user.hasActiveProduct),
          });
        } else {
          setResolved(null);
        }
      } catch {
        if (!cancelled) setResolved(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propUser]);

  if (resolved === "loading") {
    return (
      <WidgetWrapper>
        <p className="text-sm text-[var(--fg-subtle)]">
          Checking your account...
        </p>
      </WidgetWrapper>
    );
  }
  if (resolved?.hasActiveProduct) {
    return (
      <ModeAccount
        userEmail={resolved.email}
        onKeyAvailable={props.onKeyAvailable}
      />
    );
  }
  return (
    <ModeEmail
      onKeyAvailable={props.onKeyAvailable}
      onEmailChange={props.onEmailChange}
    />
  );
}

function WidgetWrapper({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-labelledby="vk-heading"
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-5"
    >
      <h3
        id="vk-heading"
        className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]"
      >
        Identity Verification
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------
// Mode A: authenticated customer with active product
// ---------------------------------------------------------------------

function ModeAccount({
  userEmail,
  onKeyAvailable,
}: {
  userEmail: string;
  onKeyAvailable: (key: string, email: string) => void;
}) {
  const [generated, setGenerated] = React.useState<{
    key: string;
    expiresAt: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/support/verification-key/account", {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as // claude-code:allow-swallowed-error
        | (AccountKeyResponse & ErrorResponse)
        | null;
      if (!res.ok || !body || !("key" in body) || typeof body.key !== "string") {
        const message = readError(body, "Could not generate a key. Try again.");
        setError(message);
        return;
      }
      setGenerated({ key: body.key, expiresAt: body.expires_at });
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyKey() {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.key);
      setCopied(true);
    } catch {
      // Clipboard API unavailable (insecure context, permission
      // denied). The key is selectable in the rendered block; the
      // customer can fall back to manual selection.
    }
  }

  function useKey() {
    if (!generated) return;
    onKeyAvailable(generated.key, userEmail);
  }

  return (
    <WidgetWrapper>
      {!generated ? (
        <>
          <p className="text-sm text-[var(--fg-muted)]">
            Click Generate to create a verification key for your
            support request. The key is valid for 30 minutes.
          </p>
          <div className="mt-4">
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={loading}
              onClick={generate}
            >
              <RefreshCcw className="h-3.5 w-3.5" aria-hidden /> Generate Key
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-[var(--fg-muted)]">
            Your verification key for{" "}
            <span className="font-mono text-[var(--fg)]">{userEmail}</span>:
          </p>
          <div className="mt-3 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm tracking-wide text-[var(--fg)] break-all">
            {generated.key}
          </div>
          <p className="mt-2 text-xs text-[var(--fg-subtle)]">
            Valid for 30 minutes from generation.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="primary" size="sm" onClick={useKey}>
              Use this key
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={copyKey}>
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden /> Copy
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={loading}
              onClick={generate}
            >
              <RefreshCcw className="h-3.5 w-3.5" aria-hidden /> Regenerate
            </Button>
          </div>
        </>
      )}
      {error ? (
        <p
          role="alert"
          className="mt-3 text-xs text-[var(--color-danger)]"
        >
          {error}
        </p>
      ) : null}
    </WidgetWrapper>
  );
}

// ---------------------------------------------------------------------
// Mode B: public / no-active-product path
// ---------------------------------------------------------------------

function ModeEmail({
  onKeyAvailable,
  onEmailChange,
}: {
  onKeyAvailable: (key: string, email: string) => void;
  onEmailChange?: (email: string) => void;
}) {
  const [enteredEmail, setEnteredEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pastedKey, setPastedKey] = React.useState("");
  const lastPublishedRef = React.useRef<string>("");

  function isValidEmail(v: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  async function sendKey(opts: { resend?: boolean } = {}) {
    const trimmed = enteredEmail.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/support/verification-key/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const body = (await res.json().catch(() => null)) as // claude-code:allow-swallowed-error
        | (ErrorResponse & { ok?: boolean })
        | null;
      if (!res.ok) {
        const message =
          res.status === 429
            ? "Too many requests. Wait a few minutes and try again."
            : readError(body, "Could not send the verification email. Try again.");
        setError(message);
        return;
      }
      setSent(true);
      if (opts.resend) {
        // Clear the prior paste so a fresh send does not look like
        // it already verified.
        setPastedKey("");
        lastPublishedRef.current = "";
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function onPastedKeyChange(value: string) {
    const next = value.trim();
    setPastedKey(next);
    if (UUID_KEY_RE.test(next)) {
      const email = enteredEmail.trim().toLowerCase();
      const signature = `${email}|${next}`;
      if (signature !== lastPublishedRef.current) {
        lastPublishedRef.current = signature;
        onKeyAvailable(next, email);
      }
    }
  }

  return (
    <WidgetWrapper>
      {!sent ? (
        <>
          <p className="text-sm text-[var(--fg-muted)]">
            Enter your email and we&apos;ll send you a verification
            key. Paste the key here to submit your support request.
          </p>
          <div className="mt-4">
            <Label htmlFor="vk-email">Email</Label>
            <Input
              id="vk-email"
              type="email"
              autoComplete="email"
              disabled={loading}
              className="mt-1.5"
              value={enteredEmail}
              onChange={(e) => {
                setEnteredEmail(e.target.value);
                onEmailChange?.(e.target.value);
                if (emailError) setEmailError(null);
              }}
              error={emailError ?? undefined}
            />
            <FieldError>{emailError}</FieldError>
          </div>
          <div className="mt-3">
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={loading}
              onClick={() => sendKey()}
            >
              <Send className="h-3.5 w-3.5" aria-hidden /> Send Key to Email
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="flex items-start gap-2 text-sm text-[var(--fg-muted)]">
            <Mail
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
              aria-hidden
            />
            <span>
              Check your inbox at{" "}
              <span className="font-mono text-[var(--fg)]">
                {enteredEmail.trim().toLowerCase()}
              </span>
              . The key is valid for 30 minutes.
            </span>
          </p>
          <div className="mt-4">
            <Label htmlFor="vk-paste">Paste the key from your email</Label>
            <FieldHint>
              The key is a 36-character code. Pasting auto-applies; no
              extra button needed.
            </FieldHint>
            <Input
              id="vk-paste"
              type="text"
              autoComplete="off"
              spellCheck={false}
              className={cn(
                "mt-1.5 font-mono",
                UUID_KEY_RE.test(pastedKey)
                  ? "border-[var(--color-success-500,#10b981)]"
                  : undefined,
              )}
              value={pastedKey}
              onChange={(e) => onPastedKeyChange(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
            />
            {pastedKey && !UUID_KEY_RE.test(pastedKey) ? (
              <FieldError>
                That does not look like a verification key yet. Copy
                the full code from the email.
              </FieldError>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={loading}
              onClick={() => sendKey({ resend: true })}
            >
              <RefreshCcw className="h-3.5 w-3.5" aria-hidden /> Send again
            </Button>
          </div>
        </>
      )}
      {error ? (
        <p
          role="alert"
          className="mt-3 text-xs text-[var(--color-danger)]"
        >
          {error}
        </p>
      ) : null}
    </WidgetWrapper>
  );
}

function readError(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const e = (body as ErrorResponse).error;
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && typeof e.message === "string") {
    return e.message;
  }
  return fallback;
}
