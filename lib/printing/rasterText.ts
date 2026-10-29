"use client";

import type { RasterImage, RasterRenderer, Row } from "./escpos";

/**
 * Draws a bill row (any language) with the phone's own fonts and converts it to a
 * 1-bit printer picture. Android/Windows/Mac all ship fonts for Indian scripts.
 * 12 printer dots = 1 character column (58mm = 384 dots / 32 chars, 80mm = 576 / 48).
 */
const DOTS_PER_CHAR = 12;
const FONT_FAMILY =
  '"Noto Sans Telugu","Noto Sans Devanagari","Noto Sans Tamil","Noto Sans Kannada","Noto Sans Malayalam","Noto Sans Bengali","Noto Sans Gujarati","Noto Sans Gurmukhi","Nirmala UI","Kohinoor Telugu","Kohinoor Devanagari",sans-serif';
const SIZES = { 1: { px: 22, lh: 30 }, 2: { px: 40, lh: 52 }, 3: { px: 56, lh: 70 } } as const;

let ctxCache: CanvasRenderingContext2D | null = null;
function ctx2d(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!ctxCache) ctxCache = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  return ctxCache;
}

function wrapByWidth(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

export const rasterRow: RasterRenderer = (row: Extract<Row, { kind: "text" | "cols" }>, paperChars: number): RasterImage | null => {
  const measure = ctx2d();
  if (!measure) return null;
  const W = paperChars * DOTS_PER_CHAR;
  const size = row.kind === "text" ? row.size ?? 1 : 1;
  const { px, lh } = SIZES[size];
  const font = `${row.bold ? "700" : "400"} ${px}px ${FONT_FAMILY}`;
  const scaleY = row.tall ? 2 : 1;
  measure.font = font;

  // Lay out: list of (text, x, align, maxWidth) per line.
  type Piece = { text: string; x: number; w: number; align: "left" | "center" | "right" };
  const lines: Piece[][] = [];
  if (row.kind === "text") {
    for (const l of wrapByWidth(measure, row.text, W)) lines.push([{ text: l, x: 0, w: W, align: row.align }]);
  } else {
    let x = 0;
    const cols = row.cells.map((c) => {
      const cw = c.w * DOTS_PER_CHAR;
      const pieces = c.w === 0 ? [""] : c.align === "right" ? [c.text] : wrapByWidth(measure, c.text, cw - 8);
      const col = { pieces, x, w: cw, align: (c.align ?? "left") as "left" | "right" };
      x += cw;
      return col;
    });
    const n = Math.max(...cols.map((c) => c.pieces.length));
    for (let i = 0; i < n; i++) lines.push(cols.filter((c) => c.pieces[i]).map((c) => ({ text: c.pieces[i], x: c.x, w: c.w, align: c.align })));
  }

  const H = lines.length * lh * scaleY;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#000";
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.scale(1, scaleY);
  lines.forEach((line, i) => {
    const y = i * lh + lh / 2;
    for (const p of line) {
      const tw = ctx.measureText(p.text).width;
      // Squeeze text that is still too wide (e.g. one very long word) instead of cutting it.
      const squeeze = tw > p.w ? p.w / tw : 1;
      const drawW = tw * squeeze;
      const x = p.align === "right" ? p.x + p.w - drawW : p.align === "center" ? p.x + (p.w - drawW) / 2 : p.x;
      ctx.save();
      ctx.translate(x, 0);
      ctx.scale(squeeze, 1);
      ctx.fillText(p.text, 0, y);
      ctx.restore();
    }
  });

  // 1-bit pack (black where the pixel is dark).
  const { data } = ctx.getImageData(0, 0, W, H);
  const wb = W / 8;
  const full = new Uint8Array(wb * H);
  let top = H, bottom = -1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (data[(y * W + x) * 4] < 140) {
        full[y * wb + (x >> 3)] |= 0x80 >> (x & 7);
        if (y < top) top = y;
        bottom = y;
      }
  // Trim empty rows above/below the text (keeps a small gap) → fewer bytes → faster printing.
  if (bottom < 0) return { w: W, h: 8, bits: new Uint8Array(wb * 8) };
  const pad = 3;
  const y0 = Math.max(0, top - pad), y1 = Math.min(H, bottom + 1 + pad);
  return { w: W, h: y1 - y0, bits: full.slice(y0 * wb, y1 * wb) };
};
