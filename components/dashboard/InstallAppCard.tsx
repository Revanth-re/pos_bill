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
    if (canPromptNatively) {
      const outcome = await promptInstall();
      if (outcome === "accepted") toast.success(t("install.installing"));
      return;
    }
    if (platform === "ios-safari") {
      setShowIosSteps(true);
      return;
    }
    toast.info(t("install.useChromeEdge"));
  }

  return (
    <div>
      <Button variant="primary" onClick={handleClick}>
        <span className="inline-flex items-center gap-2">
          <Download className="h-4 w-4" /> {t("settings.installTitle")}
        </span>
      </Button>

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
      {platform === "unsupported" && !showIosSteps && (
        <p className="mt-2 flex items-center gap-1 text-sm text-muted">
          <MoreVertical className="h-3.5 w-3.5" /> {t("install.androidHint")}
        </p>
      )}
    </div>
  );
}
