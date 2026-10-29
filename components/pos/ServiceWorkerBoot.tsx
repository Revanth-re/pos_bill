"use client";

import { useEffect } from "react";

// Screens saved on the phone so Billo opens without internet.
const WARM_PAGES = ["/billing", "/dashboard", "/bills", "/udhaari"];
const WARM_KEY = "billo-sw-warmed-at";
const WARM_EVERY_MS = 6 * 60 * 60 * 1000; // refresh the offline copies every 6 hours

/** Registers the offline service worker and saves the main screens for offline use. */
export function ServiceWorkerBoot() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(async (reg) => {
        void reg.update();
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
        const ready = await navigator.serviceWorker.ready;
        if (!navigator.onLine) return;
        let last = 0;
        try {
          last = Number(localStorage.getItem(WARM_KEY) ?? 0);
        } catch {
          /* ignore */
        }
        if (Date.now() - last < WARM_EVERY_MS) return;
        // Wait a little so warming never competes with the screen the user just opened.
        window.setTimeout(() => {
          ready.active?.postMessage({ type: "WARM", urls: WARM_PAGES });
          try {
            localStorage.setItem(WARM_KEY, String(Date.now()));
          } catch {
            /* ignore */
          }
        }, 4000);
      })
      .catch(() => {});
  }, []);
  return null;
}
