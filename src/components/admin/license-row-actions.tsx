"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Mail, Ban, ReceiptText } from "lucide-react";

import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "@/components/ui/dropdown";
import { ConfirmationModal } from "@/components/admin/confirmation-modal";

/**
 * Kebab menu for the per-license rows in the Licenses table. Hosts:
 *   - Resend license email (simple confirm)
 *   - Mark refunded (typed confirm, destructive)
 *   - Revoke (typed confirm, destructive, with reason and grace mode)
 *
 * Revoke always submits revocation_mode "grace_14d" for now; the
 * mode-picker UI lands in a follow-up. Reason is required.
 */

type ModalKind = null | "resend" | "refund" | "revoke";

export interface LicenseRowActionsProps {
  accountId: string;
  lid: string;
  status: string;
  product: string;
}

export function LicenseRowActions(props: LicenseRowActionsProps) {
  const [open, setOpen] = React.useState<ModalKind>(null);
  const router = useRouter();

  function onSuccess() {
    setOpen(null);
    router.refresh();
  }

  const isRetired =
    props.status === "refunded" || props.status === "revoked";

  return (
    <>
      <Dropdown>
        <DropdownTrigger asChild>
          <button
            type="button"
            aria-label={`License ${props.lid} actions`}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--fg-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </button>
        </DropdownTrigger>
        <DropdownContent align="end">
          <DropdownItem onSelect={() => setOpen("resend")}>
            <Mail className="h-4 w-4" />
            Resend license email
          </DropdownItem>
          <DropdownItem
            onSelect={() => setOpen("refund")}
            disabled={isRetired}
            className="text-[var(--color-danger-700,#991b1b)] data-[highlighted]:bg-[color-mix(in_oklch,var(--color-danger-500,#ef4444)_12%,transparent)] dark:text-[#fca5a5]"
          >
            <ReceiptText className="h-4 w-4" />
            Mark refunded
          </DropdownItem>
          <DropdownItem
            onSelect={() => setOpen("revoke")}
            disabled={props.status === "revoked"}
            className="text-[var(--color-danger-700,#991b1b)] data-[highlighted]:bg-[color-mix(in_oklch,var(--color-danger-500,#ef4444)_12%,transparent)] dark:text-[#fca5a5]"
          >
            <Ban className="h-4 w-4" />
            Revoke license
          </DropdownItem>
        </DropdownContent>
      </Dropdown>

      <ConfirmationModal
        open={open === "resend"}
        onOpenChange={(v) => setOpen(v ? "resend" : null)}
        variant="simple"
        title="Resend license email"
        description={
          <>
            Sends the post-purchase {props.product} license email to the
            account&apos;s current email address. Marked as a resend in
            the email body.
          </>
        }
        confirmLabel="Send email"
        onConfirm={async () => {
          const res = await fetch(
            `/api/admin/customers/${props.accountId}/licenses/${props.lid}/resend-email`,
            { method: "POST" },
          );
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(body.error ?? `HTTP ${res.status}`);
          }
          onSuccess();
        }}
      />

      <ConfirmationModal
        open={open === "refund"}
        onOpenChange={(v) => setOpen(v ? "refund" : null)}
        variant="typed"
        title="Mark license refunded"
        description={
          <>
            Flips this license to <span className="font-mono">refunded</span>{" "}
            status. Distinct from revoke: the customer keeps any prior
            activations active until they expire on their own. The
            Stripe refund itself must be processed separately in the
            Stripe dashboard.
          </>
        }
        typedConfirmationTarget={props.lid}
        typedConfirmationLabel="Type the license id to confirm"
        requireReason={false}
        confirmLabel="Mark refunded"
        onConfirm={async () => {
          const res = await fetch(
            `/api/admin/customers/${props.accountId}/licenses/${props.lid}/refund`,
            { method: "POST" },
          );
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(body.error ?? `HTTP ${res.status}`);
          }
          onSuccess();
        }}
      />

      <ConfirmationModal
        open={open === "revoke"}
        onOpenChange={(v) => setOpen(v ? "revoke" : null)}
        variant="typed"
        title="Revoke license"
        description={
          <>
            Locks the license. Default mode is{" "}
            <span className="font-mono">grace_14d</span>: activations
            keep working for 14 days before client-side lockdown.
          </>
        }
        typedConfirmationTarget={props.lid}
        typedConfirmationLabel="Type the license id to confirm"
        confirmLabel="Revoke license"
        onConfirm={async ({ reason }) => {
          const res = await fetch(
            `/api/admin/customers/${props.accountId}/licenses/${props.lid}/revoke`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ reason, revocation_mode: "grace_14d" }),
            },
          );
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(body.error ?? `HTTP ${res.status}`);
          }
          onSuccess();
        }}
      />
    </>
  );
}
