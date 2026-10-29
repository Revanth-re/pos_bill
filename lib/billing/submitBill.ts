"use client";

import { saveOfflineBill } from "@/lib/offline/db";
import type { CheckoutInput } from "@/validations/billing";

export interface SubmitBillResult {
  offline: boolean;
  invoice?: unknown;
  error?: string;
  /** The bill's own id — also used as its offline bill number until it syncs. */
  clientId: string;
}

/** If the server doesn't answer in this time (weak signal), the bill is saved offline instead. */
const ONLINE_TIMEOUT_MS = 8000;

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
    return { offline: true, clientId };
  }

  try {
    // Same clientId is reused on sync, so if this request did reach the server the bill is never doubled.
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), ONLINE_TIMEOUT_MS);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    }).finally(() => window.clearTimeout(timer));

    // Server/database down (5xx) → treat like no internet: keep billing, sync later.
    if (res.status >= 500) throw new Error("server unavailable");

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      // A real validation/business error (e.g. out of stock) — don't queue
      // it offline, surface it so the cashier can fix the cart.
      return { offline: false, error: body.error ?? "Unable to save the bill. Please try again.", clientId };
    }

    const body = await res.json();
    return { offline: false, invoice: body.invoice, clientId };
  } catch {
    // Network-level failure — queue for later sync.
    await saveOfflineBill({
      clientId,
      payload,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    return { offline: true, clientId };
  }
}
