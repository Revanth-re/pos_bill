/**
 * Bill formats: ready-made templates + per-business options.
 * Saved on the business's default printer record (printer.config.billFormat),
 * so every cashier phone prints the same bill. Cached on the device so
 * printing still works offline.
 */

export type TemplateId = "classic" | "token" | "gst" | "compact" | "kitchen";

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
  headerNote: string;
  footerNote: string;
}

export const TEMPLATES: { id: TemplateId; name: string; description: string; preset: Omit<BillFormat, "template" | "paper" | "headerNote" | "footerNote"> }[] = [
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
];

export const DEFAULT_FORMAT: BillFormat = {
  template: "classic",
  paper: "58",
  headerNote: "",
  footerNote: "Thank you, visit again!",
  ...TEMPLATES[0].preset,
};

export function applyTemplate(current: BillFormat, id: TemplateId): BillFormat {
  const t = TEMPLATES.find((x) => x.id === id) ?? TEMPLATES[0];
  return { ...current, ...t.preset, template: id };
}

export function normalizeFormat(raw: unknown): BillFormat {
  if (!raw || typeof raw !== "object") return DEFAULT_FORMAT;
  const r = raw as Partial<BillFormat>;
  const out = { ...DEFAULT_FORMAT };
  for (const k of Object.keys(DEFAULT_FORMAT) as (keyof BillFormat)[]) {
    if (r[k] !== undefined && typeof r[k] === typeof DEFAULT_FORMAT[k]) (out as Record<string, unknown>)[k] = r[k];
  }
  out.headerNote = out.headerNote.slice(0, 120);
  out.footerNote = out.footerNote.slice(0, 120);
  return out;
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
