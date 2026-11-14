"use client";

import { getAllOfflineBills, deleteOfflineBill } from "@/lib/offline/db";
import { syncOfflineBills } from "@/lib/offline/sync";

/**
 * One phone, many logins (owner, cashier, kitchen…). Saved data from one login must never
 * show up for the next: menu, cart, sales, bill settings, cached screens.
 */
const LAST_ACCOUNT_KEY = "billo-last-account"; // `${userId}:${businessId}`
const PAGE_CACHE = "billo-pages-v1"; // keep in sync with public/sw.js
/** Per-device preferences that are not account data — kept. */
const KEEP = new Set<string>([LAST_ACCOUNT_KEY, "billo-kitchen-lang"]);

/** Bills made offline that haven't reached the server yet. */
export async function unsyncedBillCount(): Promise<number> {
  try {
    return (await getAllOfflineBills()).filter((b) => b.status !== "SYNCED").length;
  } catch {
    return 0;
  }
}

/** Try to upload offline bills while the current login is still active. */
export async function trySyncBeforeLogout(): Promise<number> {
  try {
    if (navigator.onLine) await syncOfflineBills();
  } catch {
    /* offline */
  }
  return unsyncedBillCount();
}

/**
 * Remove everything this login saved on the phone.
 * `dropOfflineBills`: also delete bills that never synced (only after the user agreed,
 * or when a different shop logs in — those bills can't be uploaded to the wrong shop).
 */
export async function clearDeviceData({ dropOfflineBills = false } = {}) {
  try {
    for (const k of Object.keys(localStorage)) {
      if (KEEP.has(k)) continue;
      if (k.startsWith("billo-") || k.startsWith("pos-")) localStorage.removeItem(k);
    }
  } catch {
    /* private mode */
  }
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
  try {
    navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_PAGES" });
    if ("caches" in window) await caches.delete(PAGE_CACHE);
  } catch {
    /* ignore */
  }
  if (dropOfflineBills) {
    try {
      for (const b of await getAllOfflineBills()) await deleteOfflineBill(b.clientId);
    } catch {
      /* ignore */
    }
  } else {
    // Synced ones are just history — remove them.
    try {
      for (const b of await getAllOfflineBills()) if (b.status === "SYNCED") await deleteOfflineBill(b.clientId);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Call right after a successful login. If a DIFFERENT account used this phone before,
 * wipe its saved data first. Same person logging in again keeps their cache (fast start).
 */
export async function onLoginSwitchAccount(): Promise<void> {
  try {
    const s = await fetch("/api/auth/session", { cache: "no-store" }).then((r) => r.json());
    const u = s?.user as { id?: string; businessId?: string } | undefined;
    if (!u?.id) return;
    const now = `${u.id}:${u.businessId ?? ""}`;
    let before: string | null = null;
    try {
      before = localStorage.getItem(LAST_ACCOUNT_KEY);
    } catch {
      /* ignore */
    }
    if (before !== now) {
      const sameShop = !!before && before.split(":")[1] === (u.businessId ?? "");
      // Unsynced bills of the same shop are still uploaded by the next login; another shop's can't be.
      await clearDeviceData({ dropOfflineBills: !!before && !sameShop });
    }
    try {
      localStorage.setItem(LAST_ACCOUNT_KEY, now);
    } catch {
      /* ignore */
    }
  } catch {
    /* never block login */
  }
}

/** Full logout used by every logout button. */
export async function logoutEverywhere(signOut: (o: { redirect: false }) => Promise<unknown>) {
  const left = await trySyncBeforeLogout();
  if (left > 0) {
    const ok = window.confirm(
      `${left} bill(s) made offline are not uploaded yet. Connect to the internet and they upload automatically.\n\nLog out anyway and delete them from this phone?`
    );
    if (!ok) return false;
  }
  await clearDeviceData({ dropOfflineBills: true });
  try {
    localStorage.removeItem(LAST_ACCOUNT_KEY);
  } catch {
    /* ignore */
  }
  await signOut({ redirect: false });
  window.location.replace("/login");
  return true;
}
