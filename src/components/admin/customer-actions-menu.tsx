"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Pencil,
  Download,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "@/components/ui/dropdown";
import { ConfirmationModal } from "@/components/admin/confirmation-modal";

/**
 * Account-level admin actions surfaced from the customer detail page
 * header. Each menu item opens its own modal which handles the fetch
 * call to the matching admin API route. On success the router refreshes
 * the page so the activity log and any affected data reflects the
 * change without a manual reload.
 */

type ModalKind =
  | null
  | "profile"
  | "delete"
  | "export"
  | "refresh-stripe";

export interface CustomerActionsMenuProps {
  accountId: string;
  accountEmail: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
}

export function CustomerActionsMenu(props: CustomerActionsMenuProps) {
  const [open, setOpen] = React.useState<ModalKind>(null);
  const router = useRouter();

  function closeAndRefresh() {
    setOpen(null);
    router.refresh();
  }

  return (
    <>
      <Dropdown>
        <DropdownTrigger asChild>
          <Button variant="secondary" size="sm">
            Actions
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownTrigger>
        <DropdownContent align="end">
          <DropdownItem onSelect={() => setOpen("profile")}>
            <Pencil className="h-4 w-4" />
            Edit profile
          </DropdownItem>
          <DropdownItem onSelect={() => setOpen("export")}>
            <Download className="h-4 w-4" />
            Download data export
          </DropdownItem>
          <DropdownItem onSelect={() => setOpen("refresh-stripe")}>
            <RefreshCw className="h-4 w-4" />
            Refresh from Stripe
          </DropdownItem>
          <DropdownItem
            onSelect={() => setOpen("delete")}
            className="text-[var(--color-danger-700,#991b1b)] data-[highlighted]:bg-[color-mix(in_oklch,var(--color-danger-500,#ef4444)_12%,transparent)] dark:text-[#fca5a5]"
          >
            <Trash2 className="h-4 w-4" />
            Delete account
          </DropdownItem>
        </DropdownContent>
      </Dropdown>

      <EditProfileModal
        open={open === "profile"}
        onOpenChange={(v) => setOpen(v ? "profile" : null)}
        accountId={props.accountId}
        initial={{
          firstName: props.firstName,
          lastName: props.lastName,
          companyName: props.companyName,
          email: props.accountEmail,
        }}
        onSuccess={closeAndRefresh}
      />

      <ConfirmationModal
        open={open === "export"}
        onOpenChange={(v) => setOpen(v ? "export" : null)}
        variant="simple"
        title="Download data export"
        description={
          <>
            Builds a JSON export of every Dunamis record keyed to{" "}
            <span className="font-mono">{props.accountEmail}</span> and
            downloads it. The customer is not notified.
          </>
        }
        confirmLabel="Download"
        onConfirm={async () => {
          const res = await fetch(
            `/api/admin/customers/${props.accountId}/data-export`,
            { method: "POST" },
          );
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(body.error ?? `HTTP ${res.status}`);
          }
          const body = (await res.json()) as {
            filename: string;
            export: unknown;
          };
          const blob = new Blob([JSON.stringify(body.export, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = body.filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          router.refresh();
        }}
      />

      <ConfirmationModal
        open={open === "refresh-stripe"}
        onOpenChange={(v) => setOpen(v ? "refresh-stripe" : null)}
        variant="simple"
        title="Refresh from Stripe"
        description={
          <>
            Pulls the current Stripe customer + subscription + payment
            intent state for every entitlement on this account. Read-
            only: no local records are modified. The result is written
            to the activity log so you can audit drift later.
          </>
        }
        confirmLabel="Refresh"
        onConfirm={async () => {
          const res = await fetch(
            `/api/admin/customers/${props.accountId}/refresh-stripe`,
            { method: "POST" },
          );
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(body.error ?? `HTTP ${res.status}`);
          }
          router.refresh();
        }}
      />

      <ConfirmationModal
        open={open === "delete"}
        onOpenChange={(v) => setOpen(v ? "delete" : null)}
        variant="typed"
        title="Delete account"
        description={
          <>
            Soft-deletes <span className="font-mono">{props.accountEmail}</span>,
            freeing the email index for re-use. The record stays
            recoverable for 30 days; related licenses, sessions, and
            entitlements are not purged in this step.
          </>
        }
        typedConfirmationTarget={props.accountEmail}
        typedConfirmationLabel="Type the customer's email to confirm"
        confirmLabel="Soft-delete account"
        onConfirm={async ({ reason }) => {
          const res = await fetch(
            `/api/admin/customers/${props.accountId}/delete`,
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
          router.refresh();
        }}
      />
    </>
  );
}

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  initial: {
    firstName: string;
    lastName: string;
    companyName: string | null;
    email: string;
  };
  onSuccess: () => void;
}

function EditProfileModal(props: EditProfileModalProps) {
  const [firstName, setFirstName] = React.useState(props.initial.firstName);
  const [lastName, setLastName] = React.useState(props.initial.lastName);
  const [companyName, setCompanyName] = React.useState(
    props.initial.companyName ?? "",
  );
  const [email, setEmail] = React.useState(props.initial.email);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (props.open) {
      setFirstName(props.initial.firstName);
      setLastName(props.initial.lastName);
      setCompanyName(props.initial.companyName ?? "");
      setEmail(props.initial.email);
      setSubmitting(false);
      setError(null);
    }
  }, [
    props.open,
    props.initial.firstName,
    props.initial.lastName,
    props.initial.companyName,
    props.initial.email,
  ]);

  const dirty =
    firstName !== props.initial.firstName ||
    lastName !== props.initial.lastName ||
    companyName !== (props.initial.companyName ?? "") ||
    email !== props.initial.email;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const patch: Record<string, unknown> = {};
      if (firstName !== props.initial.firstName) patch.firstName = firstName;
      if (lastName !== props.initial.lastName) patch.lastName = lastName;
      if (companyName !== (props.initial.companyName ?? "")) {
        patch.companyName = companyName.trim() === "" ? null : companyName;
      }
      if (email !== props.initial.email) patch.email = email;

      const res = await fetch(
        `/api/admin/customers/${props.accountId}/profile`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(patch),
        },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      props.onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
      setSubmitting(false);
    }
  }

  if (!props.open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
    >
      <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-xl">
        <h2
          id="edit-profile-title"
          className="font-[var(--font-display)] text-lg font-medium text-[var(--fg)]"
        >
          Edit profile
        </h2>
        <p className="mt-1 text-xs text-[var(--fg-muted)]">
          Changes apply immediately. Email rotation updates the email
          index so the customer can sign in with the new address right
          away.
        </p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <ProfileField
            label="First name"
            value={firstName}
            onChange={setFirstName}
            disabled={submitting}
          />
          <ProfileField
            label="Last name"
            value={lastName}
            onChange={setLastName}
            disabled={submitting}
          />
          <ProfileField
            label="Company"
            value={companyName}
            onChange={setCompanyName}
            disabled={submitting}
            placeholder="(none)"
          />
          <ProfileField
            label="Email"
            value={email}
            onChange={setEmail}
            disabled={submitting}
            type="email"
          />

          {error ? (
            <div
              role="alert"
              className="rounded-md border border-[var(--color-danger-border,#fecaca)] bg-[var(--color-danger-bg,#fef2f2)] px-3 py-2 text-sm text-[var(--color-danger-fg,#991b1b)] dark:border-[#5b1f1f] dark:bg-[#2a1010] dark:text-[#fca5a5]"
            >
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={submitting}
              onClick={() => props.onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!dirty || submitting}
            >
              {submitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block text-xs text-[var(--fg-muted)]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />
    </label>
  );
}
