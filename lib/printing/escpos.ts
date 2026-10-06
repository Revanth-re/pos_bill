import type { ReceiptData } from "./types";

/**
 * Turns a receipt into raw ESC/POS bytes for 58mm / 80mm thermal printers.
 * Printed directly over Bluetooth — no browser print dialog, no PDF.
 * ASCII only (thermal fonts have no ₹ glyph), so amounts use "Rs".
 */

const ESC = 0x1b;
const GS = 0x1d;

export function encodeReceipt(data: ReceiptData, paper: "58" | "80"): Uint8Array {
  const W = paper === "58" ? 32 : 48;
  const out: number[] = [];

  const raw = (...b: number[]) => out.push(...b);
  const ascii = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/₹/g, "Rs")
      .replace(/[^\x20-\x7E]/g, "");
  const text = (s: string) => {
    for (const ch of ascii(s)) out.push(ch.charCodeAt(0));
  };
  const line = (s = "") => {
    text(s);
    raw(0x0a);
  };
  const align = (a: 0 | 1 | 2) => raw(ESC, 0x61, a);
  const bold = (on: boolean) => raw(ESC, 0x45, on ? 1 : 0);
  const size = (n: 0 | 1 | 2) => raw(GS, 0x21, n === 0 ? 0x00 : n === 1 ? 0x11 : 0x22); // 1x / 2x / 3x
  const money = (n: number) => n.toFixed(2);
  const lr = (left: string, right: string) => {
    const l = ascii(left);
    const r = ascii(right);
    const space = Math.max(1, W - l.length - r.length);
    if (l.length + r.length + 1 > W) {
      line(l.slice(0, W));
      line(" ".repeat(Math.max(0, W - r.length)) + r);
    } else {
      line(l + " ".repeat(space) + r);
    }
  };
  const rule = (ch = "-") => line(ch.repeat(W));
  const wrap = (s: string, width: number) => {
    const words = ascii(s).split(/\s+/);
    const rows: string[] = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > width) {
        if (cur) rows.push(cur);
        cur = w.slice(0, width);
      } else cur = (cur + " " + w).trim();
    }
    if (cur) rows.push(cur);
    return rows;
  };

  raw(ESC, 0x40); // init

  // Header
  align(1);
  bold(true);
  size(1);
  for (const r of wrap(data.businessName, Math.floor(W / 2))) line(r);
  size(0);
  bold(false);
  if (data.businessAddress) for (const r of wrap(data.businessAddress, W)) line(r);
  if (data.gstin) line(`GSTIN: ${data.gstin}`);

  if (data.copyLabel) {
    bold(true);
    line(`*** ${data.copyLabel} ***`);
    bold(false);
  }

  // Token — big, so the customer can hand it to the kitchen
  if (data.tokenNumber) {
    rule("=");
    line("TOKEN");
    bold(true);
    size(2);
    line(String(data.tokenNumber));
    size(0);
    bold(false);
    rule("=");
  } else {
    rule();
  }

  align(0);
  lr(`Bill: ${data.invoiceNumber}`, data.orderType === "DINE_IN" ? "Dine-in" : "Takeaway");
  line(data.createdAt);
  line(`Cashier: ${data.cashierName}`);
  if (data.customerName) line(`Customer: ${data.customerName}`);
  rule();

  // Items
  bold(true);
  lr("ITEM", paper === "58" ? "AMT" : "QTY   RATE      AMOUNT");
  bold(false);
  rule();
  for (const l of data.lines) {
    if (paper === "58") {
      for (const r of wrap(l.name, W)) line(r);
      lr(`  ${l.qty} x ${money(l.unitPrice)}`, money(l.total));
    } else {
      const nameW = W - 22;
      const rows = wrap(l.name, nameW);
      const right = `${String(l.qty).padStart(3)} ${money(l.unitPrice).padStart(8)} ${money(l.total).padStart(9)}`;
      line(rows[0].padEnd(nameW) + right);
      for (const r of rows.slice(1)) line(r);
    }
  }
  rule();

  // Totals
  lr("Subtotal", money(data.subtotal));
  if (data.discountTotal > 0) lr("Discount", `-${money(data.discountTotal)}`);
  if (data.cgstTotal > 0) lr("CGST", money(data.cgstTotal));
  if (data.sgstTotal > 0) lr("SGST", money(data.sgstTotal));
  if (data.igstTotal > 0) lr("IGST", money(data.igstTotal));
  rule();
  bold(true);
  size(1);
  const gt = `Rs ${money(data.grandTotal)}`;
  const half = Math.floor(W / 2);
  line("TOTAL" + " ".repeat(Math.max(1, half - 5 - gt.length)) + gt);
  size(0);
  bold(false);

  if (data.payments.length) {
    rule();
    for (const p of data.payments) lr(`Paid by ${p.method}`, money(p.amount));
  }

  rule();
  align(1);
  line("Thank you, visit again!");
  raw(0x0a, 0x0a, 0x0a);
  raw(GS, 0x56, 0x42, 0x00); // partial cut (ignored by printers without a cutter)

  return new Uint8Array(out);
}
