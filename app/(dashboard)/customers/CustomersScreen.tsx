"use client";

import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, Search, User, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatINR, cn } from "@/lib/utils";

interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
  outstandingBalance: number;
}

interface LedgerEntry {
  id: string;
  type: "CREDIT_SALE" | "PAYMENT" | "ADJUSTMENT";
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
  invoice: { invoiceNumber: string } | null;
}

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});
type CustomerFormValues = z.infer<typeof customerSchema>;

export function CustomersScreen({
  initialCustomers,
  canManage,
  canRecordPayment,
}: {
  initialCustomers: CustomerRow[];
  canManage: boolean;
  canRecordPayment: boolean;
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<CustomerRow | null>(null);

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) => c.name.toLowerCase().includes(query.toLowerCase()) || (c.phone ?? "").includes(query)
      ),
    [customers, query]
  );

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  function handleBalanceUpdated(customerId: string, newBalance: number) {
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, outstandingBalance: newBalance } : c)));
    setSelected((s) => (s && s.id === customerId ? { ...s, outstandingBalance: newBalance } : s));
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Customers &amp; Udhaari</h1>
          <p className="text-base text-muted">{customers.length} customers</p>
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
        <div className="border-2 border-border bg-ink p-4 text-white">
          <p className="text-sm font-semibold opacity-80">Total outstanding credit</p>
          <p className="text-3xl font-extrabold tabular">{formatINR(totalOutstanding)}</p>
        </div>
      )}

      <div className="flex items-center gap-2 border-2 border-border bg-surface px-3 touch-target">
        <Search className="h-5 w-5 text-muted shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or phone…"
          className="flex-1 bg-transparent py-2.5 text-base outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <p className="text-base text-muted mb-3">No customers yet</p>
          {canManage && <Button onClick={() => setFormOpen(true)}>Add Customer</Button>}
        </div>
      ) : (
        <ul className="rounded-2xl border border-border bg-surface divide-y divide-border shadow-sm overflow-hidden">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSelected(c)}
                className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-paper"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-border bg-paper text-ink-soft">
                    <User className="h-5 w-5" />
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
            setCustomers((prev) => [...prev, c]);
            setFormOpen(false);
          }}
        />
      )}

      {selected && (
        <CustomerDetailSheet
          customer={selected}
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border border-border bg-surface shadow-lg">
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
            <p className="border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{serverError}</p>
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
  canRecordPayment,
  onClose,
  onBalanceUpdated,
}: {
  customer: CustomerRow;
  canRecordPayment: boolean;
  onClose: () => void;
  onBalanceUpdated: (id: string, balance: number) => void;
}) {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(customer.outstandingBalance);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/customers/${customer.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setLedger(d.ledger ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customer.id]);

  async function handleRecordPayment() {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      setPaymentError("Enter an amount greater than 0");
      return;
    }
    setSubmitting(true);
    setPaymentError(null);
    const res = await fetch(`/api/customers/${customer.id}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setPaymentError(body.error ?? "Unable to record the payment.");
      return;
    }
    const body = await res.json();
    const newBalance = Number(body.customer.outstandingBalance);
    setBalance(newBalance);
    onBalanceUpdated(customer.id, newBalance);
    setLedger((prev) => [
      { id: body.entry.id, type: "PAYMENT", amount, balanceAfter: newBalance, note: null, createdAt: body.entry.createdAt, invoice: null },
      ...prev,
    ]);
    setPaymentOpen(false);
    setPaymentAmount("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-border bg-surface shadow-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="text-lg font-bold text-ink">{customer.name}</h2>
            {customer.phone && <p className="text-sm text-muted">{customer.phone}</p>}
          </div>
          <button onClick={onClose} className="touch-target rounded-full p-2 hover:bg-paper">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-border p-4">
          <p className="text-sm font-semibold text-muted">Outstanding balance</p>
          <p className={cn("text-3xl font-extrabold tabular", balance > 0 ? "text-danger" : "text-success")}>
            {formatINR(balance)}
          </p>
          {canRecordPayment && balance > 0 && (
            <Button className="mt-3 w-full" onClick={() => setPaymentOpen(true)}>
              <span className="inline-flex items-center gap-1.5">
                <IndianRupee className="h-4 w-4" /> Record Payment
              </span>
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="mb-2 text-sm font-bold text-ink-soft">Ledger</p>
          {loading && <p className="text-sm text-muted">Loading…</p>}
          {!loading && ledger.length === 0 && <p className="text-sm text-muted">No transactions yet.</p>}
          <ul className="divide-y divide-border rounded-2xl border border-border overflow-hidden">
            {ledger.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-bold text-ink">
                    {entry.type === "CREDIT_SALE" ? "Credit sale" : entry.type === "PAYMENT" ? "Payment received" : "Adjustment"}
                    {entry.invoice ? ` · ${entry.invoice.invoiceNumber}` : ""}
                  </p>
                  <p className="text-sm text-muted">{new Date(entry.createdAt).toLocaleString("en-IN")}</p>
                </div>
                <p className={cn("font-bold tabular", entry.type === "PAYMENT" ? "text-success" : "text-danger")}>
                  {entry.type === "PAYMENT" ? "-" : "+"}
                  {formatINR(entry.amount)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {paymentOpen && (
          <div className="border-t border-border p-4 space-y-3">
            <label className="field-label">Payment amount (up to {formatINR(balance)})</label>
            <input
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="field"
              placeholder="0"
              autoFocus
            />
            {paymentError && <p className="text-sm text-danger">{paymentError}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setPaymentOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRecordPayment} disabled={submitting}>
                {submitting ? "Saving…" : "Confirm"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
