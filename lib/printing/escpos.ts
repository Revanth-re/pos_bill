import type { ReceiptData } from "./types";
import { DEFAULT_FORMAT, type BillFormat, type BillLogo } from "./billFormat";
import { billLabels } from "./billLabels";

/**
 * One layout, two outputs:
 *   buildReceiptRows() → rows (used by the on-screen preview)
 *   encodeRows()       → ESC/POS bytes for the Bluetooth thermal printer
 * so the preview is exactly what prints.
 *
 * Any language: English rows print as fast printer text. Rows with Telugu, Hindi,
 * Tamil… (which thermal printers have no font for) are drawn on the phone and
 * printed as a picture by a `RasterRenderer` (see ./rasterText.ts).
 */

export type Align = "left" | "center" | "right";
export interface Cell {
  text: string;
  /** Width in characters (all cells of a row add up to the paper width). */
  w: number;
  align?: "left" | "right";
}
export type Row =
  | { kind: "text"; text: string; align: Align; bold?: boolean; size?: 1 | 2 | 3; /** double height, normal width */ tall?: boolean }
  | { kind: "cols"; cells: Cell[]; bold?: boolean; tall?: boolean }
  | { kind: "image"; logo: BillLogo }
  | { kind: "rule"; ch: "-" | "=" }
  | { kind: "feed" }
  | { kind: "cut" };

/** A row drawn as a 1-bit picture: width in dots (multiple of 8), height, packed bits. */
export interface RasterImage {
  w: number;
  h: number;
  bits: Uint8Array;
}
export type RasterRenderer = (row: Extract<Row, { kind: "text" | "cols" }>, paperChars: number) => RasterImage | null;

export function paperWidth(paper: "58" | "80") {
  return paper === "58" ? 32 : 48;
}

