"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, X, Printer, Download, Ban, RotateCcw, ChevronLeft, ChevronRight, ReceiptText, History } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatINR, cn } from "@/lib/utils";
import { toast } from "@/stores/toastStore";
import { getPrinterAdapter } from "@/lib/printing/getPrinterAdapter";
import { choosePrinter, reconnectSavedPrinter } from "@/lib/printing/bluetoothPairing";
import type { PrinterType, ReceiptData } from "@/lib/printing/types";

type Status = "PAID" | "PARTIALLY_PAID" | "CANCELLED" | "REFUNDED";

interface BillRow {
  id: string;
  invoiceNumber: string;
  tokenNumber: number | null;
  createdAt: string;
  cashier: string;
  itemCount: number;
  itemSummary: string;
  grandTotal: number;
  methods: string[];
  status: Status;
}

interface BillDetail {
  id: string;
  invoiceNumber: string;
  tokenNumber: number;
  createdAt: string;
  status: Status;
  cashier: string;
  orderType: "DINE_IN" | "TAKEAWAY";
  customerName: string | null;
  business: { name: string; address: string | null; gstin: string | null };
  items: { name: string; qty: number; unitPrice: number; total: number }[];
  subtotal: number;
  discountTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  payments: { method: string; amount: number }[];
  history: { action: string; by: string; at: string; reason: string | null; amount: number | null }[];
}

const STATUS_STYLE: Record<Status, string> = {
  PAID: "bg-success-soft text-success",
  PARTIALLY_PAID: "bg-accent-soft text-accent-dark",
  CANCELLED: "bg-danger-soft text-danger",
  REFUNDED: "bg-brand-soft text-brand-dark",
};
const STATUS_LABEL: Record<Status, string> = { PAID: "Paid", PARTIALLY_PAID: "Part paid", CANCELLED: "Cancelled", REFUNDED: "Refunded" };
const HISTORY_LABEL: Record<string, string> = {
  BILL_CREATED: "Bill created",
  BILL_CANCELLED: "Cancelled",
  BILL_REFUNDED: "Refunded",
  BILL_REPRINTED: "Reprinted",
};

const fmtTime = (d: string) => new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const isToday = (d: string) => new Date(d).toDateString() === new Date().toDateString();

