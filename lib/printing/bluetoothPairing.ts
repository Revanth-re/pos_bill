"use client";

/**
 * Bluetooth thermal-printer connection manager (Web Bluetooth / BLE).
 *
 * - First time: our own clean "Connect printer" screen → browser device picker
 *   (filtered to printers) → connect → remembered on this device.
 * - After that: reconnects silently (no picker) and prints raw ESC/POS bytes
 *   straight to the printer. No print dialog, no PDF.
 *
 * Note: the device picker itself is drawn by the browser and cannot be styled
 * by any website — we keep it short by filtering to printer-like devices.
 */

export interface PairedBluetoothDevice {
  id: string;
  name: string;
}

export type PrinterStatus = "unsupported" | "bluetooth-off" | "not-paired" | "disconnected" | "connecting" | "connected";

/* Minimal Web Bluetooth typings (lib.dom doesn't ship them). */
interface BTCharacteristic {
  properties: { write: boolean; writeWithoutResponse: boolean };
  writeValueWithoutResponse?: (v: BufferSource) => Promise<void>;
  writeValueWithResponse?: (v: BufferSource) => Promise<void>;
  writeValue: (v: BufferSource) => Promise<void>;
}
interface BTService {
  getCharacteristics: () => Promise<BTCharacteristic[]>;
}
interface BTServer {
  connected: boolean;
  connect: () => Promise<BTServer>;
  getPrimaryServices: () => Promise<BTService[]>;
}
interface BTDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BTServer;
  watchAdvertisements?: (opts?: { signal?: AbortSignal }) => Promise<void>;
}
interface BTNavigator {
  bluetooth: {
    getAvailability?: () => Promise<boolean>;
    getDevices?: () => Promise<BTDevice[]>;
    requestDevice: (opts: unknown) => Promise<BTDevice>;
  };
}

// Service UUIDs used by common BLE thermal printers (Xprinter, GOOJPRT, MTP, Rongta, Epson TM-P, generic "BlueTooth Printer"…).
const PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000ae30-0000-1000-8000-00805f9b34fb",
  "0000fee7-0000-1000-8000-00805f9b34fb",
  "0000af30-0000-1000-8000-00805f9b34fb",
];
const PRINTER_NAME_PREFIXES = ["Printer", "PRINTER", "BlueTooth", "Bluetooth", "BT", "MPT", "MTP", "PT-", "RPP", "XP-", "POS", "GOOJPRT", "Inner", "TM-", "PL", "MP", "HM-", "QS", "Thermal", "58", "80"];

const STORAGE_KEY = "pos-bt-printer";

let device: BTDevice | null = null;
let writer: BTCharacteristic | null = null;
let status: PrinterStatus = "not-paired";
const listeners = new Set<(s: PrinterStatus, name: string | null) => void>();

function nav(): BTNavigator | null {
  return typeof navigator !== "undefined" && "bluetooth" in navigator ? (navigator as unknown as BTNavigator) : null;
}

export function isBluetoothSupported(): boolean {
  return nav() !== null;
}

function setStatus(s: PrinterStatus) {
  status = s;
  const name = getSavedPrinter()?.name ?? null;
  listeners.forEach((fn) => fn(s, name));
}

export function onPrinterStatus(fn: (s: PrinterStatus, name: string | null) => void): () => void {
  listeners.add(fn);
  fn(status, getSavedPrinter()?.name ?? null);
  return () => listeners.delete(fn);
}

export function getSavedPrinter(): PairedBluetoothDevice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PairedBluetoothDevice) : null;
  } catch {
    return null;
  }
}

function savePrinter(info: PairedBluetoothDevice | null) {
  try {
    if (info) localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage blocked — printer just won't be remembered */
  }
}

/** Works out the current state without showing any browser UI. */
export async function refreshPrinterStatus(): Promise<PrinterStatus> {
  const n = nav();
  if (!n) {
    setStatus("unsupported");
    return status;
  }
  if (n.bluetooth.getAvailability && !(await n.bluetooth.getAvailability().catch(() => true))) {
    setStatus("bluetooth-off");
    return status;
  }
  if (device?.gatt?.connected && writer) {
    setStatus("connected");
    return status;
  }
  setStatus(getSavedPrinter() ? "disconnected" : "not-paired");
  return status;
}

