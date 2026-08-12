"use client";

import { useSyncExternalStore } from "react";
import {
  bootstrapPwaInstall,
  getPwaInstallSnapshot,
  promptPwaInstall,
  subscribePwaInstall,
  type InstallPlatform,
} from "@/lib/pwaInstallStore";

const serverSnapshot = {
  installed: false,
  canPromptNatively: false,
  platform: "unsupported" as InstallPlatform,
};

export function usePwaInstall() {
  // Capture beforeinstallprompt as early as any consumer mounts.
  if (typeof window !== "undefined") bootstrapPwaInstall();

  const snap = useSyncExternalStore(subscribePwaInstall, getPwaInstallSnapshot, () => serverSnapshot);

  return {
    installed: snap.installed,
    canPromptNatively: snap.canPromptNatively,
    platform: snap.platform,
    promptInstall: promptPwaInstall,
  };
}
