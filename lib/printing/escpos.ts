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

/** Full printer width in characters (Font A, 12 dots each): 58mm = 32, 80mm = 48. */
export function paperWidth(paper: "58" | "80", charsPerLine = 0) {
  const std = paper === "58" ? 32 : 48;
  return charsPerLine > 0 && charsPerLine <= std ? charsPerLine : std;
}

/**
 * Characters we actually use per line = one less than the full width.
 * A line that exactly fills the paper makes many cheap printers wrap and then add an
 * EMPTY line on the newline — that caused broken columns and big blank gaps.
 */
export function lineChars(paper: "58" | "80", charsPerLine = 0) {
  return paperWidth(paper, charsPerLine) - 1;
}

/** "Width test": a numbered ruler so the shop can see how many characters their printer fits. */
export function widthTestBytes(paper: "58" | "80"): Uint8Array {
  const max = paper === "58" ? 32 : 48;
  const out: number[] = [ESC, 0x40, ESC, 0x61, 0];
  const line = (s: string) => {
    for (const ch of s) out.push(ch.charCodeAt(0));
    out.push(0x0a);
  };
  line("BILLO WIDTH TEST");
  line("Find the LAST number that fits");
  line("fully on ONE line:");
  let tens = "", ones = "";
  for (let i = 1; i <= max; i++) {
    tens += i % 10 === 0 ? String(i / 10) : " ";
    ones += String(i % 10);
  }
  // Without a newline the printer wraps by itself, which shows exactly where the line ends.
  for (const ch of tens) out.push(ch.charCodeAt(0));
  out.push(0x0a);
  for (const ch of ones) out.push(ch.charCodeAt(0));
  out.push(0x0a);
  line("-".repeat(max));
  out.push(ESC, 0x4a, 80, GS, 0x56, 0x42, 0x00);
  return new Uint8Array(out);
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
/** Item rate: "30" instead of "30.00" when it's a whole number — keeps the rate column narrow. */
const rateStr = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
/** "07/10/2026, 8:15 am" → "07/10/26 8:15 am" (same info, fits beside other details). */
const shortDate = (s: string) => s.replace(/^(\d{1,2})\/(\d{1,2})\/\d{2}(\d{2}),?\s*/, "$1/$2/$3 ");

export function buildReceiptRows(data: ReceiptData, format: BillFormat = DEFAULT_FORMAT): Row[] {
  const W = lineChars(format.paper, format.charsPerLine);
  const L = billLabels(format.billLanguage);
  const rows: Row[] = [];
  const t = (text: string, align: Align = "left", bold = false, size: 1 | 2 | 3 = 1) =>
    rows.push({ kind: "text", text, align, bold, size });
  const rule = (ch: "-" | "=" = "-") => rows.push({ kind: "rule", ch });
  const lr = (left: string, right: string, opts: { bold?: boolean; tall?: boolean } = {}) => {
    if (!right) {
      rows.push({ kind: "cols", cells: [{ text: left, w: W }], ...opts });
      return;
    }
    const r = ` ${right}`; // leading space = left text can never touch the right text
    const rw = Math.min(r.length, W - 4);
    rows.push({ kind: "cols", cells: [{ text: left, w: W - rw }, { text: r, w: rw, align: "right" }], ...opts });
  };
  /** Two short facts on one line when they fit (saves paper), otherwise one per line. */
  const pair = (left: string, right: string) => {
    if (!right) return t(left);
    if (!left) return t(right, "right");
    if (isAscii(left + right) && printable(left).length + printable(right).length + 2 <= W) lr(left, right);
    else {
      t(left);
      t(right);
    }
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
    t(`${L.token} ${data.tokenNumber}`, "center", true, format.tokenSize === "large" ? 3 : 2);
  }

  // Bill details packed two per line when they fit (saves paper); each on its own line otherwise.
  const facts = [
    `${L.bill}: ${data.invoiceNumber}`,
    format.showOrderType ? (data.orderType === "DINE_IN" ? L.dineIn : L.takeaway) : "",
    shortDate(data.createdAt),
    format.showCashier && data.cashierName ? `${L.cashier}: ${data.cashierName}` : "",
  ].filter(Boolean);
  for (let i = 0; i < facts.length; i++) {
    const a = facts[i], b = facts[i + 1];
    if (b && isAscii(a + b) && printable(a).length + printable(b).length + 2 <= W) {
      pair(a, b);
      i++;
    } else t(a);
  }
  if (format.showCustomer && data.customerName) t(`${L.customer}: ${data.customerName}`);
  rule();

  // Items: columns sized to the real numbers on this bill (plus a 1-space gap), so the item
  // name gets every spare character. "Rate" column is the only thing the rate option adds.
  const colW = (label: string, values: string[], min: number) =>
    Math.max(min, ...values.map((v) => v.length), isAscii(label) ? printable(label).length : 0) + 1;
  const QTY = colW(L.qty, data.lines.map((l) => String(l.qty)), 2);
  const AMT = colW(L.amount, data.lines.map((l) => money(l.total)), 4);
  const RATE = format.showItemRate ? colW(L.rate, data.lines.map((l) => rateStr(l.unitPrice)), 3) : 0;
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
    rows.push({ kind: "cols", cells: itemCells(parts[0], String(l.qty), rateStr(l.unitPrice), money(l.total)) });
    for (const extra of parts.slice(1)) t(` ${extra}`); // name continues, indented
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
    t(L.kitchen, "center", true, 2);
    if (data.tokenNumber) t(String(data.tokenNumber), "center", true, 3);
    t(`${data.orderType === "DINE_IN" ? L.dineIn : L.takeaway} - ${shortDate(data.createdAt)}`, "center");
    rule("=");
    for (const l of data.lines) {
      const name = l.localName || l.name;
      // Double height, normal width: big and easy to read, but uses the full line (no extra wrapping).
      for (const r of wrap(`${l.qty} x ${name}`, W)) rows.push({ kind: "text", text: r, align: "left", bold: true, tall: true });
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
      const s = toAscii(c.text).slice(0, c.w);
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
  const lineW = paperChars - 1; // see lineChars()
  // ESC @ reset, then tighter line spacing (26 dots instead of ~30) → about 12% less paper, same text size.
  const out: number[] = [ESC, 0x40, ESC, 0x33, 26];
  for (const row of rows) {
    if (row.kind === "feed") out.push(ESC, 0x4a, 80); // feed ~10mm so the bill clears the tear bar
    else if (row.kind === "cut") out.push(GS, 0x56, 0x42, 0x00);
    else if (row.kind === "image") {
      // GS v 0 already moves the paper by the image height — no extra blank line after the logo.
      pushRaster(out, row.logo.w, row.logo.h, base64ToBytes(row.logo.bits));
    } else if (row.kind === "rule") {
      // Divider lines are drawn as a thin picture, not as "-----" letters: a picture never
      // wraps onto a second line (letters did on some printers and broke the whole bill),
      // and it is much shorter — saves paper.
      const w = Math.floor((lineW * 12) / 8) * 8;
      const h = 8;
      const bits = new Uint8Array((w / 8) * h);
      const ys = row.ch === "=" ? [2, 5] : [3, 4];
      for (const y of ys) for (let x = 0; x < w; x++) if (row.ch === "=" || x % 8 < 5) bits[y * (w / 8) + (x >> 3)] |= 0x80 >> (x & 7);
      pushRaster(out, w, h, bits);
    } else {
      const text = row.kind === "text" ? row.text : row.cells.map((c) => c.text).join("");
      if (!isAscii(text) && raster) {
        const img = raster(row, paperChars);
        if (img) {
          pushRaster(out, img.w, img.h, img.bits);
          continue;
        }
      }
      const sz = row.kind === "text" ? row.size ?? 1 : 1;
      // Never send more characters than fit on one line (double/triple width counts 2×/3×).
      const max = Math.floor(lineW / sz);
      const line = (row.kind === "text" ? toAscii(row.text) : colsToLine(row.cells)).replace(/\s+$/, "").slice(0, max);
      out.push(ESC, 0x61, row.kind === "text" && row.align === "center" ? 1 : row.kind === "text" && row.align === "right" ? 2 : 0);
      out.push(ESC, 0x45, row.bold ? 1 : 0);
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
  return encodeRows(buildReceiptRows(data, format), paperWidth(format.paper, format.charsPerLine), raster);
}

/** Any row list (e.g. a customer statement) → ESC/POS bytes at the given paper width. */
export function rowsToBytes(rows: Row[], paper: "58" | "80", raster?: RasterRenderer, charsPerLine = 0): Uint8Array {
  return encodeRows(rows, paperWidth(paper, charsPerLine), raster);
}
