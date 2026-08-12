"use client";

import { useEffect } from "react";
import { bootstrapPwaInstall } from "@/lib/pwaInstallStore";

/** Registers SW + install-prompt listener on first app paint (all routes). */
export function PwaInstallBoot() {
  useEffect(() => {
    bootstrapPwaInstall();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
    }
  }, []);

  return null;
}
