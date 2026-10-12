"use client";

import type { BillLogo } from "./billFormat";

/** Logo size on the bill, in printer dots (8 dots = 1 mm). Small, so bills stay short. */
const MAX_W = 256; // 32 mm — fits 58 mm and 80 mm paper
const MAX_H = 112; // 14 mm tall

/**
 * Converts a shop logo / hotel photo into a black-and-white thermal-printer bitmap.
 * Transparent areas become white; photos are dithered so they still look good.
 */
export async function imageFileToLogo(file: File): Promise<BillLogo> {
  const img = await loadImage(file);
  const scale = Math.min(MAX_W / img.width, MAX_H / img.height, 1);
  const w = Math.max(8, Math.round((img.width * scale) / 8) * 8);
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  // Grayscale, with a little contrast boost.
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const g = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    gray[i] = Math.min(255, Math.max(0, (g - 128) * 1.2 + 128));
  }

  // Atkinson dithering — crisp for text logos, fine for photos.
  const black = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const old = gray[i];
      const val = old < 128 ? 0 : 255;
      black[i] = val === 0 ? 1 : 0;
      const err = (old - val) / 8;
      const spread = [
        [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2],
      ];
      for (const [dx, dy] of spread) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < w && ny < h) gray[ny * w + nx] += err;
      }
    }
  }

  // Pack to 1 bit per pixel (MSB first) for ESC/POS raster.
  const wb = w / 8;
  const packed = new Uint8Array(wb * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (black[y * w + x]) packed[y * wb + (x >> 3)] |= 0x80 >> (x & 7);

  // Preview PNG of exactly what will print.
  const out = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const v = black[i] ? 0 : 255;
    out.data[i * 4] = out.data[i * 4 + 1] = out.data[i * 4 + 2] = v;
    out.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);

  let bin = "";
  for (let i = 0; i < packed.length; i++) bin += String.fromCharCode(packed[i]);
  return { w, h, bits: btoa(bin), preview: canvas.toDataURL("image/png") };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read this image. Try a JPG or PNG."));
    };
    img.src = url;
  });
}
