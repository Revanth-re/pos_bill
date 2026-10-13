/**
 * "Top items" on the Billing screen — products the OWNER picks, in the owner's order.
 * Saved on the business's default printer record (printer.config.topItems), like the bill
 * format, so every device shows the same list. Cached on the device for instant display.
 */
export type TopCount = 4 | 6 | 12;

export interface TopItems {
  count: TopCount;
  productIds: string[];
}

export const DEFAULT_TOP_ITEMS: TopItems = { count: 6, productIds: [] };

/** Cards per page on the Billing screen (6 fit on a phone screen). */
export const TOP_PAGE_SIZE = 6;

export function normalizeTopItems(raw: unknown): TopItems {
  if (!raw || typeof raw !== "object") return DEFAULT_TOP_ITEMS;
  const r = raw as Partial<TopItems>;
  const count: TopCount = r.count === 4 || r.count === 12 ? r.count : 6;
  const ids = Array.isArray(r.productIds) ? r.productIds.filter((x): x is string => typeof x === "string" && x.length <= 40) : [];
  return { count, productIds: Array.from(new Set(ids)).slice(0, 12) };
}

const CACHE_KEY = "billo-top-items";

export function getCachedTopItems(): TopItems {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? normalizeTopItems(JSON.parse(raw)) : DEFAULT_TOP_ITEMS;
  } catch {
    return DEFAULT_TOP_ITEMS;
  }
}

export function cacheTopItems(t: TopItems) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(t));
  } catch {
    /* ignore */
  }
}

export async function loadTopItems(): Promise<TopItems> {
  try {
    const res = await fetch("/api/settings/top-items", { cache: "no-store" });
    if (!res.ok) throw new Error();
    const t = normalizeTopItems((await res.json()).topItems);
    cacheTopItems(t);
    return t;
  } catch {
    return getCachedTopItems();
  }
}
