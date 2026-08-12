"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, CheckCircle2, Share, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { toast } from "@/stores/toastStore";
import { useT } from "@/lib/i18n/LanguageProvider";

/**
 * Instant install UX — no long spinner.
 * Opens a sheet immediately; if Chrome already captured beforeinstallprompt,
 * the Install tap shows the real system dialog. Otherwise shows the best
 * path for that browser (iOS Share / Add to Home Screen).
 */
export function InstallAppCard({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const { installed, canPromptNatively, platform, secureContext, promptInstall } = usePwaInstall();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (installed) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
        <p className="text-sm font-bold text-ink">{t("install.appInstalled")}</p>
      </div>
    );
  }

  async function handleInstallTap() {
    // Must call prompt() directly from this gesture when available.
    if (canPromptNatively) {
      setBusy(true);
      try {
        const outcome = await promptInstall();
        if (outcome === "accepted") {
          toast.success(t("install.installing"));
          setOpen(false);
          return;
        }
        if (outcome === "dismissed") {
          setOpen(false);
          return;
        }
      } finally {
        setBusy(false);
      }
    }

    // iOS / browsers without beforeinstallprompt — sheet already shows steps.
    if (platform === "ios-safari") return;
    if (!secureContext) {
      toast.error("Open this app with https to install.");
      return;
    }
  }

  return (
    <div>
      <Button
        variant="primary"
        size={compact ? "sm" : "md"}
        className={compact ? "w-full" : undefined}
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex items-center gap-2">
          <Download className="h-4 w-4" /> {t("settings.installTitle")}
        </span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center sm:justify-center bg-black/40">
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border border-border bg-surface shadow-lg pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between p-4">
              <p className="font-bold text-ink">Install POS</p>
              <button
                onClick={() => setOpen(false)}
                className="touch-target rounded-full p-2 hover:bg-paper"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col items-center px-6 pb-2 text-center">
              <Image
                src="/icons/icon-192.png"
                alt="POS"
                width={72}
                height={72}
                className="rounded-2xl border border-border"
              />
              <p className="mt-3 text-lg font-extrabold text-ink">POS</p>
              <p className="mt-1 text-sm text-muted">
                Install on this phone for faster billing — full screen, works offline.
              </p>
            </div>

            {!secureContext && (
              <p className="mx-4 mb-3 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                This page is not on https, so the phone cannot install apps. Open your https link and try again.
              </p>
            )}

            {platform === "ios-safari" ? (
              <div className="mx-4 mb-4 space-y-2 rounded-xl border border-border bg-paper p-3 text-sm text-ink-soft">
                <p className="font-bold text-ink">{t("install.iosTitle")}</p>
                <p className="flex items-center gap-1.5">
                  1. {t("install.iosStep1")} <Share className="h-4 w-4 inline" />
                </p>
                <p>2. {t("install.iosStep2")}</p>
                <p>3. {t("install.iosStep3")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 p-4">
                <Button size="lg" onClick={handleInstallTap} loading={busy} disabled={!secureContext}>
                  <span className="inline-flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    {canPromptNatively ? "Install" : "Add to Home Screen"}
                  </span>
                </Button>
                {!canPromptNatively && secureContext && (
                  <AndroidFallbackHint />
                )}
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Not now
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AndroidFallbackHint() {
  return (
    <p className="text-center text-xs text-muted">
      If the phone dialog doesn&apos;t open, tap your browser menu → <strong>Install app</strong>.
    </p>
  );
}
