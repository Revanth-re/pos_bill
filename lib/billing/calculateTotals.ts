import type { Business, Product } from "@prisma/client";
import type { CheckoutInput } from "@/validations/billing";

/**
 * Server-side, authoritative bill computation. Per spec §19/§23: "Never
 * trust totals sent from the client." This function is the single place
 * that turns (live product prices + requested discounts + business GST
 * config) into real money. It is intentionally pure (no DB/IO) so it's
 * trivial to unit test.
 */

export interface PricedLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; // authoritative, from DB — ignores any client-sent price
  gstPercent: number;
  lineSubtotal: number; // qty * unitPrice, before discount
  lineDiscount: number;
  lineTaxable: number; // lineSubtotal - lineDiscount (or the base for tax if inclusive)
  lineTax: number;
  lineTotal: number; // final amount for this line
}

export interface BillTotals {
  lines: PricedLine[];
  subtotal: number;
  discountTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  taxTotal: number;
  grandTotal: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function applyDiscount(
  amount: number,
  discount?: { type: "PERCENT" | "FIXED"; value: number }
): number {
  if (!discount) return 0;
  if (discount.type === "PERCENT") {
    return round2((amount * discount.value) / 100);
  }
  return round2(Math.min(discount.value, amount));
}

/**
 * `productsById` must contain every productId referenced in `input.items`,
 * pre-fetched by the caller within the same DB transaction that will later
 * write the invoice, so pricing reflects the exact moment of checkout.
 */
export function calculateBillTotals(
  input: Pick<CheckoutInput, "items" | "billDiscount">,
  productsById: Map<string, Product>,
  business: Pick<
    Business,
    "gstEnabled" | "taxInclusive" | "cgstPercent" | "sgstPercent" | "igstPercent"
  >,
  useIgst = false
): BillTotals {
  let subtotal = 0;
  let itemDiscountTotal = 0;

  const rawLines = input.items.map((item) => {
    const product = productsById.get(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }
    const unitPrice = Number(product.sellingPrice);
    const lineSubtotal = round2(unitPrice * item.quantity);
    const lineDiscount = applyDiscount(lineSubtotal, item.discount);
    subtotal += lineSubtotal;
    itemDiscountTotal += lineDiscount;
    return { product, item, unitPrice, lineSubtotal, lineDiscount };
  });

  // Bill-level discount is applied proportionally across lines so each
  // line's tax base reflects its fair share of the overall discount.
  const preDiscountTotal = subtotal - itemDiscountTotal;
  const billDiscount = applyDiscount(preDiscountTotal, input.billDiscount);
  const discountTotal = round2(itemDiscountTotal + billDiscount);

  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const lines: PricedLine[] = rawLines.map(({ product, item, unitPrice, lineSubtotal, lineDiscount }) => {
    const shareOfBillDiscount =
      preDiscountTotal > 0
        ? round2((billDiscount * (lineSubtotal - lineDiscount)) / preDiscountTotal)
        : 0;
    const lineTaxable = round2(lineSubtotal - lineDiscount - shareOfBillDiscount);

    const gstPercent = business.gstEnabled ? Number(product.gstPercent) : 0;

    // Tax-inclusive prices: the tax is extracted from lineTaxable rather
    // than added on top, per §3 "Tax-inclusive prices / Tax-exclusive prices".
    let lineTax = 0;
    let lineTotal = lineTaxable;
    if (gstPercent > 0) {
      if (business.taxInclusive) {
        const base = lineTaxable / (1 + gstPercent / 100);
        lineTax = round2(lineTaxable - base);
        lineTotal = lineTaxable;
      } else {
        lineTax = round2((lineTaxable * gstPercent) / 100);
        lineTotal = round2(lineTaxable + lineTax);
      }
    }

    if (gstPercent > 0) {
      if (useIgst) {
        igstTotal = round2(igstTotal + lineTax);
      } else {
        cgstTotal = round2(cgstTotal + lineTax / 2);
        sgstTotal = round2(sgstTotal + lineTax / 2);
      }
    }

    return {
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice,
      gstPercent,
      lineSubtotal,
      lineDiscount: round2(lineDiscount + shareOfBillDiscount),
      lineTaxable,
      lineTax,
      lineTotal,
    };
  });

  const taxTotal = round2(cgstTotal + sgstTotal + igstTotal);
  const grandTotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));

  return {
    lines,
    subtotal: round2(subtotal),
    discountTotal,
    cgstTotal,
    sgstTotal,
    igstTotal,
    taxTotal,
    grandTotal,
  };
}

/** Split payments must sum exactly to the grand total (paise-accurate). */
export function validatePaymentSum(
  payments: { amount: number }[],
  grandTotal: number
): { valid: boolean; paid: number; difference: number } {
  const paid = round2(payments.reduce((sum, p) => sum + p.amount, 0));
  const difference = round2(grandTotal - paid);
  return { valid: Math.abs(difference) < 0.01, paid, difference };
}
