import type { ReceiptData } from "./types";
import { DEFAULT_FORMAT, type BillFormat, type BillLogo } from "./billFormat";

/**
 * One layout, two outputs:
 *   buildReceiptRows() → rows (used by the on-screen preview)
 *   encodeRows()       → raw ESC/POS bytes for the Bluetooth thermal printer
 * so the preview is exactly what prints. ASCII only (thermal fonts lack ₹).
 */

export type Align = "left" | "center";
export type Row =
  | { kind: "text"; text: string; align: Align; bold?: boolean; size?: 1 | 2 | 3; /** double height, normal width */ tall?: boolean }
  | { kind: "image"; logo: BillLogo }
  | { kind: "rule"; ch: "-" | "=" }
  | { kind: "feed" }
  | { kind: "cut" };

export function paperWidth(paper: "58" | "80") {
  return paper === "58" ? 32 : 48;
}

export function toAscii(s: string) {
  return s
    .replace(/₹/g, "Rs")
    .replace(/[–—]/g, "-")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "");
}

function wrap(s: string, width: number): string[] {
  const words = toAscii(s).split(/\s+/).filter(Boolean);
  const rows: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > width) {
      if (cur) rows.push(cur);
      cur = w.slice(0, width);
    } else cur = next;
  }
  if (cur) rows.push(cur);
  return rows.length ? rows : [""];
}

const money = (n: number) => n.toFixed(2);

