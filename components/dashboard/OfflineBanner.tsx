"use client";

import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { useSyncStore } from "@/stores/syncStore";

/** Thin bar under the top bar: offline notice, or "syncing N bills" after reconnecting. */
export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const syncing = useSyncStore((s) => s.syncing);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!online)
    return (
      <div role="status" className="flex items-center justify-center gap-2 bg-ink px-3 py-1.5 text-center text-xs font-semibold text-white">
        <CloudOff className="h-3.5 w-3.5 shrink-0" />
        Offline — billing & printing work. {pendingCount > 0 ? `${pendingCount} bill${pendingCount > 1 ? "s" : ""} saved on this phone, will sync.` : "Bills sync when internet is back."}
      </div>
    );
  if (pendingCount > 0)
    return (
      <div role="status" className="flex items-center justify-center gap-2 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-brand-dark">
        <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "Syncing" : "Waiting to sync"} {pendingCount} offline bill{pendingCount > 1 ? "s" : ""}…
      </div>
    );
  return null;
}
