"use client";

import { useEffect, useState } from "react";
import { Download, CheckCircle2, Share } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { waitForInstallPrompt } from "@/lib/pwaInstallStore";
import { toast } from "@/stores/toastStore";
import { useT } from "@/lib/i18n/LanguageProvider";

export function InstallAppCard() {
  const t = useT();
  const { installed, canPromptNatively, platform, secureContext, promptInstall } = usePwaInstall();
  const [preparing, setPreparing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [ready, setReady] = useState(false);

  // Wait here (on Profile) until Chrome fires beforeinstallprompt — no refresh needed.
  useEffect(() => {
    if (installed) {
      setPreparing(false);
      return;
    }
    if (platform === "ios-safari") {
      setPreparing(false);
      return;
    }
    if (!secureContext) {
      setPreparing(false);
      return;
    }

    let cancelled = false;
    setPreparing(true);
    void waitForInstallPrompt(25000).then((ok) => {
      if (cancelled) return;
      setReady(ok || canPromptNatively);
      setPreparing(false);
    });
    return () => {
      cancelled = true;
    };
  }, [installed, platform, secureContext, canPromptNatively]);

  useEffect(() => {
    if (canPromptNatively) {
      setReady(true);
      setPreparing(false);
    }
  }, [canPromptNatively]);

  if (installed) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
        <p className="text-sm font-bold text-ink">{t("install.appInstalled")}</p>
      </div>
    );
  }

  if (!secureContext) {
    return (
      <p className="text-sm text-muted">
        Install needs a secure link (https). Open this POS with https, then tap Install.
      </p>
    );
  }

  async function handleClick() {
    if (platform === "ios-safari") {
      setShowIosSteps(true);
      return;
    }

    // prompt() must run directly from this tap — no awaits before it.
    setBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        toast.success(t("install.installing"));
        return;
      }
      if (outcome === "dismissed") return;
      toast.error("Install dialog unavailable. Stay on this page a moment and try again.");
    } finally {
      setBusy(false);
    }
  }

  const canInstallNow = ready || canPromptNatively;

  return (
    <div>
      <Button
        variant="primary"
        onClick={handleClick}
        loading={busy || preparing}
        disabled={busy || preparing || (platform !== "ios-safari" && !canInstallNow)}
      >
        <span className="inline-flex items-center gap-2">
          <Download className="h-4 w-4" />
          {preparing
            ? "Preparing install…"
            : platform === "ios-safari"
              ? t("settings.installTitle")
              : canInstallNow
                ? t("settings.installTitle")
                : "Install unavailable"}
        </span>
      </Button>

      {preparing && (
        <p className="mt-2 text-sm text-muted">Getting the install ready — tap Install when this finishes.</p>
      )}

      {!preparing && canInstallNow && platform !== "ios-safari" && (
        <p className="mt-2 text-sm text-muted">Tap Install — your phone will ask to add POS.</p>
      )}

      {!preparing && !canInstallNow && platform === "chromium" && (
        <p className="mt-2 text-sm text-muted">
          Chrome hasn&apos;t offered install yet. Make sure you&apos;re on https, then open billing once and come back here.
        </p>
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
