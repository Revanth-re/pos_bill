/**
 * Printer abstraction layer (spec §4). Billing code only ever talks to the
 * `ReceiptPrinter` interface — it never imports a vendor SDK directly. New
 * printer integrations (ESC/POS over Bluetooth, a cloud print service, etc.)
 * are added by writing a new adapter that implements this interface and
 * registering it in `getPrinterAdapter`, without touching billing code.
 */

export type PrinterType = "THERMAL_58MM" | "THERMAL_80MM" | "A4" | "BROWSER";

export interface ReceiptLine {
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptData {
  businessName: string;
  businessAddress?: string;
  gstin?: string;
  invoiceNumber: string;
  createdAt: string;
  cashierName: string;
  orderType: "DINE_IN" | "TAKEAWAY";
  customerName?: string;
  lines: ReceiptLine[];
  subtotal: number;
  discountTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  payments: { method: string; amount: number }[];
}

export interface ReceiptPrinter {
  type: PrinterType;
  /** Renders the receipt and hands it to the OS/browser print dialog, or a
   * connected device driver, depending on the adapter. */
  print(data: ReceiptData): Promise<void>;
  /** Produces a printable preview (HTML string) without triggering print. */
  preview(data: ReceiptData): string;
}
