"use client";

import { useEffect } from "react";
import { bootstrapPwaInstall } from "@/lib/pwaInstallStore";

/** Registers a clean SW and listens for the native install prompt. */
export function PwaInstallBoot() {
  useEffect(() => {
    bootstrapPwaInstall();

    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    (async () => {
      try {
        // Force every tab onto the new passthrough SW (clears broken caches).
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.update()));

        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        if (cancelled) return;

        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // If a new worker took over, reload once so the broken SW is gone.
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (cancelled) return;
          const key = "pos-sw-reloaded-v5";
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, "1");
            window.location.reload();
          }
        });
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
