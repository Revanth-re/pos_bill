"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Printer, X, WifiOff, Bluetooth } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getPrinterAdapter } from "@/lib/printing/getPrinterAdapter";
import { isBluetoothSupported, pairBluetoothPrinter } from "@/lib/printing/bluetoothPairing";
import type { PrinterType, ReceiptData } from "@/lib/printing/types";

type PrintState = "idle" | "needs-bluetooth" | "printing" | "success" | "error";

export function ReceiptModal({
  open,
  onClose,
  receipt,
  offline,
}: {
  open: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
  offline: boolean;
}) {
  const [printerType, setPrinterType] = useState<PrinterType>("THERMAL_80MM");
  const [bluetoothDeviceId, setBluetoothDeviceId] = useState<string | null>(null);
  const [state, setState] = useState<PrintState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Load the business's saved default printer whenever the receipt opens,
  // so we know up front whether a thermal print needs a Bluetooth device
  // that isn't paired yet.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/printers/default")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.printer) {
          setPrinterType(d.printer.type);
          setBluetoothDeviceId(d.printer.bluetoothDeviceId ?? null);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open || !receipt) return null;

  const isThermal = printerType === "THERMAL_58MM" || printerType === "THERMAL_80MM";
  const needsBluetooth = isThermal && !bluetoothDeviceId && isBluetoothSupported();

  async function doPrint() {
    setState("printing");
    setError(null);
    try {
      const adapter = getPrinterAdapter(printerType);
      await adapter.print(receipt as ReceiptData);
      setState("success");
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Unable to print.");
    }
  }

  async function handlePrintClick() {
    if (needsBluetooth) {
      setState("needs-bluetooth");
      return;
    }
    await doPrint();
  }

  async function handleConnectAndPrint() {
    setError(null);
    try {
      const device = await pairBluetoothPrinter();
      setBluetoothDeviceId(device.id);
      await doPrint();
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (err.name !== "NotFoundError") {
        setError(err.message || "Could not connect to the Bluetooth printer.");
        setState("error");
      } else {
        setState("idle");
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-sm border-t-2 sm:border-2 border-ink bg-surface">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-6 w-6" />
            <span className="font-bold text-ink">Bill completed</span>
          </div>
          <button onClick={onClose} className="touch-target rounded-full p-2 hover:bg-paper">
            <X className="h-5 w-5" />
          </button>
        </div>

        {offline && (
          <div className="mx-4 mb-3 flex items-center gap-2 border border-gold bg-gold-soft px-3 py-2 text-sm font-medium text-ink-soft">
            <WifiOff className="h-4 w-4 shrink-0" />
            Saved offline — will sync automatically when back online.
          </div>
        )}

        {state === "needs-bluetooth" ? (
          <div className="mx-4 mb-4 border-2 border-brand bg-brand-soft p-4 text-center">
            <Bluetooth className="mx-auto mb-2 h-8 w-8 text-brand-dark" />
            <p className="text-base font-bold text-ink">Connect your Bluetooth printer</p>
            <p className="mt-1 text-sm text-ink-soft">
              No printer is paired yet. Turn it on and tap connect to pair it.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setState("idle")}>
                Cancel
              </Button>
              <Button onClick={handleConnectAndPrint}>Connect &amp; Print</Button>
            </div>
          </div>
        ) : state === "success" ? (
          <div className="mx-4 mb-4 flex flex-col items-center border-2 border-success bg-success-soft p-4 text-center">
            <CheckCircle2 className="mb-2 h-8 w-8 text-success" />
            <p className="text-base font-bold text-ink">Sent to printer</p>
            <p className="mt-1 text-sm text-ink-soft">Reprint anytime from Sales history.</p>
          </div>
        ) : (
          <div className="px-4 pb-2">
            <p className="mb-1 field-label">Print as</p>
            <div className="grid grid-cols-4 gap-2">
              {(["THERMAL_58MM", "THERMAL_80MM", "A4", "BROWSER"] as PrinterType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setPrinterType(t)}
                  className={`touch-target rounded-md border-2 px-1 text-sm font-bold ${
                    printerType === t ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft"
                  }`}
                >
                  {t === "THERMAL_58MM" ? "58mm" : t === "THERMAL_80MM" ? "80mm" : t === "A4" ? "A4" : "Browser"}
                </button>
              ))}
            </div>
            {isThermal && bluetoothDeviceId && (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-success">
                <Bluetooth className="h-4 w-4" /> Printer connected
              </p>
            )}
          </div>
        )}

        {error && state === "error" && (
          <p className="mx-4 mb-3 border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        {state !== "success" && state !== "needs-bluetooth" && (
          <div className="grid grid-cols-1 gap-2 p-4">
            <Button size="lg" onClick={handlePrintClick} disabled={state === "printing"}>
              <span className="inline-flex items-center gap-2">
                <Printer className="h-4 w-4" /> {state === "printing" ? "Printing…" : "Print Receipt"}
              </span>
            </Button>
            <Button variant="secondary" onClick={onClose}>
              New Bill
            </Button>
          </div>
        )}

        {state === "success" && (
          <div className="grid grid-cols-1 gap-2 p-4 pt-0">
            <Button variant="secondary" onClick={() => setState("idle")}>
              Print Again
            </Button>
            <Button size="lg" onClick={onClose}>
              New Bill
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
