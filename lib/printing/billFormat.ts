/**
 * Bill formats: ready-made templates + per-business options.
 * Saved on the business's default printer record (printer.config.billFormat),
 * so every cashier phone prints the same bill. Cached on the device so
 * printing still works offline.
 */

export type TemplateId = "classic" | "token" | "gst" | "compact" | "kitchen" | "logo";

/** Shop logo, already converted to a 1-bit thermal-printer bitmap. */
export interface BillLogo {
  /** Width in printer dots (multiple of 8). */
  w: number;
  /** Height in printer dots. */
  h: number;
  /** Row-major 1-bit pixels (1 = black), base64. */
  bits: string;
  /** Same bitmap as a PNG data URL, for previews. */
  preview: string;
}

export interface BillFormat {
  template: TemplateId;
  paper: "58" | "80";
  tokenSize: "off" | "normal" | "large";
  showAddress: boolean;
  showGstin: boolean;
  showCashier: boolean;
  showCustomer: boolean;
  showOrderType: boolean;
  showItemRate: boolean;
  showTaxBreakup: boolean;
  showPayment: boolean;
  kitchenCopy: boolean;
  showLogo: boolean;
  logo: BillLogo | null;
  /** Language of the words printed on the bill (Bill, Item, Total…). "en" = English. */
  billLanguage: string;
  headerNote: string;
  footerNote: string;
}

type Preset = Omit<BillFormat, "template" | "paper" | "headerNote" | "footerNote" | "logo" | "showLogo" | "billLanguage"> & { showLogo?: boolean };

export const TEMPLATES: { id: TemplateId; name: string; description: string; preset: Preset }[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Everyday bill with token, items and payment",
    preset: { tokenSize: "normal", showAddress: true, showGstin: false, showCashier: true, showCustomer: true, showOrderType: true, showItemRate: true, showTaxBreakup: false, showPayment: true, kitchenCopy: false },
  },
  {
    id: "token",
    name: "Quick Token",
    description: "Huge token number, short bill — tiffin & fast food",
    preset: { tokenSize: "large", showAddress: false, showGstin: false, showCashier: false, showCustomer: false, showOrderType: false, showItemRate: false, showTaxBreakup: false, showPayment: true, kitchenCopy: false },
  },
  {
    id: "gst",
    name: "GST Invoice",
    description: "GSTIN, rates and CGST/SGST break-up",
    preset: { tokenSize: "normal", showAddress: true, showGstin: true, showCashier: true, showCustomer: true, showOrderType: true, showItemRate: true, showTaxBreakup: true, showPayment: true, kitchenCopy: false },
  },
  {
    id: "compact",
    name: "Paper Saver",
    description: "Shortest bill — saves thermal roll",
    preset: { tokenSize: "normal", showAddress: false, showGstin: false, showCashier: false, showCustomer: false, showOrderType: false, showItemRate: false, showTaxBreakup: false, showPayment: false, kitchenCopy: false },
  },
  {
    id: "kitchen",
    name: "Bill + Kitchen Slip",
    description: "Customer bill, then a separate kitchen token slip",
    preset: { tokenSize: "large", showAddress: false, showGstin: false, showCashier: true, showCustomer: false, showOrderType: true, showItemRate: false, showTaxBreakup: false, showPayment: true, kitchenCopy: true },
  },
  {
    id: "logo",
    name: "Logo Bill",
    description: "Your shop logo on top, short clean bill",
    preset: { tokenSize: "normal", showAddress: true, showGstin: false, showCashier: false, showCustomer: false, showOrderType: true, showItemRate: false, showTaxBreakup: false, showPayment: true, kitchenCopy: false, showLogo: true },
  },
];

export const DEFAULT_FORMAT: BillFormat = {
  template: "classic",
  paper: "58",
  headerNote: "",
  footerNote: "Thank you, visit again!",
  showLogo: true,
  logo: null,
  billLanguage: "en",
  ...TEMPLATES[0].preset,
};

export function applyTemplate(current: BillFormat, id: TemplateId): BillFormat {
  // Logo choice is kept across templates (logo works on every format); "Logo Bill" turns it on.
  const t = TEMPLATES.find((x) => x.id === id) ?? TEMPLATES[0];
  const { showLogo, ...rest } = t.preset;
  return { ...current, ...rest, showLogo: showLogo ?? current.showLogo, template: id };
}

export function normalizeFormat(raw: unknown): BillFormat {
  if (!raw || typeof raw !== "object") return DEFAULT_FORMAT;
  const r = raw as Partial<BillFormat>;
  const out = { ...DEFAULT_FORMAT };
  for (const k of Object.keys(DEFAULT_FORMAT) as (keyof BillFormat)[]) {
    if (k === "logo") continue;
    if (r[k] !== undefined && typeof r[k] === typeof DEFAULT_FORMAT[k]) (out as Record<string, unknown>)[k] = r[k];
  }
  if (!TEMPLATES.some((t) => t.id === out.template)) out.template = "classic";
  out.logo = normalizeLogo(r.logo);
  if (!/^(en|hi|te|ta|kn|ml|mr|bn|gu|pa)$/.test(out.billLanguage)) out.billLanguage = "en";
  out.headerNote = out.headerNote.slice(0, 120);
  out.footerNote = out.footerNote.slice(0, 120);
  return out;
}

function normalizeLogo(raw: unknown): BillLogo | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Partial<BillLogo>;
  const ok =
    typeof l.w === "number" && typeof l.h === "number" && l.w > 0 && l.w <= 576 && l.w % 8 === 0 && l.h > 0 && l.h <= 240 &&
    typeof l.bits === "string" && l.bits.length <= 30_000 &&
    typeof l.preview === "string" && l.preview.startsWith("data:image/png;base64,") && l.preview.length <= 80_000;
  return ok ? { w: l.w!, h: l.h!, bits: l.bits!, preview: l.preview! } : null;
}

const CACHE_KEY = "billo-bill-format";

export function getCachedBillFormat(): BillFormat {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? normalizeFormat(JSON.parse(raw)) : DEFAULT_FORMAT;
  } catch {
    return DEFAULT_FORMAT;
  }
}

export function cacheBillFormat(f: BillFormat) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(f));
  } catch {
    /* ignore */
  }
}

/** Fetches the business's format (falls back to the cached copy offline). */
export async function loadBillFormat(): Promise<BillFormat> {
  try {
    const res = await fetch("/api/printers/format");
    if (!res.ok) throw new Error();
    const f = normalizeFormat((await res.json()).format);
    cacheBillFormat(f);
    return f;
  } catch {
    return getCachedBillFormat();
  }
}
