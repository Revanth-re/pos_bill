"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { InstallHelpSheet, goToLogin } from "@/components/pwa/InstallHelpSheet";

/**
 * "Get Billo" → native install popup directly. After install → /login.
 * If Chrome isn't ready yet, a small sheet waits and opens the popup by itself.
 */
export function InstallButton({ className = "", label = "Get Billo", iconClass = "h-4 w-4" }: { className?: string; label?: string; iconClass?: string }) {
  const { installed, canPromptNatively, promptInstall } = usePwaInstall();
  const [help, setHelp] = useState(false);

  async function handleClick() {
    if (installed) return goToLogin();
    if (canPromptNatively) {
      const outcome = await promptInstall(); // native dialog on this tap
      if (outcome === "accepted") return goToLogin();
      if (outcome === "dismissed") return;
    }
    setHelp(true);
  }

  return (
    <>
      <button type="button" onClick={handleClick} className={className}>
        <Download className={iconClass} /> {label}
      </button>
      <InstallHelpSheet open={help} onClose={() => setHelp(false)} />
    </>
  );
}
