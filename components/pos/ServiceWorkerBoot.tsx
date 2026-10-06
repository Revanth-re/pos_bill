"use client";

import { useEffect } from "react";

/** Keeps the passthrough SW registered (dashboard layout). */
export function ServiceWorkerBoot() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        void reg.update();
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
      })
      .catch(() => {});
  }, []);
  return null;
}
