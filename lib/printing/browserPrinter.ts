import type { PrinterType, ReceiptData, ReceiptPrinter } from "./types";
import { escapeHtml } from "./escapeHtml";

/**
 * Default adapter: renders the receipt as HTML and uses the browser's print
 * dialog (`window.print()`), with CSS `@page` sized for the chosen paper.
 * This alone satisfies "Browser Print" and covers 58mm/80mm/A4 without any
 * native driver — real thermal-SDK adapters (e.g. WebUSB/ESC-POS, a
 * Bluetooth adapter) can be added later behind the same interface.
 */
export class BrowserPrinter implements ReceiptPrinter {
  constructor(public type: PrinterType) {}

  private paperCss(): string {
    switch (this.type) {
      case "THERMAL_58MM":
        return "@page { size: 58mm auto; margin: 2mm; } body { width: 54mm; font-size: 10px; }";
      case "THERMAL_80MM":
        return "@page { size: 80mm auto; margin: 3mm; } body { width: 74mm; font-size: 12px; }";
      case "A4":
        return "@page { size: A4; margin: 15mm; } body { font-size: 14px; }";
      default:
        return "@page { margin: 10mm; }";
    }
  }

  preview(data: ReceiptData): string {
    const money = (n: number) => `Rs. ${n.toFixed(2)}`;
    const isThermal = this.type === "THERMAL_58MM" || this.type === "THERMAL_80MM";

    const itemRows = data.lines
      .map(
        (l) => `
        <tr>
          <td style="text-align:left">${escapeHtml(l.name)}${isThermal ? `<br/><span style="opacity:.7">${l.qty} x ${money(l.unitPrice)}</span>` : ""}</td>
          ${isThermal ? "" : `<td style="text-align:center">${l.qty}</td><td style="text-align:right">${money(l.unitPrice)}</td>`}
          <td style="text-align:right">${money(l.total)}</td>
        </tr>`
      )
      .join("");

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  ${this.paperCss()}
  body { font-family: 'Courier New', monospace; color: #000; }
  h1 { font-size: 1.1em; margin: 0 0 2px; text-align: center; }
  .muted { opacity: .7; text-align: center; margin: 0 0 8px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th { text-align: left; border-bottom: 1px dashed #000; padding-bottom: 4px; }
  td { padding: 3px 0; vertical-align: top; }
  .totals td { border: none; }
  .divider { border-top: 1px dashed #000; margin: 6px 0; }
  .grand { font-weight: bold; font-size: 1.15em; }
</style>
</head>
<body>
  <h1>${escapeHtml(data.businessName)}</h1>
  ${data.businessAddress ? `<p class="muted">${escapeHtml(data.businessAddress)}</p>` : ""}
  ${data.gstin ? `<p class="muted">GSTIN: ${escapeHtml(data.gstin)}</p>` : ""}
  <div class="divider"></div>
  <p>Invoice: ${escapeHtml(data.invoiceNumber)}<br/>
     ${escapeHtml(data.createdAt)}<br/>
     Cashier: ${escapeHtml(data.cashierName)} &middot; ${data.orderType === "DINE_IN" ? "Dine-in" : "Takeaway"}
     ${data.customerName ? `<br/>Customer: ${escapeHtml(data.customerName)}` : ""}
  </p>
  <div class="divider"></div>
  <table>
    <thead><tr><th>Item</th>${isThermal ? "" : "<th>Qty</th><th>Rate</th>"}<th style='text-align:right'>Amt</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="divider"></div>
  <table class="totals">
    <tr><td>Subtotal</td><td style="text-align:right">${money(data.subtotal)}</td></tr>
    ${data.discountTotal > 0 ? `<tr><td>Discount</td><td style="text-align:right">-${money(data.discountTotal)}</td></tr>` : ""}
    ${data.cgstTotal > 0 ? `<tr><td>CGST</td><td style="text-align:right">${money(data.cgstTotal)}</td></tr>` : ""}
    ${data.sgstTotal > 0 ? `<tr><td>SGST</td><td style="text-align:right">${money(data.sgstTotal)}</td></tr>` : ""}
    ${data.igstTotal > 0 ? `<tr><td>IGST</td><td style="text-align:right">${money(data.igstTotal)}</td></tr>` : ""}
    <tr class="grand"><td>Total</td><td style="text-align:right">${money(data.grandTotal)}</td></tr>
  </table>
  <div class="divider"></div>
  <table class="totals">
    ${data.payments.map((p) => `<tr><td>${escapeHtml(p.method)}</td><td style="text-align:right">${money(p.amount)}</td></tr>`).join("")}
  </table>
  <p class="muted" style="margin-top:10px">Thank you, visit again!</p>
</body>
</html>`;
  }

  async print(data: ReceiptData): Promise<void> {
    const html = this.preview(data);
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) throw new Error("Pop-up blocked — allow pop-ups to print receipts.");

    // Resolve only after the browser print dialog finishes (print or cancel).
    // Previously this returned immediately, so the UI said "printed" before
    // the cashier actually printed anything.
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        try {
          win.close();
        } catch {
          /* ignore */
        }
        resolve();
      };

      win.document.write(html);
      win.document.close();

      win.onafterprint = () => finish();

      const triggerPrint = () => {
        try {
          win.focus();
          win.print();
          // Fallback if afterprint never fires (some mobile browsers).
          window.setTimeout(() => {
            if (!settled) finish();
          }, 1500);
        } catch (e) {
          if (!settled) {
            settled = true;
            reject(e instanceof Error ? e : new Error("Unable to print."));
          }
        }
      };

      if (win.document.readyState === "complete") {
        triggerPrint();
      } else {
        win.onload = () => triggerPrint();
      }
    });
  }
}
