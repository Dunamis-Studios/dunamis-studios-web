"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Upload } from "lucide-react";
import { SectionCard } from "./section-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const ACCEPT = "image/jpeg,image/png,image/svg+xml,image/webp";
const MAX_BYTES = 2 * 1024 * 1024;

interface Props {
  logoUrl: string | null;
}

/**
 * Logo upload + remove widget. Uses the dedicated /api/account/logo
 * endpoints (POST for upload/replace, DELETE for clear) instead of
 * piggybacking on the profile PATCH so the multipart upload flow
 * lives in one place. Future products that need to read the logo
 * URL just consume `account.logoUrl` from /api/auth/me — they don't
 * touch this widget.
 */
export function LogoSection({ logoUrl: initialLogoUrl }: Props) {
  const router = useRouter();
  const { push } = useToast();
  const [logoUrl, setLogoUrl] = React.useState(initialLogoUrl);
  const [busy, setBusy] = React.useState<"upload" | "delete" | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > MAX_BYTES) {
      push({
        kind: "error",
        title: "Logo too large",
        description: `Max size is ${Math.floor(MAX_BYTES / (1024 * 1024))} MB.`,
      });
      return;
    }
    setBusy("upload");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/account/logo", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        push({
          kind: "error",
          title: "Couldn't upload logo",
          description: data?.error?.message ?? "Try again.",
        });
        return;
      }
      setLogoUrl(data.logoUrl ?? null);
      push({ kind: "success", title: "Logo updated" });
      router.refresh();
    } catch {
      push({
        kind: "error",
        title: "Network error",
        description: "Try again.",
      });
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!logoUrl) return;
    setBusy("delete");
    try {
      const res = await fetch("/api/account/logo", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        push({
          kind: "error",
          title: "Couldn't remove logo",
          description: data?.error?.message ?? "Try again.",
        });
        return;
      }
      setLogoUrl(null);
      push({ kind: "success", title: "Logo removed" });
      router.refresh();
    } catch {
      push({
        kind: "error",
        title: "Network error",
        description: "Try again.",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <SectionCard
      title="Logo"
      description="Optional. Used in product chrome (Atelier dashboard, billing receipts) once integrated. JPEG, PNG, SVG, or WebP — max 2 MB."
    >
      <div className="flex items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg)]">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Account logo"
              width={80}
              height={80}
              unoptimized
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-xs text-[var(--fg-subtle)]">No logo</span>
          )}
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button
            type="button"
            onClick={() => fileRef.current?.click()}
            loading={busy === "upload"}
            disabled={busy !== null}
          >
            <Upload className="mr-1.5 h-4 w-4" aria-hidden />
            {logoUrl ? "Replace logo" : "Upload logo"}
          </Button>
          {logoUrl ? (
            <Button
              type="button"
              variant="secondary"
              onClick={handleDelete}
              loading={busy === "delete"}
              disabled={busy !== null}
            >
              <Trash2 className="mr-1.5 h-4 w-4" aria-hidden />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}
