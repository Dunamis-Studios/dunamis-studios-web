"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type State = "loading" | "success" | "error";

export function VerifyClient({ token }: { token: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [state, setState] = React.useState<State>("loading");
  const [message, setMessage] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (cancelled) return;
        if (res.ok) {
          setState("success");
          push({
            kind: "success",
            title: "Email verified",
            description: "Your address is confirmed.",
          });
          setTimeout(() => {
            router.push("/account");
            router.refresh();
          }, 1200);
        } else {
          const data = await res.json().catch(() => null);
          setState("error");
          setMessage(data?.error?.message ?? "This link is invalid or expired.");
        }
      } catch {
        if (!cancelled) {
          setState("error");
          setMessage("Network error, please try again.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, router, push]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-sm text-[var(--fg-muted)]">
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
        Confirming your email…
      </div>
    );
  }
  if (state === "success") {
    return (
      <div className="text-center text-sm text-[var(--fg-muted)]">
        Your email is verified. Redirecting you to your dashboard…
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div
        role="alert"
        className="rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]"
      >
        {message}
      </div>
      <Button asChild className="w-full" variant="secondary">
        <Link href="/account">Back to dashboard</Link>
      </Button>
    </div>
  );
}
