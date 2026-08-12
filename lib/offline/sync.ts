"use client";

import {
  getAllOfflineBills,
  updateOfflineBillStatus,
  deleteOfflineBill,
  type OfflineBillRecord,
} from "./db";

const MAX_ATTEMPTS = 5;

/**
 * Walks every PENDING/FAILED offline bill and POSTs it to the real
 * checkout endpoint. The endpoint is idempotent on `clientId`, so a bill
 * that partially succeeded on a previous flaky attempt won't be double
 * billed or double-deduct inventory — see app/api/billing/checkout/route.ts.
 */
export async function syncOfflineBills(
  onProgress?: (remaining: number) => void
): Promise<{ synced: number; failed: number }> {
  const bills = await getAllOfflineBills();
  const pending = bills.filter(
    (b) => (b.status === "PENDING" || b.status === "FAILED") && b.attempts < MAX_ATTEMPTS
  );

  let synced = 0;
  let failed = 0;

  for (const bill of pending) {
    onProgress?.(pending.length - synced - failed);
    try {
      await updateOfflineBillStatus(bill.clientId, "SYNCING");
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bill.payload),
      });

      if (res.ok) {
        await deleteOfflineBill(bill.clientId);
        synced += 1;
      } else {
        const body = await res.json().catch(() => ({}));
        await updateOfflineBillStatus(bill.clientId, "FAILED", body.error ?? "Sync failed");
        failed += 1;
      }
    } catch {
      await updateOfflineBillStatus(bill.clientId, "FAILED", "Network error during sync");
      failed += 1;
    }
  }

  onProgress?.(0);
  return { synced, failed };
}

export type { OfflineBillRecord };
