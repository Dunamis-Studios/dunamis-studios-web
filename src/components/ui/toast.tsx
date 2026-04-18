"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface ToastMsg {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastCtx {
  push: (t: Omit<ToastMsg, "id">) => void;
}

const Ctx = React.createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMsg[]>([]);
  const nextId = React.useRef(1);

  const push = React.useCallback((t: Omit<ToastMsg, "id">) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { ...t, id }]);
  }, []);

  const remove = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icon: Record<ToastKind, React.ComponentType<{ className?: string }>> = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  };
  const color: Record<ToastKind, string> = {
    success: "text-[var(--color-success)]",
    error: "text-[var(--color-danger)]",
    info: "text-[var(--color-info)]",
  };

  return (
    <Ctx.Provider value={{ push }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}
        {toasts.map((t) => {
          const Icon = icon[t.kind];
          return (
            <ToastPrimitive.Root
              key={t.id}
              onOpenChange={(open) => !open && remove(t.id)}
              className={cn(
                "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4 pr-8 shadow-md",
                "data-[state=open]:animate-fade-up data-[state=closed]:animate-fade-in",
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", color[t.kind])} />
              <div className="flex-1 min-w-0">
                <ToastPrimitive.Title className="text-sm font-medium text-[var(--fg)]">
                  {t.title}
                </ToastPrimitive.Title>
                {t.description ? (
                  <ToastPrimitive.Description className="text-sm text-[var(--fg-muted)] mt-1">
                    {t.description}
                  </ToastPrimitive.Description>
                ) : null}
              </div>
              <ToastPrimitive.Close
                aria-label="Close"
                className="absolute right-2 top-2 rounded-md p-1 text-[var(--fg-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]"
              >
                <X className="h-4 w-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full max-w-[420px] flex-col gap-2 p-4 sm:p-6" />
      </ToastPrimitive.Provider>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
