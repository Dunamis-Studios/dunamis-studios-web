"use client";

import * as React from "react";
import { SectionCard } from "./section-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function DataExportSection() {
  const { push } = useToast();
  const [loading, setLoading] = React.useState(false);

  async function onDownload() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/data-export", { method: "GET" });
      if (!res.ok) {
        push({ kind: "error", title: "Couldn't generate export" });
        return;
      }
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(disposition);
      const filename = match?.[1] ?? "dunamis-data-export.json";

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      push({
        kind: "success",
        title: "Data export downloaded",
        description: filename,
      });
    } catch {
      push({ kind: "error", title: "Couldn't generate export" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      title="Download my data"
      description="Get a JSON file with every record Dunamis Studios stores keyed to your account."
    >
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--fg-muted)]">
          Includes your account profile, sessions, entitlements, Atelier
          licenses, activations, and EULA acceptances. Wedding data stored
          locally in Atelier is not part of this export because Dunamis
          Studios never receives it.
        </p>
        <Button onClick={onDownload} loading={loading}>
          Download JSON
        </Button>
      </div>
    </SectionCard>
  );
}
