"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SectionCard } from "./section-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export function DangerZone() {
  const router = useRouter();
  const { push } = useToast();
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onDelete() {
    setLoading(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        push({
          kind: "success",
          title: "Account scheduled for deletion",
          description: "You have 30 days to sign in and recover it.",
        });
        router.push("/");
        router.refresh();
      } else {
        push({ kind: "error", title: "Couldn't delete account" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      danger
      title="Danger zone"
      description="Delete your account. We keep a recovery window for 30 days before permanent purge."
    >
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--fg-muted)]">
          Deleting your account signs you out everywhere and hides your
          profile. Entitlements remain tied to their HubSpot portals.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="danger">Delete account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>
                You can still sign in within 30 days to recover your account.
                After that, it is permanently purged.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label htmlFor="confirm">
                Type <span className="font-mono">DELETE</span> to confirm
              </Label>
              <Input
                id="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                variant="danger"
                disabled={confirm !== "DELETE"}
                loading={loading}
                onClick={onDelete}
              >
                Yes, delete my account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SectionCard>
  );
}
