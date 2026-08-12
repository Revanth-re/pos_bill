"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { promptPwaInstall } from "@/lib/pwaInstallStore";
import { toast } from "@/stores/toastStore";
import { useT } from "@/lib/i18n/LanguageProvider";

/**
 * Shows on every screen once Chrome is ready to install — one tap = system dialog.
 * Hidden when already installed, on auth pages, or when prompt isn't available yet.
 */
export function InstallBanner() {
  const t = useT();
  const pathname = usePathname();
  const { installed, canPromptNatively, secureContext } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem("pos-install-dismissed") === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const onAuth = pathname.startsWith("/login") || pathname.startsWith("/register");
  if (installed || dismissed || onAuth || !secureContext || !canPromptNatively) {
    return null;
  }

  async function handleInstall() {
    setBusy(true);
    try {
      const outcome = await promptPwaInstall();
      if (outcome === "accepted") toast.success(t("install.installing"));
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem("pos-install-dismissed", "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="fixed left-3 right-3 z-[70] md:left-auto md:right-4 md:w-80 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-4">
      <div className="flex items-center gap-3 rounded-2xl border border-brand/30 bg-surface p-3 shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-black text-white">
          ₹
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">Install POS</p>
          <p className="text-xs text-muted">Add to your phone like an app</p>
        </div>
        <button
          onClick={handleInstall}
          disabled={busy}
          className="touch-target shrink-0 rounded-xl bg-brand px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-1">
            <Download className="h-4 w-4" /> Install
          </span>
        </button>
        <button onClick={dismiss} className="touch-target shrink-0 rounded-full p-1.5 text-muted" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
