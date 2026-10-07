"use client";

import { useEffect, useState } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { InstallHelpSheet } from "@/components/pwa/InstallHelpSheet";
import { toast } from "@/stores/toastStore";
import { useT } from "@/lib/i18n/LanguageProvider";

export function InstallAppCard({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const { installed, canPromptNatively, promptInstall } = usePwaInstall();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Arriving from usebillo.in "Get Billo" (…/login?install=1) → open the install sheet straight away.
  // The visitor still taps "Install" once — browsers only allow installing from a user tap.
  useEffect(() => {
    if (installed) return;
    if (new URLSearchParams(window.location.search).get("install") !== "1") return;
    const timer = setTimeout(() => setOpen(true), 400);
    return () => clearTimeout(timer);
  }, [installed]);

  if (installed) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
        <p className="text-sm font-bold text-ink">{t("install.appInstalled")}</p>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="primary"
        size={compact ? "sm" : "md"}
        className={compact ? "w-full" : undefined}
        onClick={() => {
          // Chrome already allows install → native prompt on this tap; otherwise the guided sheet.
          if (canPromptNatively) {
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

      <InstallHelpSheet
        open={open}
        onClose={() => setOpen(false)}
        onInstalled={() => {
          setOpen(false);
          toast.success(t("install.installing"));
        }}
      />
    </div>
  );
}
