"use client";

import { useState } from "react";
import { Download, CheckCircle2, Share, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { toast } from "@/stores/toastStore";

export function InstallAppCard() {
  const { installed, canPromptNatively, platform, promptInstall } = usePwaInstall();
  const [showIosSteps, setShowIosSteps] = useState(false);

  if (installed) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
        <p className="text-sm font-bold text-ink">App Installed</p>
      </div>
    );
  }

  async function handleClick() {
    if (canPromptNatively) {
      const outcome = await promptInstall();
      if (outcome === "accepted") toast.success("Installing app…");
      return;
    }
    if (platform === "ios-safari") {
      setShowIosSteps(true);
      return;
    }
    toast.info("Open this page in Chrome or Edge to install the app.");
  }

  return (
    <div>
      <Button variant="primary" onClick={handleClick}>
        <span className="inline-flex items-center gap-2">
          <Download className="h-4 w-4" /> Install App
        </span>
      </Button>

      {showIosSteps && (
        <div className="mt-3 rounded-xl border border-border bg-paper p-3 text-sm text-ink-soft space-y-2">
          <p className="font-bold text-ink">To install on iPhone/iPad:</p>
          <p className="flex items-center gap-1.5">
            1. Tap the <Share className="h-4 w-4 inline" /> Share button in Safari
          </p>
          <p>2. Scroll down and tap &quot;Add to Home Screen&quot;</p>
          <p>3. Tap &quot;Add&quot; in the top right</p>
        </div>
      )}
      {platform === "unsupported" && !showIosSteps && (
        <p className="mt-2 flex items-center gap-1 text-sm text-muted">
          Look for <MoreVertical className="h-3.5 w-3.5" /> in your browser menu for an &quot;Install app&quot; or &quot;Add to Home Screen&quot; option.
        </p>
      )}
    </div>
  );
}
