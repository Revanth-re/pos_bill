"use client";

import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToastStore, type ToastVariant } from "@/stores/toastStore";
import { cn } from "@/lib/utils";

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof CheckCircle2; border: string; iconColor: string }> = {
  success: { icon: CheckCircle2, border: "border-l-success", iconColor: "text-success" },
  error: { icon: XCircle, border: "border-l-danger", iconColor: "text-danger" },
  warning: { icon: AlertTriangle, border: "border-l-accent-dark", iconColor: "text-accent-dark" },
  info: { icon: Info, border: "border-l-brand", iconColor: "text-brand" },
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-6">
      {toasts.map((t) => {
        const { icon: Icon, border, iconColor } = VARIANT_STYLES[t.variant];
        return (
          <div
            key={t.id}
            className={cn(
              "toast-enter flex w-full max-w-sm items-center gap-2.5 rounded-xl border-l-4 bg-surface px-4 py-3 shadow-lg",
              border
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0", iconColor)} />
            <p className="flex-1 text-sm font-semibold text-ink">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="shrink-0 text-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
