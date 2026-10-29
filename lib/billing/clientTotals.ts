"use client";

import type { Business, Product } from "@prisma/client";
import { calculateBillTotals, type BillTotals } from "./calculateTotals";
import type { CartLine } from "@/stores/cartStore";
import type { CheckoutInput } from "@/validations/billing";

/**
 * Exact bill totals on the phone — the SAME function the server uses — so:
 *  • quick Print / Udhaari send the right amount (incl. GST, bill discount), and
 *  • bills made offline print the correct total and sync without a mismatch.
 */
export interface TaxSettings {
  gstEnabled: boolean;
  taxInclusive: boolean;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
}

const KEY = "billo-tax-settings";
// Safe default = what the server would do for a shop with GST off.
const DEFAULT_TAX: TaxSettings = { gstEnabled: false, taxInclusive: true, cgstPercent: 0, sgstPercent: 0, igstPercent: 0 };

export function getCachedTax(): TaxSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_TAX, ...JSON.parse(raw) } : DEFAULT_TAX;
  } catch {
    return DEFAULT_TAX;
  }
}

export async function loadTaxSettings(): Promise<TaxSettings> {
  try {
    const res = await fetch("/api/business", { cache: "no-store" });
    if (!res.ok) throw new Error();
    const tax = (await res.json()).tax as TaxSettings;
    localStorage.setItem(KEY, JSON.stringify(tax));
    return tax;
  } catch {
    return getCachedTax();
  }
}

export function cartTotals(lines: CartLine[], billDiscount?: CheckoutInput["billDiscount"]): BillTotals {
  const productsById = new Map(
    lines.map((l) => [
      l.product.id,
      { id: l.product.id, name: l.product.name, sellingPrice: l.product.sellingPrice, gstPercent: l.product.gstPercent } as unknown as Product,
    ])
  );
  const tax = getCachedTax();
  return calculateBillTotals(
    { items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity, discount: l.discount })), billDiscount },
    productsById,
    tax as unknown as Pick<Business, "gstEnabled" | "taxInclusive" | "cgstPercent" | "sgstPercent" | "igstPercent">
  );
}
