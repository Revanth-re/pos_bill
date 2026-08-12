"use client";

import { useState } from "react";
import { Minus, Plus, Trash2, Percent, Tag } from "lucide-react";
import { useCartStore, estimateCartTotal } from "@/stores/cartStore";
import { formatINR, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function CartPanel({ onCheckout, onHold }: { onCheckout: () => void; onHold: () => void }) {
  const lines = useCartStore((s) => s.lines);
  const incrementLine = useCartStore((s) => s.incrementLine);
  const decrementLine = useCartStore((s) => s.decrementLine);
  const removeLine = useCartStore((s) => s.removeLine);
  const setLineDiscount = useCartStore((s) => s.setLineDiscount);
  const billDiscount = useCartStore((s) => s.billDiscount);
  const setBillDiscount = useCartStore((s) => s.setBillDiscount);
  const orderType = useCartStore((s) => s.orderType);
  const setOrderType = useCartStore((s) => s.setOrderType);

  const [discountingLineId, setDiscountingLineId] = useState<string | null>(null);

  const estimatedTotal = estimateCartTotal(lines);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-bold text-ink">Cart {itemCount > 0 && `(${itemCount})`}</h2>
        <div className="flex rounded-full border border-border p-0.5 text-xs font-semibold">
          {(["TAKEAWAY", "DINE_IN"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              className={cn(
                "rounded-full px-3 py-1.5 transition-colors",
                orderType === t ? "bg-ink text-white" : "text-ink-soft"
              )}
            >
              {t === "TAKEAWAY" ? "Takeaway" : "Dine-in"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {lines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted py-12">
            <p className="text-sm">Cart is empty</p>
            <p className="text-xs">Tap a product to add it</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {lines.map((line) => {
              const base = line.product.sellingPrice * line.quantity;
              const discountAmount = !line.discount
                ? 0
                : line.discount.type === "PERCENT"
                ? (base * line.discount.value) / 100
                : Math.min(line.discount.value, base);

              return (
                <li key={line.product.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{line.product.name}</p>
                      <p className="text-xs text-muted tabular">
                        {formatINR(line.product.sellingPrice)} × {line.quantity}
                        {discountAmount > 0 && (
                          <span className="text-success"> · -{formatINR(discountAmount)}</span>
                        )}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-ink tabular">
                      {formatINR(base - discountAmount)}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-full border border-border">
                      <button
                        onClick={() => decrementLine(line.product.id)}
                        className="touch-target rounded-full p-2 hover:bg-paper"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold tabular">{line.quantity}</span>
                      <button
                        onClick={() => incrementLine(line.product.id)}
                        className="touch-target rounded-full p-2 hover:bg-paper"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setDiscountingLineId(discountingLineId === line.product.id ? null : line.product.id)
                        }
                        className="touch-target rounded-full p-2 text-muted hover:bg-paper hover:text-ink"
                        aria-label="Item discount"
                      >
                        <Tag className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeLine(line.product.id)}
                        className="touch-target rounded-full p-2 text-muted hover:bg-danger-soft hover:text-danger"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {discountingLineId === line.product.id && (
                    <LineDiscountEditor
                      value={line.discount}
                      onChange={(d) => {
                        setLineDiscount(line.product.id, d);
                        setDiscountingLineId(null);
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {lines.length > 0 && (
        <div className="border-t border-border p-4 space-y-3">
          <BillDiscountRow value={billDiscount} onChange={setBillDiscount} />

          <div className="receipt-edge bg-ink px-4 pt-3 pb-5 text-white">
            <div className="flex items-center justify-between text-sm opacity-80">
              <span>Estimated total</span>
              <span className="tabular">{formatINR(estimatedTotal)}</span>
            </div>
            <p className="mt-0.5 text-[11px] opacity-60">
              Final total (incl. GST) is confirmed at payment
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="secondary" onClick={onHold}>
              Hold Bill
            </Button>
            <Button variant="primary" onClick={onCheckout}>
              Charge {formatINR(estimatedTotal)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function LineDiscountEditor({
  value,
  onChange,
}: {
  value?: { type: "PERCENT" | "FIXED"; value: number };
  onChange: (d?: { type: "PERCENT" | "FIXED"; value: number }) => void;
}) {
  const [type, setType] = useState<"PERCENT" | "FIXED">(value?.type ?? "PERCENT");
  const [amount, setAmount] = useState(value?.value?.toString() ?? "");

  return (
    <div className="mt-2 flex items-center gap-2 border-2 border-border bg-paper p-2">
      <button
        onClick={() => setType(type === "PERCENT" ? "FIXED" : "PERCENT")}
        className="touch-target flex items-center gap-1 rounded-md border border-border bg-surface px-2 text-xs font-semibold"
      >
        {type === "PERCENT" ? <Percent className="h-3 w-3" /> : "₹"}
        {type === "PERCENT" ? "%" : "Fixed"}
      </button>
      <input
        type="number"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0"
        className="w-20 border-2 border-border bg-surface px-2 py-2 text-sm tabular"
      />
      <Button
        size="sm"
        onClick={() => {
          const n = parseFloat(amount);
          onChange(n > 0 ? { type, value: n } : undefined);
        }}
      >
        Apply
      </Button>
    </div>
  );
}

function BillDiscountRow({
  value,
  onChange,
}: {
  value?: { type: "PERCENT" | "FIXED"; value: number };
  onChange: (d?: { type: "PERCENT" | "FIXED"; value: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"PERCENT" | "FIXED">(value?.type ?? "PERCENT");
  const [amount, setAmount] = useState(value?.value?.toString() ?? "");

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-xs font-semibold text-ink-soft"
      >
        <span>Bill discount</span>
        <span className="text-brand">{value ? `${value.type === "PERCENT" ? value.value + "%" : formatINR(value.value)} applied` : "Add"}</span>
      </button>
      {open && (
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => setType(type === "PERCENT" ? "FIXED" : "PERCENT")}
            className="touch-target rounded-md border border-border bg-surface px-2 text-xs font-semibold"
          >
            {type === "PERCENT" ? "%" : "₹ Fixed"}
          </button>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-20 border-2 border-border bg-surface px-2 py-2 text-sm tabular"
          />
          <Button
            size="sm"
            onClick={() => {
              const n = parseFloat(amount);
              onChange(n > 0 ? { type, value: n } : undefined);
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
