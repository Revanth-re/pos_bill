"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Printer, X, WifiOff, Eye, EyeOff, Bluetooth, BluetoothOff, BluetoothSearching, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getPrinterAdapter } from "@/lib/printing/getPrinterAdapter";
import {
  choosePrinter,
  getSavedPrinter,
  onPrinterStatus,
  reconnectSavedPrinter,
  refreshPrinterStatus,
  type PrinterStatus,
} from "@/lib/printing/bluetoothPairing";
import { toast } from "@/stores/toastStore";
import { formatINR, cn } from "@/lib/utils";
import type { ReceiptData } from "@/lib/printing/types";
import { getCachedBillFormat, loadBillFormat, type BillFormat } from "@/lib/printing/billFormat";
import { ReceiptPreview } from "./ReceiptPreview";

type Paper = "THERMAL_58MM" | "THERMAL_80MM";
type JobState = "idle" | "printing" | "printed" | "error";

const PAPER_KEY = "pos-paper";

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
  const [status, setStatus] = useState<PrinterStatus>("connecting");
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [paper, setPaper] = useState<Paper>(() => {
    try {
      const pref = localStorage.getItem(PAPER_KEY);
      if (pref === "THERMAL_58MM" || pref === "THERMAL_80MM") return pref;
      return getCachedBillFormat().paper === "80" ? "THERMAL_80MM" : "THERMAL_58MM";
    } catch {
      return "THERMAL_58MM";
    }
  });
  const [job, setJob] = useState<JobState>("idle");
  const [format, setFormat] = useState<BillFormat>(() => getCachedBillFormat());
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoPrinted = useRef(false);

  useEffect(() => onPrinterStatus((s, name) => { setStatus(s); setPrinterName(name); }), []);

  // On open: reconnect silently, and auto-print if the printer is ready.
  useEffect(() => {
    if (!open || !receipt) return;
    autoPrinted.current = false;
    let alive = true;
    // Refresh the bill format in the background — printing uses the cached one, no waiting on the network.
    void loadBillFormat().then((f) => alive && setFormat(f));
    (async () => {
      // Printer is usually already connected (BillingScreen keeps it warm) → print instantly.
      const ready = (await refreshPrinterStatus()) === "connected" || (await reconnectSavedPrinter());
      if (alive && ready && !autoPrinted.current) {
        autoPrinted.current = true;
        void doPrint();
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, receipt]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && job === "printed") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, job, onClose]);

  if (!open || !receipt) return null;

  async function doPrint(paperOverride?: Paper) {
    if (!receipt) return;
    setJob("printing");
    setError(null);
    try {
      await getPrinterAdapter(paperOverride ?? paper).print(receipt);
      setJob("printed");
      toast.success("Bill printed");
    } catch (e) {
      setJob("error");
      setError(e instanceof Error ? e.message : "Couldn't print. Check the printer and try again.");
      await refreshPrinterStatus();
    }
  }

  async function connectAndPrint(showAll = false) {
    setError(null);
    try {
      // Try the remembered printer first — no picker needed.
      const ok = !showAll && (await reconnectSavedPrinter());
      if (!ok) await choosePrinter(showAll);
      await doPrint();
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (err.name === "NotFoundError") return; // picker closed — stay on this screen
      setError(
        err.name === "NetworkError"
          ? "Couldn't connect. Make sure the printer is on and not connected to another phone."
          : err.message || "Couldn't connect to the printer."
      );
    }
  }

  function changePaper(p: Paper) {
    setPaper(p);
    try {
      localStorage.setItem(PAPER_KEY, p);
    } catch {
      /* ignore */
    }
  }

  const saved = getSavedPrinter();
  const connected = status === "connected";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="toast-enter max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl bg-surface shadow-lg sm:w-[calc(100%-24px)] sm:max-w-[420px] sm:rounded-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* Header: bill saved + token */}
        <div className="flex items-start justify-between gap-3 p-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-soft">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="font-bold text-ink">Bill saved</p>
              <p className="text-sm text-muted tabular">
                {receipt.invoiceNumber} · {formatINR(receipt.grandTotal)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="touch-target -mr-2 -mt-1 rounded-full p-2 hover:bg-paper" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {receipt.tokenNumber ? (
          <div className="mx-4 mb-3 flex items-center justify-between rounded-2xl bg-brand-dark px-4 py-3 text-white">
            <span className="text-sm font-semibold text-white/70">TOKEN</span>
            <span className="text-3xl font-extrabold leading-none text-accent tabular">{receipt.tokenNumber}</span>
          </div>
        ) : null}

        {offline && (
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl border border-accent-dark/30 bg-accent-soft px-3 py-2 text-sm font-medium text-ink-soft">
            <WifiOff className="h-4 w-4 shrink-0" />
            Saved offline — will sync when back online.
          </div>
        )}

        {/* Printer area */}
        <div className="mx-4 mb-3">
          {status === "unsupported" ? (
            <Notice
              icon={<BluetoothOff className="h-6 w-6 text-muted" />}
              title="Bluetooth printing not available here"
              text="Open the POS in Google Chrome on Android, Windows or Mac to print to a Bluetooth printer."
            />
          ) : status === "bluetooth-off" ? (
            <Notice
              icon={<BluetoothOff className="h-6 w-6 text-danger" />}
              title="Bluetooth is off"
              text="Turn on Bluetooth on this device, then tap Retry."
              action={
                <Button variant="secondary" className="mt-3 w-full" onClick={() => void refreshPrinterStatus()}>
                  <RefreshCw className="h-4 w-4" /> Retry
                </Button>
              }
            />
          ) : connected || job === "printing" || job === "printed" ? (
            <div className="rounded-2xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60", connected && "animate-ping bg-success")} />
                    <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", connected ? "bg-success" : "bg-muted")} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{printerName ?? "Printer"}</p>
                    <p className="text-xs text-muted">{connected ? "Connected" : "Reconnecting…"}</p>
                  </div>
                </div>
                <PaperToggle value={paper} onChange={changePaper} />
              </div>
              {job === "printing" && (
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand">
                  <Loader2 className="h-4 w-4 animate-spin" /> Printing…
                </p>
              )}
              {job === "printed" && (
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" /> Printed — hand the bill to the customer
                </p>
              )}
            </div>
          ) : (
            // Not paired / disconnected: our clean connect screen, shown before the browser picker.
            <div className="rounded-2xl border border-brand/20 bg-brand-soft/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface shadow-sm">
                  {status === "connecting" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-brand" />
                  ) : (
                    <BluetoothSearching className="h-5 w-5 text-brand" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-ink">
                    {status === "connecting" ? "Connecting…" : saved ? `Reconnect ${saved.name}` : "Connect your printer"}
                  </p>
                  <p className="text-xs text-ink-soft">One-time setup · remembered on this device</p>
                </div>
              </div>
              {!saved && (
                <ol className="mt-3 space-y-1.5 text-sm text-ink-soft">
                  {["Switch on the thermal printer", "Keep it close to this device", "Tap Find printer and pick it from the list"].map((s, i) => (
                    <li key={s} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              )}
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted">Paper</span>
                <PaperToggle value={paper} onChange={changePaper} />
              </div>
              <Button className="mt-3 w-full" size="lg" disabled={status === "connecting"} onClick={() => connectAndPrint(false)}>
                <Bluetooth className="h-5 w-5" /> {saved ? "Reconnect & Print" : "Find printer"}
              </Button>
              <button onClick={() => connectAndPrint(true)} className="mt-2 w-full text-center text-xs font-semibold text-brand hover:underline">
                Printer not in the list? Show all devices
              </button>
            </div>
          )}
        </div>

        {/* Bill preview — exactly what the printer will print */}
        <div className="mx-4 mb-3">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-brand transition-colors hover:bg-brand-soft/60"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Hide preview" : "Preview bill"}
          </button>
          {showPreview && (
            <div className="mt-2 max-h-[45dvh] overflow-y-auto rounded-2xl bg-paper p-3 ring-1 ring-border">
              <ReceiptPreview data={receipt} format={{ ...format, paper: paper === "THERMAL_80MM" ? "80" : "58" }} />
            </div>
          )}
        </div>

        {error && (
          <p className="mx-4 mb-3 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error}</p>
        )}

        <div className="grid grid-cols-1 gap-2 px-4 min-[380px]:grid-cols-2">
          {connected && job !== "printing" && (
            <Button variant="secondary" onClick={() => doPrint()}>
              <Printer className="h-4 w-4" /> {job === "printed" ? "Print again" : "Print"}
            </Button>
          )}
          <Button
            variant={job === "printed" ? "primary" : "secondary"}
            className={cn(!(connected && job !== "printing") && "min-[380px]:col-span-2")}
            onClick={onClose}
          >
            {job === "printed" ? "New Bill" : "Skip print — New Bill"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaperToggle({ value, onChange }: { value: Paper; onChange: (p: Paper) => void }) {
  return (
    <div className="flex shrink-0 rounded-lg bg-paper p-0.5">
      {(["THERMAL_58MM", "THERMAL_80MM"] as Paper[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "min-h-9 rounded-xl px-2.5 text-xs font-bold transition-colors",
            value === p ? "bg-surface text-brand-dark shadow-sm" : "text-muted"
          )}
        >
          {p === "THERMAL_58MM" ? "58mm" : "80mm"}
        </button>
      ))}
    </div>
  );
}

function Notice({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-paper p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface shadow-sm">{icon}</div>
        <div>
          <p className="font-bold text-ink">{title}</p>
          <p className="text-sm text-ink-soft">{text}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
