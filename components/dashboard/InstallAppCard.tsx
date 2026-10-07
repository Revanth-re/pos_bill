"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, CheckCircle2, Share, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { toast } from "@/stores/toastStore";
import { useT } from "@/lib/i18n/LanguageProvider";

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

  async function handlePrimaryInstall() {
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
      // No native prompt yet — keep sheet open with platform help.
      toast.info("Native install not ready on this tab yet. Use the steps below.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button
        variant="primary"
        size={compact ? "sm" : "md"}
        className={compact ? "w-full" : undefined}
        onClick={() => {
          // If Chrome already handed us the prompt, install immediately — no extra sheet.
          if (canPromptNatively && platform !== "ios-safari") {
            void (async () => {
              setBusy(true);
              try {
                const outcome = await promptInstall();
                if (outcome === "accepted") toast.success(t("install.installing"));
                else if (outcome === "unavailable") setOpen(true);
              } finally {
                setBusy(false);
              }
            })();
            return;
          }
          setOpen(true);
        }}
        loading={busy}
      >
        <span className="inline-flex items-center gap-2">
          <Download className="h-4 w-4" /> {t("settings.installTitle")}
        </span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center sm:justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="toast-enter max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-border bg-surface shadow-lg pb-[max(1rem,env(safe-area-inset-bottom))] sm:w-[calc(100%-24px)] sm:max-w-[520px] sm:rounded-2xl">
            <div className="flex items-center justify-between p-4">
              <p className="font-bold text-ink">Install Billo</p>
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
                alt="Billo"
                width={72}
                height={72}
                className="rounded-2xl"
              />
              <p className="mt-3 text-lg font-extrabold text-ink">Billo</p>
              <p className="mt-1 text-sm text-muted">
                Install on this phone for faster billing — full screen, works offline.
              </p>
            </div>

            {!secureContext && (
              <p className="mx-4 mb-3 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                Open the site with <strong>https</strong> (not http) to install.
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
                <Button size="lg" onClick={handlePrimaryInstall} loading={busy} disabled={!secureContext}>
                  <span className="inline-flex items-center gap-2">
                    <Download className="h-4 w-4" /> Install
                  </span>
                </Button>
                <p className="text-center text-xs text-muted">
                  Or tap the <strong>install icon</strong> in the Chrome address bar.
                </p>
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
