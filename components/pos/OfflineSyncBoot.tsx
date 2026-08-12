"use client";

import { useOfflineSync } from "@/hooks/useOfflineSync";

export function OfflineSyncBoot() {
  useOfflineSync();
  return null;
}
