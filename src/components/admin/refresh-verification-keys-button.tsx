"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Refresh button for the admin Verification Keys section. Busts the
 * 5-minute Redis cache via POST, then refreshes the route segment so
 * the server-rendered page re-fetches the customer's tickets from
 * HubSpot. Stays on the same page; no full reload.
 */
export function RefreshVerificationKeysButton({
  accountId,
}: {
  accountId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await fetch(
        `/api/admin/customers/${encodeURIComponent(accountId)}/verification-keys/refresh`,
        { method: "POST" },
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      loading={loading}
      onClick={onClick}
    >
      <RefreshCcw className="h-3.5 w-3.5" aria-hidden /> Refresh
    </Button>
  );
}