function StatusPill({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold", STATUS_STYLE[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function BillsScreen({ canVoid, seeAll }: { canVoid: boolean; seeAll: boolean }) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ bills: BillRow[]; total: number; pageSize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const [reloadTick, setReloadTick] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // Changing any filter jumps back to page 1.
  const withReset = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const sp = new URLSearchParams({ page: String(page) });
  if (debouncedQ) sp.set("q", debouncedQ);
  if (status) sp.set("status", status);
  if (method) sp.set("method", method);
  if (from) sp.set("from", from);
  if (to) sp.set("to", to);
  const requestKey = `${sp.toString()}#${reloadTick}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let alive = true;
    const [query] = requestKey.split("#");
    fetch(`/api/bills?${query}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        if (alive) { setData(body); setError(null); }
      })
      .catch((e) => alive && setError(e instanceof Error && e.message ? e.message : "Unable to load bills."))
      .finally(() => alive && setLoadedKey(requestKey));
    return () => { alive = false; };
  }, [requestKey]);

  const load = () => setReloadTick((n) => n + 1);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const hasFilters = !!(q || status || method || from || to);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Bill History</h1>
          <p className="text-sm text-muted">
            {seeAll ? "All bills" : "Your bills"} · view, reprint{canVoid ? ", cancel or refund" : ""}
          </p>
        </div>
        {data && <p className="text-sm font-medium text-muted tabular">{data.total} bills</p>}
      </div>

      {/* Filters */}
      <div className="card space-y-3 p-3 sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search bill no, item or cashier"
            className="field pl-10"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <select value={status} onChange={(e) => withReset(setStatus)(e.target.value)} className="field min-h-11" aria-label="Status">
            <option value="">All statuses</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <select value={method} onChange={(e) => withReset(setMethod)(e.target.value)} className="field min-h-11" aria-label="Payment">
            <option value="">All payments</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="CREDIT">Credit</option>
          </select>
          <input type="date" value={from} onChange={(e) => withReset(setFrom)(e.target.value)} className="field min-h-11" aria-label="From date" />
          <input type="date" value={to} onChange={(e) => withReset(setTo)(e.target.value)} className="field min-h-11" aria-label="To date" />
        </div>
        {hasFilters && (
          <button
            onClick={() => { setQ(""); setDebouncedQ(""); setStatus(""); setMethod(""); setFrom(""); setTo(""); setPage(1); }}
            className="text-sm font-semibold text-brand hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {error ? (
        <div className="card p-6 text-center">
          <p className="font-semibold text-danger">{error}</p>
          <Button variant="secondary" className="mt-3" onClick={load}>Try again</Button>
        </div>
      ) : loading && !data ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : data && data.bills.length === 0 ? (
        <div className="card flex flex-col items-center p-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft">
            <ReceiptText className="h-6 w-6 text-brand" />
          </div>
          <p className="font-bold text-ink">{hasFilters ? "No bills match these filters." : "No bills yet."}</p>
          <p className="text-sm text-muted">Bills appear here as soon as they are created.</p>
        </div>
      ) : data ? (
        <div className={cn("transition-opacity duration-150", loading && "opacity-60")}>
          {/* Mobile: cards */}
          <ul className="space-y-2 md:hidden">
            {data.bills.map((b) => (
              <li key={b.id}>
                <button onClick={() => setOpenId(b.id)} className="card w-full p-3 text-left active:scale-[0.99] transition-transform">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-soft">
                        <span className="text-[10px] font-semibold leading-none text-brand">TOKEN</span>
                        <span className="text-base font-extrabold leading-tight text-brand-dark tabular">{b.tokenNumber ?? "–"}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink">{b.invoiceNumber}</p>
                        <p className="truncate text-xs text-muted">
                          {isToday(b.createdAt) ? "Today" : fmtDate(b.createdAt)} · {fmtTime(b.createdAt)} · {b.cashier}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={cn("font-extrabold tabular", b.status === "CANCELLED" || b.status === "REFUNDED" ? "text-muted line-through" : "text-ink")}>
                        {formatINR(b.grandTotal)}
                      </p>
                      <StatusPill status={b.status} />
                    </div>
                  </div>
                  <p className="mt-2 truncate text-sm text-ink-soft">{b.itemSummary}</p>
                  <p className="mt-1 text-xs font-medium text-muted">{b.methods.join(" + ") || "—"}</p>
                </button>
              </li>
            ))}
          </ul>

          {/* Tablet / desktop: table */}
          <div className="card hidden overflow-hidden md:block">
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-paper text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">Bill</th>
                    <th className="px-3 py-3">Token</th>
                    <th className="px-3 py-3">Date / time</th>
                    <th className="hidden px-3 py-3 lg:table-cell">Cashier</th>
                    <th className="hidden px-3 py-3 xl:table-cell">Items</th>
                    <th className="px-3 py-3">Payment</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.bills.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => setOpenId(b.id)}
                      className="cursor-pointer transition-colors hover:bg-brand-soft/40"
                    >
                      <td className="px-4 py-3 font-bold text-ink">{b.invoiceNumber}</td>
                      <td className="px-3 py-3 font-bold text-brand tabular">#{b.tokenNumber ?? "–"}</td>
                      <td className="px-3 py-3 text-ink-soft tabular">
                        {isToday(b.createdAt) ? "Today" : fmtDate(b.createdAt)}, {fmtTime(b.createdAt)}
                      </td>
                      <td className="hidden px-3 py-3 text-ink-soft lg:table-cell">{b.cashier}</td>
                      <td className="hidden max-w-[260px] truncate px-3 py-3 text-ink-soft xl:table-cell">{b.itemSummary}</td>
                      <td className="px-3 py-3 text-ink-soft">{b.methods.join(" + ") || "—"}</td>
                      <td className="px-3 py-3"><StatusPill status={b.status} /></td>
                      <td className={cn("px-4 py-3 text-right font-extrabold tabular", b.status === "CANCELLED" || b.status === "REFUNDED" ? "text-muted line-through" : "text-ink")}>
                        {formatINR(b.grandTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <p className="text-sm text-muted tabular">Page {page} of {totalPages}</p>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {openId && (
        <BillSheet
          id={openId}
          canVoid={canVoid}
          onClose={() => setOpenId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function toReceipt(b: BillDetail): ReceiptData {
  return {
    businessName: b.business.name,
    businessAddress: b.business.address ?? undefined,
    gstin: b.business.gstin ?? undefined,
    invoiceNumber: b.invoiceNumber,
    tokenNumber: b.tokenNumber,
    copyLabel: b.status === "CANCELLED" ? "CANCELLED" : b.status === "REFUNDED" ? "REFUNDED" : "DUPLICATE",
    createdAt: new Date(b.createdAt).toLocaleString("en-IN"),
    cashierName: b.cashier,
    orderType: b.orderType,
    customerName: b.customerName ?? undefined,
    lines: b.items.map((i) => ({ name: i.name, qty: i.qty, unitPrice: i.unitPrice, total: i.total })),
    subtotal: b.subtotal,
    discountTotal: b.discountTotal,
    cgstTotal: b.cgstTotal,
    sgstTotal: b.sgstTotal,
    igstTotal: b.igstTotal,
    grandTotal: b.grandTotal,
    payments: b.payments,
  };
}

function BillSheet({ id, canVoid, onClose, onChanged }: { id: string; canVoid: boolean; onClose: () => void; onChanged: () => void }) {
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<null | "cancel" | "refund">(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/bills/${id}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error);
        setBill(body.bill);
      })
      .catch((e) => setLoadError(e instanceof Error && e.message ? e.message : "Unable to load this bill."));
  }, [id]);
  useEffect(load, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function reprint() {
    if (!bill) return;
    try {
      // Same direct Bluetooth printing as billing — reconnect silently, picker only if needed.
      if (!(await reconnectSavedPrinter())) await choosePrinter();
      let paper: PrinterType = "THERMAL_58MM";
      try {
        if (localStorage.getItem("pos-paper") === "THERMAL_80MM") paper = "THERMAL_80MM";
      } catch {
        /* ignore */
      }
      await getPrinterAdapter(paper).print(toReceipt(bill));
      toast.success("Bill reprinted");
      void fetch(`/api/bills/${bill.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reprint" }) });
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (err.name === "NotFoundError") return;
      toast.error(err.message || "Unable to print.");
    }
  }

  function download() {
    if (!bill) return;
    const html = getPrinterAdapter("A4").preview(toReceipt(bill));
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bill.invoiceNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function submitVoid() {
    if (!bill || !mode) return;
    if (reason.trim().length < 3) {
      setActionError("Please enter a reason.");
      return;
    }
    setBusy(true);
    setActionError(null);
    const res = await fetch(`/api/bills/${bill.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: mode, reason: reason.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setActionError(body.error ?? "Something went wrong.");
      return;
    }
    toast.success(mode === "cancel" ? "Bill cancelled" : "Bill refunded");
    setMode(null);
    setReason("");
    load();
    onChanged();
  }

  const voided = bill?.status === "CANCELLED" || bill?.status === "REFUNDED";
  const today = bill ? isToday(bill.createdAt) : false;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="toast-enter flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-surface shadow-lg sm:w-[calc(100%-24px)] sm:max-w-[520px] sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold text-ink">{bill?.invoiceNumber ?? "Bill"}</p>
            {bill && (
              <p className="text-xs text-muted">
                {new Date(bill.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {bill.cashier}
              </p>
            )}
          </div>
          <button onClick={onClose} className="touch-target rounded-full p-2 hover:bg-paper" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {loadError ? (
            <p className="text-center font-semibold text-danger">{loadError}</p>
          ) : !bill ? (
            <div className="space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-32" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-dark p-4 text-white">
                <div>
                  <p className="text-xs font-medium text-white/70">TOKEN</p>
                  <p className="text-3xl font-extrabold leading-none tabular text-accent">{bill.tokenNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-white/70">{bill.payments.map((p) => p.method).join(" + ") || "—"}</p>
                  <p className={cn("text-2xl font-extrabold tabular", voided && "line-through opacity-60")}>{formatINR(bill.grandTotal)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={bill.status} />
                <span className="text-xs text-muted">{bill.orderType === "DINE_IN" ? "Dine-in" : "Takeaway"}</span>
                {bill.customerName && <span className="text-xs text-muted">· {bill.customerName}</span>}
              </div>

              <div className="rounded-xl border border-border">
                <ul className="divide-y divide-border">
                  {bill.items.map((i, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                      <span className="min-w-0 truncate text-ink"><span className="font-bold tabular">{i.qty}×</span> {i.name}</span>
                      <span className="shrink-0 font-semibold tabular">{formatINR(i.total)}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-1 border-t border-border bg-paper px-3 py-2.5 text-sm">
                  <Line label="Subtotal" value={formatINR(bill.subtotal)} />
                  {bill.discountTotal > 0 && <Line label="Discount" value={`−${formatINR(bill.discountTotal)}`} />}
                  {bill.cgstTotal + bill.sgstTotal + bill.igstTotal > 0 && (
                    <Line label="GST" value={formatINR(bill.cgstTotal + bill.sgstTotal + bill.igstTotal)} />
                  )}
                  <Line label="Total" value={formatINR(bill.grandTotal)} bold />
                </div>
              </div>

              {bill.history.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                    <History className="h-3.5 w-3.5" /> Activity
                  </p>
                  <ul className="space-y-2">
                    {bill.history.map((h, idx) => (
                      <li key={idx} className={cn("rounded-xl px-3 py-2 text-sm", h.action === "BILL_CANCELLED" || h.action === "BILL_REFUNDED" ? "bg-danger-soft" : "bg-paper")}>
                        <div className="flex flex-wrap justify-between gap-x-3">
                          <span className="font-semibold text-ink">{HISTORY_LABEL[h.action] ?? h.action} · {h.by}</span>
                          <span className="text-xs text-muted tabular">{new Date(h.at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
                        </div>
                        {h.reason && <p className="mt-0.5 text-ink-soft">Reason: {h.reason}</p>}
                        {(h.action === "BILL_CANCELLED" || h.action === "BILL_REFUNDED") && h.amount != null && (
                          <p className="text-xs font-semibold text-danger tabular">{formatINR(h.amount)}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {mode && (
                <div className="space-y-2 rounded-xl border border-danger/30 bg-danger-soft/60 p-3">
                  <label className="field-label">
                    Reason for {mode === "cancel" ? "cancelling" : "refunding"} {formatINR(bill.grandTotal)}
                  </label>
                  <textarea
                    autoFocus
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={mode === "cancel" ? "e.g. Wrong item entered" : "e.g. Customer returned food"}
                    className="field resize-none"
                  />
                  <p className="text-xs text-ink-soft">Stock is restored and any udhaari for this bill is reversed. This can’t be undone.</p>
                  {actionError && <p className="text-sm font-semibold text-danger">{actionError}</p>}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button variant="secondary" onClick={() => { setMode(null); setActionError(null); }}>Back</Button>
                    <Button variant="danger" loading={busy} onClick={submitVoid}>
                      Confirm {mode === "cancel" ? "cancel" : "refund"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {bill && !mode && (
          <div className="grid grid-cols-2 gap-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button onClick={reprint}><Printer className="h-4 w-4" /> Reprint</Button>
            <Button variant="secondary" onClick={download}><Download className="h-4 w-4" /> Download</Button>
            {canVoid && !voided && (
              <>
                {today && (
                  <Button variant="secondary" className="text-danger" onClick={() => setMode("cancel")}>
                    <Ban className="h-4 w-4" /> Cancel bill
                  </Button>
                )}
                <Button variant="secondary" className={cn("text-danger", !today && "col-span-2")} onClick={() => setMode("refund")}>
                  <RotateCcw className="h-4 w-4" /> Refund
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between", bold ? "pt-1 text-base font-extrabold text-ink" : "text-ink-soft")}>
      <span>{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}