/** Text the printer's built-in font can print (₹ → Rs). */
export function printable(s: string) {
  return s
    .replace(/₹/g, "Rs")
    .replace(/[–—·•]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\u00A0/g, " ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, ""); // é → e (Latin accents); Indian scripts are untouched
}

/** True when the printer's own font can print it (fast). Otherwise the row is printed as a picture. */
export function isAscii(s: string) {
  return /^[\x20-\x7E]*$/.test(printable(s));
}

/** Legacy helper (statements etc.): strips anything the printer font can't show. */
export function toAscii(s: string) {
  return printable(s).normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
}

/** Word-wrap by characters. Non-English text is wrapped later by the picture renderer (by real width). */
function wrap(s: string, width: number): string[] {
  if (!isAscii(s)) return [s.trim()];
  const words = printable(s).split(/\s+/).filter(Boolean);
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
  const L = billLabels(format.billLanguage);
  const rows: Row[] = [];
  const t = (text: string, align: Align = "left", bold = false, size: 1 | 2 | 3 = 1) =>
    rows.push({ kind: "text", text, align, bold, size });
  const rule = (ch: "-" | "=" = "-") => rows.push({ kind: "rule", ch });
  const lr = (left: string, right: string, opts: { bold?: boolean; tall?: boolean } = {}) => {
    const rw = Math.min(right.length, W - 1);
    rows.push({ kind: "cols", cells: [{ text: left, w: W - rw }, { text: right, w: rw, align: "right" }], ...opts });
  };

  // ---------- Customer bill ----------
  // ONE fixed layout for every template. Each on/off option only adds or removes
  // its own line — nothing else moves. Only the TOTAL is bold (and tall).
  if (format.showLogo && format.logo) rows.push({ kind: "image", logo: format.logo });
  for (const r of wrap(isAscii(data.businessName) ? data.businessName.toUpperCase() : data.businessName, W)) t(r, "center");
  if (format.showAddress && data.businessAddress) for (const r of wrap(data.businessAddress, W)) t(r, "center");
  if (format.showGstin && data.gstin) t(`GSTIN: ${data.gstin}`, "center");
  if (format.headerNote) for (const r of wrap(format.headerNote, W)) t(r, "center");
  if (data.copyLabel) t(`*** ${data.copyLabel} ***`, "center");
  rule();

  if (format.tokenSize !== "off" && data.tokenNumber) {
    t(`${L.token} ${data.tokenNumber}`, "center", false, format.tokenSize === "large" ? 3 : 2);
    rule();
  }

  lr(`${L.bill}: ${data.invoiceNumber}`, format.showOrderType ? (data.orderType === "DINE_IN" ? L.dineIn : L.takeaway) : "");
  t(data.createdAt);
  if (format.showCashier) t(`${L.cashier}: ${data.cashierName}`);
  if (format.showCustomer && data.customerName) t(`${L.customer}: ${data.customerName}`);
  rule();

  // Items: fixed columns. "Rate" column is the only thing the rate option adds.
  const QTY = 4, AMT = 9, RATE = format.showItemRate ? 8 : 0;
  const nameW = W - QTY - AMT - RATE;
  const itemCells = (name: string, qty: string, rate: string, amt: string): Cell[] => [
    { text: name, w: nameW },
    { text: qty, w: QTY, align: "right" },
    ...(RATE ? [{ text: rate, w: RATE, align: "right" as const }] : []),
    { text: amt, w: AMT, align: "right" },
  ];
  rows.push({ kind: "cols", cells: itemCells(L.item, L.qty, L.rate, L.amount) });
  for (const l of data.lines) {
    const name = l.localName || l.name; // "Name on bill" (shop's language) when the product has one
    const parts = isAscii(name) ? wrap(name, nameW - 1) : [name]; // non-English names wrap inside their column when drawn
    rows.push({ kind: "cols", cells: itemCells(parts[0], String(l.qty), money(l.unitPrice), money(l.total)) });
    for (const extra of parts.slice(1)) t(extra);
  }
  rule();

  const hasTax = data.cgstTotal + data.sgstTotal + data.igstTotal > 0;
  if (data.discountTotal > 0 || (format.showTaxBreakup && hasTax)) lr(L.subtotal, money(data.subtotal));
  if (data.discountTotal > 0) lr(L.discount, `-${money(data.discountTotal)}`);
  if (format.showTaxBreakup) {
    if (data.cgstTotal > 0) lr("CGST", money(data.cgstTotal));
    if (data.sgstTotal > 0) lr("SGST", money(data.sgstTotal));
    if (data.igstTotal > 0) lr("IGST", money(data.igstTotal));
  }
  // TOTAL: bold + double height, normal width → always fits the paper.
  lr(L.total, `Rs ${money(data.grandTotal)}`, { bold: true, tall: true });

  if (format.showPayment && data.payments.length) {
    for (const p of data.payments) lr(`${L.paidBy} ${L.methods[p.method] ?? p.method}`, money(p.amount));
  }
  rule();
  if (format.footerNote) for (const r of wrap(format.footerNote, W)) t(r, "center");
  rows.push({ kind: "feed" }, { kind: "cut" });

  // ---------- Kitchen slip ----------
  if (format.kitchenCopy) {
    const half = Math.floor(W / 2);
    t(L.kitchen, "center", true, 2);
    if (data.tokenNumber) t(String(data.tokenNumber), "center", true, 3);
    t(`${data.orderType === "DINE_IN" ? L.dineIn : L.takeaway}  ${data.createdAt}`, "center");
    rule("=");
    for (const l of data.lines) {
      const name = l.localName || l.name;
      for (const r of wrap(`${l.qty} x ${name}`, half)) t(r, "left", true, 2);
    }
    rule("=");
    rows.push({ kind: "feed" }, { kind: "cut" });
  }

  return rows;
}

/** A cols row as one fixed-width line (English only). */
export function colsToLine(cells: Cell[]): string {
  return cells
    .map((c) => {
      const s = printable(c.text).slice(0, c.w);
      return c.align === "right" ? s.padStart(c.w) : s.padEnd(c.w);
    })
    .join("");
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const ESC = 0x1b;
const GS = 0x1d;

function pushRaster(out: number[], w: number, h: number, bits: Uint8Array) {
  const wb = w / 8;
  out.push(ESC, 0x61, 1, GS, 0x76, 0x30, 0, wb & 0xff, (wb >> 8) & 0xff, h & 0xff, (h >> 8) & 0xff);
  for (let i = 0; i < wb * h; i++) out.push(bits[i] ?? 0);
}

/**
 * Rows → ESC/POS bytes. Rows that aren't plain English are drawn by `raster`
 * (on the phone); without a renderer (e.g. tests) they fall back to English-only text.
 */
export function encodeRows(rows: Row[], paperChars: number, raster?: RasterRenderer): Uint8Array {
  const out: number[] = [ESC, 0x40];
  for (const row of rows) {
    if (row.kind === "feed") out.push(0x0a, 0x0a, 0x0a);
    else if (row.kind === "cut") out.push(GS, 0x56, 0x42, 0x00);
    else if (row.kind === "image") {
      pushRaster(out, row.logo.w, row.logo.h, base64ToBytes(row.logo.bits));
      out.push(0x0a);
    } else if (row.kind === "rule") {
      out.push(ESC, 0x61, 0);
      for (const ch of row.ch.repeat(paperChars)) out.push(ch.charCodeAt(0));
      out.push(0x0a);
    } else {
      const text = row.kind === "text" ? row.text : row.cells.map((c) => c.text).join("");
      if (!isAscii(text) && raster) {
        const img = raster(row, paperChars);
        if (img) {
          pushRaster(out, img.w, img.h, img.bits);
          continue;
        }
      }
      const line = row.kind === "text" ? toAscii(row.text) : toAscii(colsToLine(row.cells));
      out.push(ESC, 0x61, row.kind === "text" && row.align === "center" ? 1 : row.kind === "text" && row.align === "right" ? 2 : 0);
      out.push(ESC, 0x45, row.bold ? 1 : 0);
      const sz = row.kind === "text" ? row.size ?? 1 : 1;
      out.push(GS, 0x21, row.tall ? 0x01 : sz === 1 ? 0x00 : sz === 2 ? 0x11 : 0x22);
      for (const ch of line) out.push(ch.charCodeAt(0));
      out.push(0x0a);
      out.push(GS, 0x21, 0x00, ESC, 0x45, 0);
    }
  }
  return new Uint8Array(out);
}

/** Full receipt → ESC/POS bytes. */
export function encodeReceipt(data: ReceiptData, format: BillFormat = DEFAULT_FORMAT, raster?: RasterRenderer): Uint8Array {
  return encodeRows(buildReceiptRows(data, format), paperWidth(format.paper), raster);
}

/** Any row list (e.g. a customer statement) → ESC/POS bytes at the given paper width. */
export function rowsToBytes(rows: Row[], paper: "58" | "80", raster?: RasterRenderer): Uint8Array {
  return encodeRows(rows, paperWidth(paper), raster);
}
