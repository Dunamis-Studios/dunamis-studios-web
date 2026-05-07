import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { getCurrentSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";

// Server-rendered against the session cookie; the parent layout has
// already redirected unauthenticated visitors to /login. Force-dynamic
// to avoid Next prerendering and tripping DYNAMIC_SERVER_USAGE on the
// session lookup.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Atelier licenses",
  // Customer portal is account-gated; suppress search-engine indexing
  // alongside the rest of /account/*.
  robots: { index: false, follow: false },
};

/**
 * Customer portal for Atelier licenses — lists every Atelier license
 * tied to the signed-in account, with each license expanding to show
 * its three activation slots and per-slot deactivate buttons.
 *
 * This file ships as the placeholder shell for the Online Activation
 * Slice. Real data wiring lands in Part 2.6 (server-side fetch +
 * deactivate / rename endpoints). For the v1 scaffold we render the
 * page chrome and an empty-state that points the customer at the
 * in-app Settings → License panel as the canonical surface.
 */
export default async function AtelierLicensesPage() {
  const s = await getCurrentSession();
  if (!s) return null;

  return (
    <>
      <PageHeader
        eyebrow="Atelier"
        title="Your Atelier licenses"
        description="Every Atelier license tied to your account, with the three activation slots per license and the option to deactivate any device. Use this when you can't reach the device itself — a stolen laptop, a sold workstation, a machine that died."
      />

      <div className="mt-10">
        <EmptyState
          icon={<KeyRound className="h-5 w-5" />}
          title="License management ships with online activation."
          description="Atelier's online activation rolls out alongside the v1 release. Once your install is activated, your licenses and their three slots will appear here automatically — no setup required. In the meantime, the same surface is available inside Atelier itself at Settings → License."
        />
      </div>
    </>
  );
}
