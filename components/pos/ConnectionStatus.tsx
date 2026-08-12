"use client";

import { useEffect, useState } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { cn } from "@/lib/utils";

/**
 * Renders the 🟢/🟡/🔴 indicator required by spec §12. "Syncing" is driven
 * by the offline queue's own state (see stores/syncStore.ts), not just the
 * raw navigator.onLine flag, so it stays yellow until pending bills are
 * actually flushed to the server.
 */
export function ConnectionStatus() {
  const [online, setOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const syncing = useSyncStore((s) => s.syncing);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  let color = "bg-success";
  let label = "Online";
  if (!online) {
    color = "bg-danger";
    label = "Offline";
  } else if (syncing || pendingCount > 0) {
    color = "bg-gold";
    label = pendingCount > 0 ? `Syncing (${pendingCount})` : "Syncing";
  }

  return (
    <div className="flex items-center gap-1.5 border-2 border-border bg-surface px-2.5 py-1 text-xs font-semibold text-ink-soft">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label}
    </div>
  );
}
