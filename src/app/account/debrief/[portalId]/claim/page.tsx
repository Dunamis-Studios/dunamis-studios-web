import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/account/section-card";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from "@/lib/session";
import {
  getEntitlement,
  linkEntitlementToAccount,
  saveEntitlement,
} from "@/lib/accounts";
import { portalIdSchema } from "@/lib/validation";
import { verifyClaimState } from "@/lib/claim-state";

/**
 * /account/debrief/[portalId]/claim
 *
 * Authenticated-only confirmation UI for the install-handoff flow.
 * Unauthenticated visitors are bounced to /signup by the API route
 * at /api/entitlements/claim (the account layout would redirect
 * them to /login otherwise, so page-level auth-check here is
 * defensive).
 *
 * Query params:
 *   state — signed claim-state token from Debrief
 *   email — convenience echo of installerEmail (not trusted;
 *           verifyClaimState is the source of truth)
 *   error — set when the inline server action rejects a link attempt
 *           so the page can re-render with the right message
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Link your Debrief install",
  robots: { index: false, follow: false },
};

type ClaimSearchParams = {
  state?: string;
  email?: string;
  error?: string;
};

type PageProps = {
  params: Promise<{ portalId: string }>;
  searchParams: Promise<ClaimSearchParams>;
};

export default async function ClaimPage({ params, searchParams }: PageProps) {
  const { portalId: rawPortalId } = await params;
  const { state, error } = await searchParams;

  const portalIdParsed = portalIdSchema.safeParse(rawPortalId);
  if (!portalIdParsed.success) {
    return <ErrorCard title="Invalid portal id" message="This link is malformed." />;
  }
  const portalId = portalIdParsed.data;

  const session = await getCurrentSession();
  // Layout already guarantees this, but a defensive check here
  // protects against layout refactors that might loosen the redirect.
  if (!session) {
    redirect(`/login?redirect=${encodeURIComponent(`/account/debrief/${portalId}/claim?state=${state ?? ""}`)}`);
  }

  const payload = verifyClaimState(state);
  if (!payload) {
    return (
      <ErrorCard
        title="Link expired"
        message="This claim link has expired or is invalid. Claim links are valid for 15 minutes after you install Debrief."
        hint="To generate a fresh link, reinstall Debrief in HubSpot."
      />
    );
  }
  if (payload.portalId !== portalId) {
    return (
      <ErrorCard
        title="Portal mismatch"
        message="The claim link doesn't match this portal. This usually means the URL was edited."
        hint="Reinstall Debrief in HubSpot to generate a valid link."
      />
    );
  }

  const entitlement = await getEntitlement("debrief", portalId);
  if (!entitlement) {
    return (
      <ErrorCard
        title="No pending install found"
        message="We can't find an entitlement record for this portal. The install may have failed to write its stub record."
        hint="Try reinstalling Debrief in HubSpot. If this persists, contact josh@dunamisstudios.net with your portal id."
      />
    );
  }

  // Idempotent success: already linked to the current account.
  if (entitlement.accountId === session.account.accountId) {
    redirect(`/account/debrief/${encodeURIComponent(portalId)}`);
  }

  // Linked to a DIFFERENT account.
  if (
    entitlement.accountId &&
    entitlement.accountId !== session.account.accountId
  ) {
    return (
      <ErrorCard
        title="Already linked elsewhere"
        message={`This portal is already linked to another Dunamis account. Installed by ${entitlement.installerEmail}.`}
        hint="If you think this is wrong, contact josh@dunamisstudios.net with your portal id and installer email."
      />
    );
  }

  // Email mismatch — the HubSpot installer's email doesn't match
  // the authenticated Dunamis account email. Refuse to link; the
  // user should sign out and sign in with the correct account.
  const sessionEmailLower = session.account.email.toLowerCase();
  if (payload.installerEmail !== sessionEmailLower) {
    return (
      <EmailMismatchCard
        installerEmail={payload.installerEmail}
        sessionEmail={session.account.email}
      />
    );
  }

  // Server action executed when the user clicks "Link this portal".
  // Re-runs every verification (state, entitlement, email match,
  // link-idempotency) so a stale page that was loaded 14 minutes
  // ago can't bypass checks. On success, 303 redirect to the
  // detail page; on failure, 303 redirect back to this page with
  // an error query param.
  async function handleLink(formData: FormData): Promise<void> {
    "use server";
    const submittedState = String(formData.get("state") ?? "");
    const payloadForLink = verifyClaimState(submittedState);
    if (!payloadForLink) {
      redirect(
        `/account/debrief/${encodeURIComponent(portalId)}/claim?error=invalid_state`,
      );
    }
    if (payloadForLink.portalId !== portalId) {
      redirect(
        `/account/debrief/${encodeURIComponent(portalId)}/claim?error=portal_mismatch`,
      );
    }

    const freshSession = await getCurrentSession();
    if (!freshSession) {
      redirect(
        `/login?redirect=${encodeURIComponent(`/account/debrief/${portalId}/claim?state=${submittedState}`)}`,
      );
    }
    if (
      payloadForLink.installerEmail !==
      freshSession.account.email.toLowerCase()
    ) {
      redirect(
        `/account/debrief/${encodeURIComponent(portalId)}/claim?error=email_mismatch`,
      );
    }

    const ent = await getEntitlement("debrief", portalId);
    if (!ent) {
      redirect(
        `/account/debrief/${encodeURIComponent(portalId)}/claim?error=entitlement_missing`,
      );
    }
    if (
      ent.accountId &&
      ent.accountId !== freshSession.account.accountId
    ) {
      redirect(
        `/account/debrief/${encodeURIComponent(portalId)}/claim?error=already_claimed`,
      );
    }
    if (ent.accountId === freshSession.account.accountId) {
      redirect(`/account/debrief/${encodeURIComponent(portalId)}`);
    }

    ent.accountId = freshSession.account.accountId;
    try {
      await linkEntitlementToAccount(ent);
    } catch (err) {
      console.error("[claim/page] link failed", err);
      ent.accountId = null;
      await saveEntitlement(ent).catch(() => {});
      redirect(
        `/account/debrief/${encodeURIComponent(portalId)}/claim?error=link_failed`,
      );
    }

    redirect(`/account/debrief/${encodeURIComponent(portalId)}`);
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Link Debrief to your account"
        description="You installed Debrief in HubSpot. One click links this install to your Dunamis account so you can subscribe and manage credits here."
      >
        {error ? <InlineError code={error} /> : null}

        <dl className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              Portal ID
            </dt>
            <dd className="mt-1 font-mono text-[var(--fg)]">{portalId}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              Portal domain
            </dt>
            <dd className="mt-1 text-[var(--fg)]">
              {entitlement.portalDomain || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              Installer email
            </dt>
            <dd className="mt-1 text-[var(--fg)]">
              {entitlement.installerEmail}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              Linking to
            </dt>
            <dd className="mt-1 text-[var(--fg)]">{session.account.email}</dd>
          </div>
        </dl>

        <form action={handleLink} className="mt-6 flex items-center gap-3">
          <input type="hidden" name="state" value={state ?? ""} />
          <Button type="submit" variant="primary" size="md">
            <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden />
            Link this portal to my account
          </Button>
          <Link
            href="/account"
            className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            Cancel
          </Link>
        </form>

        <p className="mt-4 text-xs text-[var(--fg-subtle)]">
          After linking, you&apos;ll land on your portal page where you can
          choose a plan. No subscription is created until you explicitly
          subscribe.
        </p>
      </SectionCard>
    </div>
  );
}

/* ---------------------------- UI sub-components ---------------------------- */