export function buildReceiptRows(data: ReceiptData, format: BillFormat = DEFAULT_FORMAT): Row[] {
  const W = paperWidth(format.paper);
  const rows: Row[] = [];
  const t = (text: string, align: Align = "left", bold = false, size: 1 | 2 | 3 = 1) =>
    rows.push({ kind: "text", text: toAscii(text), align, bold, size });
  const rule = (ch: "-" | "=" = "-") => rows.push({ kind: "rule", ch });
  const lr = (left: string, right: string, bold = false) => {
    const l = toAscii(left);
    const r = toAscii(right);
    if (l.length + r.length + 1 > W) {
      t(l.slice(0, W), "left", bold);
      t(" ".repeat(Math.max(0, W - r.length)) + r, "left", bold);
    } else t(l + " ".repeat(W - l.length - r.length) + r, "left", bold);
  };

  // ---------- Customer bill ----------
  // ONE fixed layout for every template. Each on/off option only adds or removes
  // its own line — nothing else moves. Only the TOTAL is bold (and tall).
  if (format.showLogo && format.logo) rows.push({ kind: "image", logo: format.logo });
  for (const r of wrap(data.businessName.toUpperCase(), W)) t(r, "center");
  if (format.showAddress && data.businessAddress) for (const r of wrap(data.businessAddress, W)) t(r, "center");
  if (format.showGstin && data.gstin) t(`GSTIN: ${data.gstin}`, "center");
  if (format.headerNote) for (const r of wrap(format.headerNote, W)) t(r, "center");
  if (data.copyLabel) t(`*** ${data.copyLabel} ***`, "center");
  rule();

  if (format.tokenSize !== "off" && data.tokenNumber) {
    t(`TOKEN ${data.tokenNumber}`, "center", false, format.tokenSize === "large" ? 3 : 2);
    rule();
  }

  lr(`Bill: ${data.invoiceNumber}`, format.showOrderType ? (data.orderType === "DINE_IN" ? "Dine-in" : "Takeaway") : "");
  t(data.createdAt);
  if (format.showCashier) t(`Cashier: ${data.cashierName}`);
  if (format.showCustomer && data.customerName) t(`Customer: ${data.customerName}`);
  rule();

  // Items: fixed columns. "Rate" column is the only thing the rate option adds.
  const QTY = 3, AMT = 8, RATE = format.showItemRate ? 7 : 0;
  const nameW = W - QTY - AMT - (RATE ? RATE + 1 : 0) - 2;
  const itemRow = (name: string, qty: string, rate: string, amt: string) =>
    name.padEnd(nameW) + " " + qty.padStart(QTY) + (RATE ? " " + rate.padStart(RATE) : "") + " " + amt.padStart(AMT);
  t(itemRow("Item", "Qty", "Rate", "Amount"));
  for (const l of data.lines) {
    const parts = wrap(toAscii(l.name), nameW);
    t(itemRow(parts[0], String(l.qty), money(l.unitPrice), money(l.total)));
    for (const extra of parts.slice(1)) t(extra);
  }
  rule();

  const hasTax = data.cgstTotal + data.sgstTotal + data.igstTotal > 0;
  if (data.discountTotal > 0 || (format.showTaxBreakup && hasTax)) lr("Subtotal", money(data.subtotal));
  if (data.discountTotal > 0) lr("Discount", `-${money(data.discountTotal)}`);
  if (format.showTaxBreakup) {
    if (data.cgstTotal > 0) lr("CGST", money(data.cgstTotal));
    if (data.sgstTotal > 0) lr("SGST", money(data.sgstTotal));
    if (data.igstTotal > 0) lr("IGST", money(data.igstTotal));
  }
  // TOTAL: bold + double height, normal width → always fits the paper.
  const gt = `Rs ${money(data.grandTotal)}`;
  rows.push({ kind: "text", text: "TOTAL" + " ".repeat(Math.max(1, W - 5 - gt.length)) + gt, align: "left", bold: true, tall: true });

  if (format.showPayment && data.payments.length) {
    for (const p of data.payments) lr(`Paid by ${p.method}`, money(p.amount));
  }
  rule();
  if (format.footerNote) for (const r of wrap(format.footerNote, W)) t(r, "center");
  rows.push({ kind: "feed" }, { kind: "cut" });

  // ---------- Kitchen slip ----------
  if (format.kitchenCopy) {
    const half = Math.floor(W / 2);
    t("KITCHEN", "center", true, 2);
    if (data.tokenNumber) t(String(data.tokenNumber), "center", true, 3);
    t(`${data.orderType === "DINE_IN" ? "Dine-in" : "Takeaway"}  ${data.createdAt}`, "center");
    rule("=");
    for (const l of data.lines) for (const r of wrap(`${l.qty} x ${l.name}`, half)) t(r, "left", true, 2);
    rule("=");
    rows.push({ kind: "feed" }, { kind: "cut" });
  }

  return rows;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const ESC = 0x1b;
const GS = 0x1d;

export function encodeRows(rows: Row[]): Uint8Array {
  const out: number[] = [ESC, 0x40];
  for (const row of rows) {
    if (row.kind === "rule") continue; // encodeReceipt() expands rules to the paper width first
    if (row.kind === "feed") out.push(0x0a, 0x0a, 0x0a);
    if (row.kind === "image") {
      // GS v 0 — raster bit image, centred.
      const { w, h } = row.logo;
      const bytes = base64ToBytes(row.logo.bits);
      const wb = w / 8;
      out.push(ESC, 0x61, 1, GS, 0x76, 0x30, 0, wb & 0xff, (wb >> 8) & 0xff, h & 0xff, (h >> 8) & 0xff);
      for (let i = 0; i < wb * h; i++) out.push(bytes[i] ?? 0);
      out.push(0x0a);
    }
    if (row.kind === "cut") out.push(GS, 0x56, 0x42, 0x00);
    if (row.kind === "text") {
      out.push(ESC, 0x61, row.align === "center" ? 1 : 0);
      out.push(ESC, 0x45, row.bold ? 1 : 0);
      const sz = row.size ?? 1;
      out.push(GS, 0x21, row.tall ? 0x01 : sz === 1 ? 0x00 : sz === 2 ? 0x11 : 0x22);
      for (const ch of row.text) out.push(ch.charCodeAt(0));
      out.push(0x0a);
      out.push(GS, 0x21, 0x00, ESC, 0x45, 0);
    }
  }
  return new Uint8Array(out);
}

/** Full receipt → ESC/POS bytes. */
export function encodeReceipt(data: ReceiptData, format: BillFormat = DEFAULT_FORMAT): Uint8Array {
  const W = paperWidth(format.paper);
  const rows = buildReceiptRows(data, format).map<Row>((r) =>
    r.kind === "rule" ? { kind: "text", text: r.ch.repeat(W), align: "left" } : r
  );
  return encodeRows(rows);
}

/** Any row list (e.g. a customer statement) → ESC/POS bytes at the given paper width. */
export function rowsToBytes(rows: Row[], paper: "58" | "80"): Uint8Array {
  const W = paperWidth(paper);
  return encodeRows(rows.map<Row>((r) => (r.kind === "rule" ? { kind: "text", text: r.ch.repeat(W), align: "left" } : r)));
}
