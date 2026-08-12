"use client";

import { useState } from "react";
import { Download, CheckCircle2, Share, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { toast } from "@/stores/toastStore";
import { useT } from "@/lib/i18n/LanguageProvider";

export function InstallAppCard() {
  const t = useT();
  const { installed, canPromptNatively, platform, promptInstall } = usePwaInstall();
  const [showManualSteps, setShowManualSteps] = useState(false);

  if (installed) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
        <p className="text-sm font-bold text-ink">{t("install.appInstalled")}</p>
      </div>
    );
  }

  async function handleClick() {
    // Always try the native prompt first — it may have been captured early.
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      toast.success(t("install.installing"));
      return;
    }
    if (outcome === "dismissed") return;

    // Native prompt unavailable: show browser-specific install steps.
    setShowManualSteps(true);
  }

  return (
    <div>
      <Button variant="primary" onClick={handleClick}>
        <span className="inline-flex items-center gap-2">
          <Download className="h-4 w-4" /> {t("settings.installTitle")}
        </span>
      </Button>

      {canPromptNatively && !showManualSteps && (
        <p className="mt-2 text-sm text-muted">Tap the button to install POS on this device.</p>
      )}

      {showManualSteps && platform === "ios-safari" && (
        <div className="mt-3 rounded-xl border border-border bg-paper p-3 text-sm text-ink-soft space-y-2">
          <p className="font-bold text-ink">{t("install.iosTitle")}</p>
          <p className="flex items-center gap-1.5">
            1. {t("install.iosStep1")} <Share className="h-4 w-4 inline" />
          </p>
          <p>2. {t("install.iosStep2")}</p>
          <p>3. {t("install.iosStep3")}</p>
        </div>
      )}

      {showManualSteps && platform === "chromium" && (
        <div className="mt-3 rounded-xl border border-border bg-paper p-3 text-sm text-ink-soft space-y-2">
          <p className="font-bold text-ink">Install from your browser menu</p>
          <p className="flex items-start gap-1.5">
            <MoreVertical className="h-4 w-4 mt-0.5 shrink-0" />
            1. Tap the <strong>⋮</strong> menu (top-right in Chrome / Edge)
          </p>
          <p>2. Tap <strong>Install app</strong> or <strong>Add to Home screen</strong></p>
          <p>3. Confirm — POS opens full screen like a real app</p>
          <p className="text-xs text-muted pt-1">
            Must be on HTTPS (or localhost). If you don’t see Install, refresh once and try again.
          </p>
        </div>
      )}

      {showManualSteps && platform === "unsupported" && (
        <div className="mt-3 rounded-xl border border-border bg-paper p-3 text-sm text-ink-soft space-y-2">
          <p className="font-bold text-ink">{t("install.useChromeEdge")}</p>
          <p>{t("install.androidHint")}</p>
        </div>
      )}
    </div>
  );
}
