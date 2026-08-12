"use client";

import { useState } from "react";
import { Download, CheckCircle2, Share } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { toast } from "@/stores/toastStore";
import { useT } from "@/lib/i18n/LanguageProvider";

export function InstallAppCard() {
  const t = useT();
  const { installed, canPromptNatively, platform, promptInstall } = usePwaInstall();
  const [busy, setBusy] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);

  if (installed) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
        <p className="text-sm font-bold text-ink">{t("install.appInstalled")}</p>
      </div>
    );
  }

  async function handleClick() {
    // iOS has no beforeinstallprompt API — Share sheet is the only path.
    if (platform === "ios-safari") {
      setShowIosSteps(true);
      return;
    }

    // Call prompt() immediately from this tap — do not await anything first.
    setBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        toast.success(t("install.installing"));
        return;
      }
      if (outcome === "dismissed") return;

      // Prompt event not ready yet (SW still settling). One refresh usually
      // makes Chrome fire beforeinstallprompt; keep UX as a toast only.
      toast.info("Install not ready yet — refresh this page, then tap Install again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button variant="primary" onClick={handleClick} loading={busy} disabled={busy}>
        <span className="inline-flex items-center gap-2">
          <Download className="h-4 w-4" /> {t("settings.installTitle")}
        </span>
      </Button>

      {canPromptNatively && (
        <p className="mt-2 text-sm text-muted">Your device will ask to install POS.</p>
      )}

      {showIosSteps && (
        <div className="mt-3 rounded-xl border border-border bg-paper p-3 text-sm text-ink-soft space-y-2">
          <p className="font-bold text-ink">{t("install.iosTitle")}</p>
          <p className="flex items-center gap-1.5">
            1. {t("install.iosStep1")} <Share className="h-4 w-4 inline" />
          </p>
          <p>2. {t("install.iosStep2")}</p>
          <p>3. {t("install.iosStep3")}</p>
        </div>
      )}
    </div>
  );
}
