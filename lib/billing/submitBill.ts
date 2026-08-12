"use client";

import { saveOfflineBill } from "@/lib/offline/db";
import type { CheckoutInput } from "@/validations/billing";

export interface SubmitBillResult {
  offline: boolean;
  invoice?: unknown;
  error?: string;
}

/**
 * The one function billing UI calls to complete a sale. It always attaches
 * a client-generated UUID so the same bill can be safely retried later
 * (server dedupes on it). If the network request fails outright (offline,
 * DNS, timeout) the bill is queued in IndexedDB instead of being lost —
 * spec §12: "the cashier must still be able to ... accept payments."
 */
export async function submitBill(input: Omit<CheckoutInput, "clientId">): Promise<SubmitBillResult> {
  const clientId = crypto.randomUUID();
  const payload: CheckoutInput = { ...input, clientId };

  if (!navigator.onLine) {
    await saveOfflineBill({
      clientId,
      payload,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    return { offline: true };
  }

  try {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      // A real validation/business error (e.g. out of stock) — don't queue
      // it offline, surface it so the cashier can fix the cart.
      return { offline: false, error: body.error ?? "Unable to save the bill. Please try again." };
    }

    const body = await res.json();
    return { offline: false, invoice: body.invoice };
  } catch {
    // Network-level failure — queue for later sync.
    await saveOfflineBill({
      clientId,
      payload,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    return { offline: true };
  }
}
