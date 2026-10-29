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
  // SYNCING too: a bill caught mid-sync when the app was closed must be retried.
  const pending = bills.filter(
    (b) => (b.status === "PENDING" || b.status === "SYNCING" || b.status === "FAILED") && b.attempts < MAX_ATTEMPTS
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
      } else if (res.status >= 500 || res.status === 401) {
        // Server/database down or login expired — not the bill's fault. Keep it, don't use up
        // a retry attempt, and stop for now; we'll try again later.
        await updateOfflineBillStatus(bill.clientId, "PENDING", "Waiting for server");
        break;
      } else {
        const body = await res.json().catch(() => ({}));
        await updateOfflineBillStatus(bill.clientId, "FAILED", body.error ?? "Sync failed");
        failed += 1;
      }
    } catch {
      // No internet — keep the bill, no attempt used, try again later.
      await updateOfflineBillStatus(bill.clientId, "PENDING", "No internet");
      break;
    }
  }

  onProgress?.(0);
  return { synced, failed };
}

export type { OfflineBillRecord };
