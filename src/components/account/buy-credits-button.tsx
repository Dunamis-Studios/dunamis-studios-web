"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { BuyCreditsModal } from "./buy-credits-modal";
import type { Entitlement } from "@/lib/types";

export function BuyCreditsButton({
  entitlement,
  accountEmail,
  variant = "secondary",
}: {
  entitlement: Entitlement;
  accountEmail: string;
  variant?: "secondary" | "primary";
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        Buy credits
      </Button>
      <BuyCreditsModal
        open={open}
        onOpenChange={setOpen}
        entitlement={entitlement}
        accountEmail={accountEmail}
      />
    </>
  );
}