function ErrorCard({
  title,
  message,
  hint,
}: {
  title: string;
  message: string;
  hint?: string;
}) {
  return (
    <SectionCard title={title} description={message}>
      {hint ? (
        <p className="text-sm text-[var(--fg-muted)]">{hint}</p>
      ) : null}
      <div className="mt-4 flex items-center gap-3">
        <Link
          href="https://ecosystem.hubspot.com/marketplace/apps"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          Open HubSpot Marketplace
        </Link>
        <Link
          href="/account"
          className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          Back to account
        </Link>
      </div>
    </SectionCard>
  );
}

function EmailMismatchCard({
  installerEmail,
  sessionEmail,
}: {
  installerEmail: string;
  sessionEmail: string;
}) {
  return (
    <SectionCard
      title="Account mismatch"
      description="The HubSpot installer doesn't match your current Dunamis account."
    >
      <div className="flex items-start gap-3 rounded-lg border border-[var(--color-warning)]/40 bg-[color-mix(in_oklch,var(--color-warning)_10%,transparent)] p-4 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]" aria-hidden />
        <div className="space-y-1">
          <p className="font-medium text-[var(--fg)]">
            Emails don&apos;t match
          </p>
          <p className="text-[var(--fg-muted)]">
            Debrief was installed by{" "}
            <span className="font-mono">{installerEmail}</span>, but
            you&apos;re signed in as{" "}
            <span className="font-mono">{sessionEmail}</span>.
          </p>
          <p className="text-[var(--fg-muted)]">
            Sign out and sign back in with{" "}
            <span className="font-mono">{installerEmail}</span>, or contact{" "}
            <a
              href="mailto:josh@dunamisstudios.net"
              className="text-[var(--accent)] hover:underline"
            >
              josh@dunamisstudios.net
            </a>{" "}
            if you need help reassigning the installer.
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Link
          href="/account"
          className="inline-flex items-center text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          Back to account
        </Link>
        <p className="text-xs text-[var(--fg-subtle)]">
          To switch accounts, sign out from the account menu and sign back
          in with {installerEmail}.
        </p>
      </div>
    </SectionCard>
  );
}

function InlineError({ code }: { code: string }) {
  const copy: Record<string, string> = {
    invalid_state:
      "The claim link is expired or invalid. Reinstall Debrief in HubSpot to generate a fresh link.",
    portal_mismatch:
      "The claim link doesn't match this portal. The URL may have been edited.",
    email_mismatch:
      "The HubSpot installer email doesn't match your Dunamis account. Sign out and sign in with the installer email.",
    entitlement_missing:
      "No pending install found. Try reinstalling Debrief in HubSpot.",
    already_claimed:
      "This portal was claimed by another account while you were on this page.",
    link_failed:
      "Linking failed unexpectedly. Try again in a moment. If it keeps happening, contact josh@dunamisstudios.net.",
  };
  const message = copy[code] ?? "Something went wrong. Please try again.";
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2 rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
