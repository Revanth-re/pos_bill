"use client";

import { useEffect, useCallback } from "react";
import { syncOfflineBills } from "@/lib/offline/sync";
import { getAllOfflineBills } from "@/lib/offline/db";
import { useSyncStore } from "@/stores/syncStore";

/**
 * Mount once near the app root (see app/(dashboard)/layout.tsx). Triggers a
 * sync attempt whenever the browser regains connectivity, on mount, and on
 * a slow background interval as a safety net for missed 'online' events.
 */
export function useOfflineSync() {
  const setPendingCount = useSyncStore((s) => s.setPendingCount);
  const setSyncing = useSyncStore((s) => s.setSyncing);

  const refreshPendingCount = useCallback(async () => {
    const bills = await getAllOfflineBills();
    setPendingCount(bills.filter((b) => b.status !== "SYNCED").length);
  }, [setPendingCount]);

  const runSync = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncing(true);
    try {
      await syncOfflineBills((remaining) => setPendingCount(remaining));
    } finally {
      setSyncing(false);
      await refreshPendingCount();
    }
  }, [setSyncing, setPendingCount, refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
    runSync();

    window.addEventListener("online", runSync);
    const interval = setInterval(runSync, 60_000);

    return () => {
      window.removeEventListener("online", runSync);
      clearInterval(interval);
    };
  }, [runSync, refreshPendingCount]);
}
