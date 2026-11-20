"use client";

import { useEffect } from "react";

/**
 * Counts installed apps. When Billo runs as an installed app (opened from the home-screen icon or
 * the Play Store app) — or right after Chrome's install finishes — tell the server once per device.
 * Also sends a GA4 event when Google Analytics is set up.
 */
const DEVICE_KEY = "billo-device-id";
const REPORTED_KEY = "billo-install-reported";
const PENDING_KEY = "billo-installed-pending";

function get(k: string) {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function set(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
}

export function InstallTracker() {
  useEffect(() => {
    const fromPlayStore = document.referrer.startsWith("android-app://") || get("billo-launch-twa") === "1";
    if (document.referrer.startsWith("android-app://")) set("billo-launch-twa", "1");
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const report = () => {
      const pending = get(PENDING_KEY);
      if (!standalone && !pending) return;
      let id = get(DEVICE_KEY);
      if (!id) {
        id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).toLowerCase();
        set(DEVICE_KEY, id);
      }
      const source = fromPlayStore ? "playstore" : "chrome";
      const key = `${REPORTED_KEY}:${source}`;
      if (get(key) === "1") return;
      fetch("/api/track/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: id, source, platform: /Android/i.test(navigator.userAgent) ? "Android" : /iPhone|iPad/i.test(navigator.userAgent) ? "iOS" : "Desktop" }),
        keepalive: true,
      })
        .then((r) => {
          if (r.ok) {
            set(key, "1");
            try {
              localStorage.removeItem(PENDING_KEY);
            } catch {
              /* ignore */
            }
            const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
            gtag?.("event", "app_install", { source });
          }
        })
        .catch(() => {});
    };
    report();
    const onInstalled = () => {
      set(PENDING_KEY, "1");
      report();
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);
  return null;
}
