"use client";

import { useEffect } from "react";
import { bootstrapPwaInstall } from "@/lib/pwaInstallStore";

/** Boots install listeners. SW is also registered in the early head script
 * so `beforeinstallprompt` can fire before the user opens Profile. */
export function PwaInstallBoot() {
  useEffect(() => {
    bootstrapPwaInstall();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Force activate so Chrome marks the app installable ASAP.
          void reg.update();
          if (reg.waiting) reg.waiting.postMessage?.({ type: "SKIP_WAITING" });
        })
        .catch((err) => {
          console.warn("Service worker registration failed:", err);
        });
    }
  }, []);

  return null;
}
