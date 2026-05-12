"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PowerOff } from "lucide-react";

import { ConfirmationModal } from "@/components/admin/confirmation-modal";

/**
 * Per-row deactivate button for the Activations table. Single action,
 * so this renders a direct button rather than a kebab dropdown.
 * Disabled when the activation is already deactivated.
 */

export interface ActivationRowActionsProps {
  accountId: string;
  activationId: string;
  deviceLabel: string;
  status: string;
}

export function ActivationRowActions(props: ActivationRowActionsProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const disabled = props.status === "deactivated";

  return (
    <>
      <button
        type="button"
        aria-label={`Deactivate ${props.deviceLabel}`}
        title={
          disabled ? "Already deactivated" : `Deactivate ${props.deviceLabel}`
        }
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="inline-flex h-7 items-center gap-1.5 rounded px-2 text-xs text-[var(--color-danger-700,#991b1b)] hover:bg-[color-mix(in_oklch,var(--color-danger-500,#ef4444)_12%,transparent)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-[#fca5a5]"
      >
        <PowerOff className="h-3 w-3" aria-hidden />
        Deactivate
      </button>

      <ConfirmationModal
        open={open}
        onOpenChange={setOpen}
        variant="typed"
        title="Deactivate device"
        description={
          <>
            Frees this activation slot so the customer can reactivate on
            a different device. The Atelier app on the affected device
            will lock on its next activate/heartbeat call.
          </>
        }
        typedConfirmationTarget={props.deviceLabel}
        typedConfirmationLabel="Type the device name to confirm"
        confirmLabel="Deactivate"
        onConfirm={async ({ reason }) => {
          const res = await fetch(
            `/api/admin/customers/${props.accountId}/activations/${props.activationId}/deactivate`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ reason }),
            },
          );
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(body.error ?? `HTTP ${res.status}`);
          }
          setOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
