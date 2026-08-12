"use client";

export interface PairedBluetoothDevice {
  id: string;
  name: string;
}

export function isBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

/**
 * Opens the browser's native Bluetooth device picker and, on success,
 * persists the paired device as this business's default printer's
 * Bluetooth pairing. Shared by Settings (pair proactively) and the
 * print flow (pair on demand, right before the first print).
 */
export async function pairBluetoothPrinter(): Promise<PairedBluetoothDevice> {
  const btDevice = await (
    navigator as unknown as {
      bluetooth: { requestDevice: (opts: { acceptAllDevices: boolean }) => Promise<{ id: string; name?: string }> };
    }
  ).bluetooth.requestDevice({ acceptAllDevices: true });

  const info: PairedBluetoothDevice = { id: btDevice.id, name: btDevice.name || "Unnamed device" };

  await fetch("/api/printers/default", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "THERMAL_58MM",
      bluetoothDeviceId: info.id,
      bluetoothDeviceName: info.name,
    }),
  });

  return info;
}
