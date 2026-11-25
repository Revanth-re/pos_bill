"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Tells the server "this login has Billo open" every 60s while the tab is visible (admin "Online now"). */
export function PresenceBeat() {
  const pathname = usePathname();
  useEffect(() => {
    const beat = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname }),
        keepalive: true,
      }).catch(() => {});
    };
    beat();
    const id = setInterval(beat, 60_000);
    document.addEventListener("visibilitychange", beat);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [pathname]);
  return null;
}
