"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  bootstrapPwaInstall,
  getPwaInstallSnapshot,
  getServerPwaSnapshot,
  promptPwaInstall,
  subscribePwaInstall,
} from "@/lib/pwaInstallStore";

export function usePwaInstall() {
  useEffect(() => {
    bootstrapPwaInstall();
  }, []);

  const snap = useSyncExternalStore(
    subscribePwaInstall,
    getPwaInstallSnapshot,
    getServerPwaSnapshot
  );

  return {
    installed: snap.installed,
    canPromptNatively: snap.canPromptNatively,
    platform: snap.platform,
    promptInstall: promptPwaInstall,
  };
}
