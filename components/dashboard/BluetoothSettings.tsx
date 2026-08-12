"use client";

import { useState } from "react";
import { Bluetooth, BluetoothConnected, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { isBluetoothSupported, pairBluetoothPrinter, type PairedBluetoothDevice } from "@/lib/printing/bluetoothPairing";

export function BluetoothSettings({
  initialDeviceId,
  initialDeviceName,
}: {
  initialDeviceId: string | null;
  initialDeviceName: string | null;
}) {
  const [device, setDevice] = useState<PairedBluetoothDevice | null>(
    initialDeviceId && initialDeviceName ? { id: initialDeviceId, name: initialDeviceName } : null
  );
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const supported = isBluetoothSupported();

  async function handlePair() {
    setError(null);
    setConnecting(true);
    try {
      const info = await pairBluetoothPrinter();
      setDevice(info);
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (err.name !== "NotFoundError") {
        setError(err.message || "Could not open the Bluetooth device picker.");
      }
    } finally {
      setConnecting(false);
    }
  }

  async function handleForget() {
    setDevice(null);
    await fetch("/api/printers/default", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bluetoothDeviceId: null, bluetoothDeviceName: null, type: "BROWSER" }),
    });
  }

  if (!supported) {
    return (
      <div className="border-2 border-border bg-paper p-4">
        <p className="text-sm font-semibold text-ink">Bluetooth pairing isn&apos;t available in this browser</p>
        <p className="mt-1 text-sm text-muted">
          Open this page in Chrome or Edge on Android or a laptop to pair a Bluetooth receipt printer or
          barcode scanner. Bluetooth pairing is not supported in Safari or Firefox.
        </p>
      </div>
    );
  }

  return (
    <div>
      {device ? (
        <div className="flex items-center justify-between border-2 border-success bg-success-soft p-3">
          <div className="flex items-center gap-2">
            <BluetoothConnected className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="text-sm font-bold text-ink">{device.name}</p>
              <p className="text-sm text-muted">Paired device</p>
            </div>
          </div>
          <button
            onClick={handleForget}
            className="touch-target flex items-center gap-1 px-2 text-sm font-semibold text-danger"
          >
            <X className="h-4 w-4" /> Forget
          </button>
        </div>
      ) : (
        <Button variant="secondary" onClick={handlePair} disabled={connecting}>
          <span className="inline-flex items-center gap-2">
            <Bluetooth className="h-4 w-4" />
            {connecting ? "Opening device picker…" : "Pair a Bluetooth device"}
          </span>
        </Button>
      )}
      {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
