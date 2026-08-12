"use client";

import { useEffect } from "react";
import { bootstrapPwaInstall, waitForInstallPrompt } from "@/lib/pwaInstallStore";

/** Starts SW + listens for install prompt as soon as the app loads (every page). */
export function PwaInstallBoot() {
  useEffect(() => {
    bootstrapPwaInstall();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then(async (reg) => {
          await navigator.serviceWorker.ready;
          // Warm the install prompt in the background — don't block UI.
          void waitForInstallPrompt(15000);
          void reg.update();
        })
        .catch(() => {});
    } else {
      void waitForInstallPrompt(15000);
    }
  }, []);

  return null;
}
