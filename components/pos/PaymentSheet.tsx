"use client";

import { useMemo, useState } from "react";
import { X, Banknote, Smartphone, CreditCard, HandCoins, User } from "lucide-react";
import { useCartStore, estimateCartTotal } from "@/stores/cartStore";
import { formatINR, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { submitBill } from "@/lib/billing/submitBill";
import { CustomerPickerSheet } from "./CustomerPickerSheet";
import type { CheckoutInput } from "@/validations/billing";

type Method = "CASH" | "UPI" | "CARD" | "CREDIT";

const METHODS: { id: Method; label: string; icon: typeof Banknote }[] = [
  { id: "CASH", label: "Cash", icon: Banknote },
  { id: "UPI", label: "UPI", icon: Smartphone },
  { id: "CARD", label: "Card", icon: CreditCard },
  { id: "CREDIT", label: "Credit / Udhaari", icon: HandCoins },
];

export function PaymentSheet({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (result: { invoice?: unknown; offline: boolean }) => void;
}) {
  const lines = useCartStore((s) => s.lines);
  const orderType = useCartStore((s) => s.orderType);
  const billDiscount = useCartStore((s) => s.billDiscount);
  const customerId = useCartStore((s) => s.customerId);
  const customerName = useCartStore((s) => s.customerName);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const heldBillId = useCartStore((s) => s.heldBillId);
  const clear = useCartStore((s) => s.clear);

  const estimatedTotal = estimateCartTotal(lines);

  const [splits, setSplits] = useState<{ method: Method; amount: string }[]>([
    { method: "CASH", amount: estimatedTotal.toFixed(2) },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);

  const totalEntered = useMemo(
    () => splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0),
    [splits]
  );
  const remaining = Math.round((estimatedTotal - totalEntered) * 100) / 100;

  if (!open) return null;

  function setMethodAmount(index: number, amount: string) {
    setSplits((s) => s.map((row, i) => (i === index ? { ...row, amount } : row)));
  }

  function toggleMethod(method: Method) {
    setSplits((s) => {
      const exists = s.find((r) => r.method === method);
      if (exists) return s.filter((r) => r.method !== method);
      const alreadyEntered = s.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
      const suggested = Math.max(0, estimatedTotal - alreadyEntered);
      return [...s, { method, amount: suggested.toFixed(2) }];
    });
    if (method === "CREDIT" && !customerId) {
      setCustomerPickerOpen(true);
    }
  }

  const needsCustomer = splits.some((s) => s.method === "CREDIT") && !customerId;

  async function handleSubmit() {
    if (Math.abs(remaining) > 0.01) {
      setError(`₹${Math.abs(remaining).toFixed(2)} ${remaining > 0 ? "remaining" : "over"} — amounts must match the total.`);
      return;
    }
    if (needsCustomer) {
      setCustomerPickerOpen(true);
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload: Omit<CheckoutInput, "clientId"> = {
      orderType,
      items: lines.map((l) => ({
        productId: l.product.id,
        quantity: l.quantity,
        discount: l.discount,
      })),
      billDiscount,
      customerId,
      payments: splits.map((s) => ({ method: s.method, amount: parseFloat(s.amount) || 0 })),
      heldBillId,
    };

    const result = await submitBill(payload);

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    clear();
    onSuccess({ invoice: result.invoice, offline: result.offline });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-border bg-surface shadow-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold text-ink">Payment</h2>
          <button onClick={onClose} className="touch-target rounded-full p-2 hover:bg-paper">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="border-2 border-gold bg-gold-soft px-4 py-3 text-center">
            <p className="text-sm font-medium text-ink-soft">Amount due</p>
            <p className="text-3xl font-extrabold text-ink tabular">{formatINR(estimatedTotal)}</p>
          </div>

          <button
            onClick={() => setCustomerPickerOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm text-left touch-target hover:border-brand/40"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-border bg-paper text-ink-soft">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-soft">Customer</p>
              <p className="font-bold text-ink">{customerName || "None — tap to select"}</p>
            </div>
            {customerId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCustomer(undefined, undefined);
                }}
                className="text-sm font-semibold text-danger"
              >
                Clear
              </button>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            {METHODS.map(({ id, label, icon: Icon }) => {
              const active = splits.some((s) => s.method === id);
              return (
                <button
                  key={id}
                  onClick={() => toggleMethod(id)}
                  className={cn(
                    "touch-target flex flex-col items-center justify-center gap-1 rounded-md border-2 p-3 text-sm font-bold transition-colors",
                    active
                      ? "border-brand bg-brand-soft text-brand-dark"
                      : "border-border text-ink-soft hover:border-brand/40"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              );
            })}
          </div>

          {splits.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-ink-soft">
                {splits.length > 1 ? "Split payment amounts" : "Amount"}
              </p>
              {splits.map((row, i) => (
                <div key={row.method} className="flex items-center justify-between gap-3">
                  <span className="w-32 text-sm font-semibold text-ink">
                    {METHODS.find((m) => m.id === row.method)?.label}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={row.amount}
                    onChange={(e) => setMethodAmount(i, e.target.value)}
                    className="flex-1 border-2 border-border px-3 py-3 text-right text-base tabular"
                  />
                </div>
              ))}
              <div
                className={cn(
                  "flex items-center justify-between text-sm font-bold pt-1",
                  Math.abs(remaining) < 0.01 ? "text-success" : "text-danger"
                )}
              >
                <span>{Math.abs(remaining) < 0.01 ? "Fully paid" : remaining > 0 ? "Remaining" : "Over by"}</span>
                <span className="tabular">{formatINR(Math.abs(remaining))}</span>
              </div>
            </div>
          )}

          {needsCustomer && (
            <p className="border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              Select a customer before charging to credit.
            </p>
          )}

          {error && (
            <p className="border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error}</p>
          )}
        </div>

        <div className="border-t border-border p-4">
          <Button className="w-full" size="lg" disabled={submitting} onClick={handleSubmit}>
            {submitting ? "Processing…" : `Confirm ${formatINR(estimatedTotal)}`}
          </Button>
        </div>
      </div>

      <CustomerPickerSheet
        open={customerPickerOpen}
        onClose={() => setCustomerPickerOpen(false)}
        onSelect={(id, name) => {
          setCustomer(id, name);
          setCustomerPickerOpen(false);
        }}
      />
    </div>
  );
}
