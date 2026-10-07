"use client";

import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, Search, IndianRupee, Printer, MessageCircle } from "lucide-react";
import { toast } from "@/stores/toastStore";
import { buildStatementRows, buildStatementText, type StatementData } from "@/lib/printing/statement";
import { rowsToBytes } from "@/lib/printing/escpos";
import { choosePrinter, reconnectSavedPrinter, writeToPrinter } from "@/lib/printing/bluetoothPairing";
import { getCachedBillFormat } from "@/lib/printing/billFormat";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatINR, cn } from "@/lib/utils";
import { useCatalogStore, type CustomerCacheRow } from "@/stores/catalogStore";

type CustomerRow = CustomerCacheRow;

interface LedgerEntry {
  id: string;
  type: "CREDIT_SALE" | "PAYMENT" | "ADJUSTMENT";
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
  invoice: {
    invoiceNumber: string;
    status?: string;
    items: { productName: string; quantity: number | string; lineTotal: number | string }[];
  } | null;
}

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});
type CustomerFormValues = z.infer<typeof customerSchema>;

export function CustomersScreen({
  canManage,
  canRecordPayment,
  businessName = "",
  mode = "customers",
}: {
  canManage: boolean;
  canRecordPayment: boolean;
  businessName?: string;
  mode?: "customers" | "udhaari";
}) {
  const [showAll, setShowAll] = useState(mode === "customers");
  const customers = useCatalogStore((s) => s.customers);
  const loading = useCatalogStore((s) => s.loadingCustomers);
  const ensureCustomers = useCatalogStore((s) => s.ensureCustomers);
  const seedCustomers = useCatalogStore((s) => s.seedCustomers);

  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<CustomerRow | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useCatalogStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useCatalogStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void ensureCustomers({ force: true }); // balances change with every udhaari bill — never trust the cache here
  }, [hydrated, ensureCustomers]);

  const filtered = useMemo(() => {
    const list = customers.filter(
      (c) =>
        (showAll || c.outstandingBalance > 0) &&
        (c.name.toLowerCase().includes(query.toLowerCase()) || (c.phone ?? "").includes(query))
    );
    return mode === "udhaari" ? [...list].sort((a, b) => b.outstandingBalance - a.outstandingBalance) : list;
  }, [customers, query, showAll, mode]);

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  function handleBalanceUpdated(customerId: string, newBalance: number) {
    seedCustomers(
      customers.map((c) => (c.id === customerId ? { ...c, outstandingBalance: newBalance } : c))
    );
    setSelected((s) => (s && s.id === customerId ? { ...s, outstandingBalance: newBalance } : s));
  }

  const showBoot = customers.length === 0 && (loading || !hydrated);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{mode === "udhaari" ? "Udhaari" : "Customers & Udhaari"}</h1>
          <p className="text-sm text-muted">
            {mode === "udhaari"
              ? `${customers.filter((c) => c.outstandingBalance > 0).length} customers owe money · eat now, pay later`
              : `${customers.length} customers`}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setFormOpen(true)}>
            <span className="inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Add Customer
            </span>
          </Button>
        )}
      </div>

      {totalOutstanding > 0 && (
        <div className="rounded-2xl bg-brand-dark p-4 text-white shadow-md">
          <p className="text-sm font-semibold opacity-80">Total outstanding credit</p>
          <p className="text-3xl font-extrabold tabular">{formatINR(totalOutstanding)}</p>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 touch-target transition-shadow focus-within:border-brand focus-within:ring-3 focus-within:ring-brand-soft">
        <Search className="h-5 w-5 text-muted shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or phone…"
          className="flex-1 bg-transparent py-2.5 text-base outline-none"
        />
      </div>
        <div className="flex rounded-xl border border-border bg-surface p-1 text-sm font-semibold">
          {([[false, "Pending udhaari"], [true, "All customers"]] as const).map(([v, l]) => (
            <button
              key={l}
              onClick={() => setShowAll(v)}
              className={cn("min-h-10 flex-1 rounded-lg px-3 transition-all duration-150 sm:flex-none", showAll === v ? "bg-brand text-white shadow-sm" : "text-ink-soft hover:text-ink")}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {showBoot ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <p className="mb-3 text-base text-muted">{showAll ? "No customers yet" : "No pending udhaari — everyone has paid."}</p>
          {canManage && <Button onClick={() => setFormOpen(true)}>Add Customer</Button>}
        </div>
      ) : (
        <ul className="rounded-2xl border border-border bg-surface divide-y divide-border shadow-sm overflow-hidden">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSelected(c)}
                className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-soft/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-base font-extrabold text-brand-dark">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-ink truncate">{c.name}</p>
                    {c.phone && <p className="text-sm text-muted">{c.phone}</p>}
                  </div>
                </div>
                <p
                  className={cn(
                    "shrink-0 font-bold tabular",
                    c.outstandingBalance > 0 ? "text-danger" : "text-success"
                  )}
                >
                  {c.outstandingBalance > 0 ? formatINR(c.outstandingBalance) : "Settled"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {formOpen && (
        <AddCustomerSheet
          onClose={() => setFormOpen(false)}
          onCreated={(c) => {
            seedCustomers([...customers, c]);
            setFormOpen(false);
          }}
        />
      )}

      {selected && (
        <CustomerDetailSheet
          customer={selected}
          businessName={businessName}
          canRecordPayment={canRecordPayment}
          onClose={() => setSelected(null)}
          onBalanceUpdated={handleBalanceUpdated}
        />
      )}
    </div>
  );
}

function AddCustomerSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: CustomerRow) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({ resolver: zodResolver(customerSchema) });

  async function onSubmit(values: CustomerFormValues) {
    setSubmitting(true);
    setServerError(null);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Unable to save the customer.");
      return;
    }
    const body = await res.json();
    onCreated({ id: body.customer.id, name: body.customer.name, phone: body.customer.phone, outstandingBalance: 0 });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="toast-enter max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-border bg-surface shadow-lg pb-[env(safe-area-inset-bottom)] sm:w-[calc(100%-24px)] sm:max-w-[520px] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold text-ink">Add Customer</h2>
          <button onClick={onClose} className="touch-target rounded-full p-2 hover:bg-paper">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <div>
            <label className="field-label">Name</label>
            <input {...register("name")} className="field" placeholder="Ramesh Kumar" />
            {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input {...register("phone")} className="field" placeholder="98765 43210" />
          </div>
          <div>
            <label className="field-label">Address (optional)</label>
            <input {...register("address")} className="field" />
          </div>
          {serverError && (
            <p className="border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger rounded-xl">{serverError}</p>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Saving…" : "Save Customer"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function CustomerDetailSheet({
  customer,
  businessName,
  canRecordPayment,
  onClose,
  onBalanceUpdated,
}: {
  customer: CustomerRow;
  businessName: string;
  canRecordPayment: boolean;
  onClose: () => void;
  onBalanceUpdated: (id: string, balance: number) => void;
}) {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(customer.outstandingBalance);
  const [view, setView] = useState<"open" | "all">("open");
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"CASH" | "UPI">("CASH");
  const [payError, setPayError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/customers/${customer.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setLedger(
          (d.ledger ?? []).map((e: LedgerEntry & { amount: unknown; balanceAfter: unknown }) => ({
            ...e,
            amount: Number(e.amount),
            balanceAfter: Number(e.balanceAfter),
          }))
        );
        if (d.customer) {
          const fresh = Number(d.customer.outstandingBalance);
          setBalance(fresh);
          if (fresh !== customer.outstandingBalance) onBalanceUpdated(customer.id, fresh);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Oldest → newest; "open" = everything since the khata was last fully cleared.
  const chrono = useMemo(() => [...ledger].reverse(), [ledger]);
  const lastSettledIdx = useMemo(() => {
    for (let i = chrono.length - 1; i >= 0; i--) if (chrono[i].balanceAfter <= 0) return i;
    return -1;
  }, [chrono]);
  const shown = view === "open" ? chrono.slice(lastSettledIdx + 1) : chrono;
  const lastPayment = ledger.find((e) => e.type === "PAYMENT");
  const openCredit = chrono.slice(lastSettledIdx + 1).filter((e) => e.type === "CREDIT_SALE");
  const visitDays = new Set(openCredit.map((e) => new Date(e.createdAt).toDateString())).size;

  // Group shown entries by calendar day (newest day first).
  const groups = useMemo(() => {
    const map = new Map<string, LedgerEntry[]>();
    for (const e of shown) {
      const k = new Date(e.createdAt).toDateString();
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return Array.from(map.entries()).reverse();
  }, [shown]);

  function statementData(): StatementData {
    const opening = view === "all" || lastSettledIdx < 0 ? 0 : Math.max(0, chrono[lastSettledIdx].balanceAfter);
    const first = shown[0]?.createdAt;
    return {
      businessName,
      customerName: customer.name,
      phone: customer.phone,
      periodLabel: first ? `From ${new Date(first).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : "No entries",
      openingBalance: opening,
      entries: shown.map((e) => ({
        type: e.type,
        amount: e.amount,
        balanceAfter: e.balanceAfter,
        createdAt: e.createdAt,
        note: e.note,
        invoiceNumber: e.invoice?.invoiceNumber,
        items: e.invoice?.items.map((i) => ({ name: i.productName, qty: Number(i.quantity) })),
      })),
      balance,
    };
  }

  async function printStatement() {
    try {
      if (!(await reconnectSavedPrinter())) await choosePrinter();
      await writeToPrinter(rowsToBytes(buildStatementRows(statementData(), getCachedBillFormat().paper), getCachedBillFormat().paper));
      toast.success("Statement printed");
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (err.name !== "NotFoundError") toast.error(err.message || "Couldn't print.");
    }
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(buildStatementText(statementData()));
    const digits = (customer.phone ?? "").replace(/\D/g, "");
    const to = digits.length === 10 ? `91${digits}` : digits;
    window.open(`https://wa.me/${to}?text=${text}`, "_blank");
  }

  async function recordPayment(amount: number) {
    if (!amount || amount <= 0) {
      setPayError("Enter an amount greater than 0");
      return;
    }
    setSubmitting(true);
    setPayError(null);
    const res = await fetch(`/api/customers/${customer.id}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method: payMethod }),
    });
    setSubmitting(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPayError(body.error ?? "Unable to record the payment.");
      return;
    }
    const newBalance = Number(body.customer.outstandingBalance);
    setBalance(newBalance);
    onBalanceUpdated(customer.id, newBalance);
    setLedger((prev) => [
      { id: body.entry.id, type: "PAYMENT", amount, balanceAfter: newBalance, note: body.entry.note ?? `Paid by ${payMethod}`, createdAt: body.entry.createdAt, invoice: null },
      ...prev,
    ]);
    setPayOpen(false);
    setPayAmount("");
    toast.success(newBalance <= 0 ? `${customer.name}'s udhaari settled` : `${formatINR(amount)} received`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="toast-enter flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-lg sm:max-w-[560px] sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-base font-extrabold text-brand-dark">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-ink">{customer.name}</h2>
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="text-sm font-medium text-brand">
                  {customer.phone}
                </a>
              )}
            </div>
          </div>
          <button onClick={onClose} className="touch-target rounded-full p-2 hover:bg-paper" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Balance card */}
          <div className="p-4">
            <div className="rounded-2xl bg-brand-dark p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Udhaari due</p>
              {loading ? (
                <div className="mt-1 h-10 w-40 animate-pulse rounded-lg bg-white/15" />
              ) : (
                <p className={cn("text-[clamp(1.9rem,7vw,2.4rem)] font-extrabold leading-tight tabular", balance > 0 ? "text-accent" : "text-white")}>
                  {balance > 0 ? formatINR(balance) : "Settled ✓"}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/75">
                {balance > 0 && <span>{visitDays} day{visitDays === 1 ? "" : "s"} · {openCredit.length} bill{openCredit.length === 1 ? "" : "s"} unpaid</span>}
                {lastPayment && <span>Last paid {new Date(lastPayment.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {canRecordPayment && !loading && balance > 0 && (
                <Button className="col-span-2" size="lg" onClick={() => { setPayOpen(true); setPayAmount(String(balance)); }}>
                  <IndianRupee className="h-5 w-5" /> Receive payment
                </Button>
              )}
              <Button variant="secondary" onClick={printStatement} disabled={ledger.length === 0}>
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Button variant="secondary" onClick={shareWhatsApp} disabled={ledger.length === 0}>
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
            </div>

            {payOpen && (
              <div className="mt-3 space-y-3 rounded-2xl border border-brand/20 bg-brand-soft/40 p-3">
                <div className="flex items-center justify-between">
                  <label className="field-label mb-0">Amount received</label>
                  <span className="text-xs text-muted tabular">Due {formatINR(balance)}</span>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="field text-lg font-bold tabular"
                  autoFocus
                />
                <div className="flex gap-2">
                  {[["Full", balance], ["Half", Math.round(balance / 2)]].map(([l, v]) => (
                    <button key={l as string} type="button" onClick={() => setPayAmount(String(v))} className="min-h-10 flex-1 rounded-xl border border-border bg-surface text-sm font-semibold text-ink-soft hover:border-brand/40">
                      {l} · {formatINR(v as number)}
                    </button>
                  ))}
                </div>
                <div className="flex rounded-xl border border-border bg-surface p-1">
                  {(["CASH", "UPI"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={cn("min-h-10 flex-1 rounded-lg text-sm font-semibold transition-all", payMethod === m ? "bg-brand text-white shadow-sm" : "text-ink-soft")}
                    >
                      {m === "CASH" ? "Cash" : "UPI"}
                    </button>
                  ))}
                </div>
                {payError && <p className="text-sm font-medium text-danger">{payError}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={() => { setPayOpen(false); setPayError(null); }}>Cancel</Button>
                  <Button loading={submitting} onClick={() => recordPayment(parseFloat(payAmount))}>Confirm</Button>
                </div>
              </div>
            )}
          </div>

          {/* History */}
          <div className="px-4 pb-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-base font-bold text-ink">Khata</p>
              <div className="flex rounded-xl border border-border bg-paper p-0.5 text-xs font-semibold">
                {([["open", "Since last paid"], ["all", "All history"]] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setView(k)} className={cn("min-h-9 rounded-lg px-3 transition-all", view === k ? "bg-surface text-brand-dark shadow-sm" : "text-muted")}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                <div className="skeleton h-16" />
                <div className="skeleton h-16" />
              </div>
            ) : groups.length === 0 ? (
              <p className="rounded-xl bg-paper p-6 text-center text-sm text-muted">
                {view === "open" ? "Nothing pending — all settled." : "No udhaari yet."}
              </p>
            ) : (
              <div className="space-y-4">
                {groups.map(([dayKey, entries]) => {
                  const dayTotal = entries.filter((e) => e.type === "CREDIT_SALE").reduce((s2, e) => s2 + e.amount, 0);
                  return (
                    <div key={dayKey}>
                      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">
                        <span>{new Date(dayKey).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
                        {dayTotal > 0 && <span className="tabular">{formatINR(dayTotal)}</span>}
                      </div>
                      <ul className="overflow-hidden rounded-xl border border-border">
                        {entries.map((e) => {
                          const voided = e.invoice?.status === "CANCELLED" || e.invoice?.status === "REFUNDED";
                          return (
                            <li key={e.id} className={cn("flex items-start justify-between gap-3 border-b border-border px-3 py-2.5 last:border-b-0", e.type === "PAYMENT" && "bg-success-soft/50")}>
                              <div className="min-w-0">
                                {e.type === "CREDIT_SALE" ? (
                                  <>
                                    <p className={cn("text-sm font-semibold text-ink", voided && "line-through opacity-60")}>
                                      {e.invoice?.items.map((i) => `${Number(i.quantity)}× ${i.productName}`).join(", ") || "Credit bill"}
                                    </p>
                                    <p className="text-xs text-muted">
                                      {new Date(e.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                                      {e.invoice ? ` · ${e.invoice.invoiceNumber}` : ""}
                                      {voided ? ` · ${(e.invoice?.status ?? "").toLowerCase()}` : ""}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-sm font-semibold text-ink">{e.type === "PAYMENT" ? "Payment received" : "Adjustment"}</p>
                                    <p className="text-xs text-muted">
                                      {new Date(e.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                                      {e.note ? ` · ${e.note}` : ""}
                                    </p>
                                  </>
                                )}
                              </div>
                              <div className="shrink-0 text-right">
                                <p className={cn("text-sm font-extrabold tabular", e.type === "CREDIT_SALE" ? "text-ink" : "text-success")}>
                                  {e.type === "CREDIT_SALE" ? "+" : "−"}
                                  {formatINR(e.amount)}
                                </p>
                                <p className="text-[11px] text-muted tabular">Bal {formatINR(e.balanceAfter)}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