async function findWritable(server: BTServer): Promise<BTCharacteristic> {
  const services = await server.getPrimaryServices();
  for (const svc of services) {
    const chars = await svc.getCharacteristics().catch(() => [] as BTCharacteristic[]);
    const c = chars.find((ch) => ch.properties.writeWithoutResponse) ?? chars.find((ch) => ch.properties.write);
    if (c) return c;
  }
  throw new Error("This device doesn't look like a printer. Choose your thermal printer.");
}

async function connectTo(d: BTDevice): Promise<void> {
  setStatus("connecting");
  if (!d.gatt) throw new Error("This device can't be used as a printer.");
  const server = d.gatt.connected ? d.gatt : await d.gatt.connect();
  writer = await findWritable(server);
  if (device !== d) {
    d.addEventListener("gattserverdisconnected", () => {
      writer = null;
      setStatus(getSavedPrinter() ? "disconnected" : "not-paired");
    });
  }
  device = d;
  savePrinter({ id: d.id, name: d.name || "Thermal printer" });
  setStatus("connected");
}

/** Reconnect to the remembered printer without opening the picker. Returns false if a picker is needed. */
export async function reconnectSavedPrinter(): Promise<boolean> {
  const n = nav();
  const saved = getSavedPrinter();
  if (!n || !saved) return false;
  if (device?.gatt?.connected && writer) return true;
  try {
    let d: BTDevice | undefined = device && device.id === saved.id ? device : undefined;
    if (!d && n.bluetooth.getDevices) {
      d = (await n.bluetooth.getDevices()).find((x) => x.id === saved.id);
    }
    if (!d) return false;
    await connectTo(d);
    return true;
  } catch {
    await refreshPrinterStatus();
    return false;
  }
}

/**
 * Opens the browser's device picker (must be called from a tap/click).
 * `showAll` lists every nearby device in case the printer uses an unusual name.
 */
export async function choosePrinter(showAll = false): Promise<PairedBluetoothDevice> {
  const n = nav();
  if (!n) throw new Error("Bluetooth printing needs Google Chrome on Android, Windows, Mac or ChromeOS.");
  const opts = showAll
    ? { acceptAllDevices: true, optionalServices: PRINTER_SERVICES }
    : {
        filters: [
          ...PRINTER_SERVICES.map((s) => ({ services: [s] })),
          ...PRINTER_NAME_PREFIXES.map((p) => ({ namePrefix: p })),
        ],
        optionalServices: PRINTER_SERVICES,
      };
  try {
    const d = await n.bluetooth.requestDevice(opts);
    await connectTo(d);
    return getSavedPrinter()!;
  } catch (e) {
    await refreshPrinterStatus();
    throw e;
  }
}

export function forgetPrinter() {
  savePrinter(null);
  device = null;
  writer = null;
  setStatus(isBluetoothSupported() ? "not-paired" : "unsupported");
}

/** Sends raw bytes to the connected printer in small BLE-sized chunks. */
export async function writeToPrinter(bytes: Uint8Array): Promise<void> {
  if (!(device?.gatt?.connected && writer)) {
    const ok = await reconnectSavedPrinter();
    if (!ok) throw new Error("Printer not connected.");
  }
  const w = writer!;
  const CHUNK = 128;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const part = bytes.slice(i, i + CHUNK);
    if (w.properties.writeWithoutResponse && w.writeValueWithoutResponse) {
      await w.writeValueWithoutResponse(part);
      await new Promise((r) => setTimeout(r, 15)); // let cheap printers' buffers drain
    } else if (w.writeValueWithResponse) {
      await w.writeValueWithResponse(part);
    } else {
      await w.writeValue(part);
    }
  }
}

/**
 * Kept for Settings: pick + connect a printer and also store it on the
 * business's default printer record.
 */
export async function pairBluetoothPrinter(): Promise<PairedBluetoothDevice> {
  const info = await choosePrinter();
  await fetch("/api/printers/default", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "THERMAL_58MM", bluetoothDeviceId: info.id, bluetoothDeviceName: info.name }),
  }).catch(() => undefined);
  return info;
}
