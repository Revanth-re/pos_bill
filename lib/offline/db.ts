"use client";

/**
 * Minimal IndexedDB wrapper for offline billing. No external dependency
 * (idb, dexie) so it stays tiny inside the service worker/PWA bundle.
 * Store: "offline_bills" — one record per bill created while offline,
 * keyed by a client-generated UUID (clientId) so retried syncs are
 * idempotent (see checkout API's `clientId` handling).
 */

const DB_NAME = "pos_offline_db";
const DB_VERSION = 1;
const STORE = "offline_bills";

export interface OfflineBillRecord {
  clientId: string;
  payload: unknown; // matches CheckoutInput shape
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  createdAt: string;
  error?: string;
  attempts: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "clientId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveOfflineBill(record: OfflineBillRecord): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllOfflineBills(): Promise<OfflineBillRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as OfflineBillRecord[]);
    req.onerror = () => reject(req.error);
  });
}

export async function updateOfflineBillStatus(
  clientId: string,
  status: OfflineBillRecord["status"],
  error?: string
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const getReq = store.get(clientId);
    getReq.onsuccess = () => {
      const record = getReq.result as OfflineBillRecord | undefined;
      if (record) {
        record.status = status;
        record.error = error;
        if (status === "FAILED") record.attempts += 1;
        store.put(record);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteOfflineBill(clientId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(clientId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
