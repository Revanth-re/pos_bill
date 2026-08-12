"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Printer, X, WifiOff, Bluetooth } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getPrinterAdapter } from "@/lib/printing/getPrinterAdapter";
import { isBluetoothSupported, pairBluetoothPrinter } from "@/lib/printing/bluetoothPairing";
import { toast } from "@/stores/toastStore";
import type { PrinterType, ReceiptData } from "@/lib/printing/types";

type PrintState = "loading" | "needs-bluetooth" | "ready" | "printing" | "success" | "error";

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
  const [state, setState] = useState<PrintState>("loading");
  const [error, setError] = useState<string | null>(null);

  // Load the business's saved printer/Bluetooth pairing whenever the
  // receipt opens. IMPORTANT: this never triggers a print automatically —
  // real thermal receipt printers are Bluetooth devices, and both pairing
  // (navigator.bluetooth.requestDevice) and the browser print dialog
  // (window.print) legally require a direct user tap to fire at all. Doing
  // this from a background effect silently fails on mobile (the popup
  // gets blocked with no error), which is exactly what looked like the
  // app "getting stuck" after billing. So: load state here, then always
  // wait for an explicit tap on Connect/Print below.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/printers/default")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const type: PrinterType = d.printer?.type ?? "THERMAL_80MM";
        const btId: string | null = d.printer?.bluetoothDeviceId ?? null;
        setPrinterType(type);
        setBluetoothDeviceId(btId);
        // Ask for a Bluetooth printer whenever one isn't paired yet and the
        // browser can support it — a real POS counter is printing to a
        // physical thermal printer, not this device's own browser dialog.
        setState(!btId && isBluetoothSupported() ? "needs-bluetooth" : "ready");
      })
      .catch(() => {
        if (!cancelled) setState("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open || !receipt) return null;

  async function doPrint() {
    setState("printing");
    setError(null);
    try {
      const adapter = getPrinterAdapter(printerType);
      await adapter.print(receipt as ReceiptData);
      setState("success");
      toast.success("Bill printed");
    } catch (e) {
      setState("error");
      const message = e instanceof Error ? e.message : "Unable to print.";
      setError(message);
      toast.error(message);
    }
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
      }
      // NotFoundError = user closed the picker without choosing — stay put,
      // they can tap Connect again or use "Print without Bluetooth" below.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border border-border bg-surface shadow-lg">
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
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl border border-accent-dark/30 bg-accent-soft px-3 py-2 text-sm font-medium text-ink-soft">
            <WifiOff className="h-4 w-4 shrink-0" />
            Saved offline — will sync automatically when back online.
          </div>
        )}

        {state === "loading" && (
          <div className="px-4 pb-4 text-sm text-muted">Checking printer…</div>
        )}

        {state === "needs-bluetooth" && (
          <div className="mx-4 mb-4 rounded-2xl border border-brand/30 bg-brand-soft p-4 text-center">
            <Bluetooth className="mx-auto mb-2 h-8 w-8 text-brand-dark" />
            <p className="text-base font-bold text-ink">Connect your Bluetooth printer</p>
            <p className="mt-1 text-sm text-ink-soft">
              Turn it on and tap connect to pair it — this is a one-time setup.
            </p>
            <Button className="mt-3 w-full" onClick={handleConnectAndPrint}>
              <span className="inline-flex items-center gap-2">
                <Bluetooth className="h-4 w-4" /> Connect &amp; Print
              </span>
            </Button>
            <button
              onClick={() => setState("ready")}
              className="mt-2 text-sm font-semibold text-muted underline"
            >
              Print without Bluetooth instead
            </button>
          </div>
        )}

        {state === "success" ? (
          <div className="mx-4 mb-4 flex flex-col items-center rounded-2xl border border-success/30 bg-success-soft p-4 text-center">
            <CheckCircle2 className="mb-2 h-8 w-8 text-success" />
            <p className="text-base font-bold text-ink">Sent to printer</p>
            <p className="mt-1 text-sm text-ink-soft">Reprint anytime from Sales history.</p>
          </div>
        ) : (
          (state === "ready" || state === "printing" || state === "error") && (
            <div className="px-4 pb-2">
              <p className="mb-1 field-label">Print as</p>
              <div className="grid grid-cols-4 gap-2">
                {(["THERMAL_58MM", "THERMAL_80MM", "A4", "BROWSER"] as PrinterType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPrinterType(t)}
                    className={`touch-target rounded-xl border-2 px-1 text-sm font-bold transition-all ${
                      printerType === t ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft"
                    }`}
                  >
                    {t === "THERMAL_58MM" ? "58mm" : t === "THERMAL_80MM" ? "80mm" : t === "A4" ? "A4" : "Browser"}
                  </button>
                ))}
              </div>
              {bluetoothDeviceId && (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-success">
                  <Bluetooth className="h-4 w-4" /> Printer connected
                </p>
              )}
            </div>
          )
        )}

        {error && state === "error" && (
          <p className="mx-4 mb-3 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        {(state === "ready" || state === "printing" || state === "error") && (
          <div className="grid grid-cols-1 gap-2 p-4">
            <Button size="lg" onClick={doPrint} loading={state === "printing"}>
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
            <Button variant="secondary" onClick={() => setState("ready")}>
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
