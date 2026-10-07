"use client";

import { useState } from "react";
import { Minus, Plus, Trash2, Percent, Tag, Printer, Save } from "lucide-react";
import { useCartStore, estimateCartTotal } from "@/stores/cartStore";
import { formatINR, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LanguageProvider";

export function CartPanel({
  onQuickPrint,
  onSaveOnly,
  onCheckout,
  onHold,
  onUdhaari,
  printing,
}: {
  onQuickPrint: () => void;
  onSaveOnly?: () => void;
  onCheckout: () => void;
  onHold: () => void;
  onUdhaari?: () => void;
  printing?: boolean;
}) {
  const lines = useCartStore((s) => s.lines);
  const incrementLine = useCartStore((s) => s.incrementLine);
  const decrementLine = useCartStore((s) => s.decrementLine);
  const removeLine = useCartStore((s) => s.removeLine);
  const setLineDiscount = useCartStore((s) => s.setLineDiscount);
  const billDiscount = useCartStore((s) => s.billDiscount);
  const setBillDiscount = useCartStore((s) => s.setBillDiscount);
  const orderType = useCartStore((s) => s.orderType);
  const setOrderType = useCartStore((s) => s.setOrderType);

  const t = useT();

  const [discountingLineId, setDiscountingLineId] = useState<string | null>(null);

  const estimatedTotal = estimateCartTotal(lines);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-bold text-ink">{t("pos.cart")} {itemCount > 0 && `(${itemCount})`}</h2>
        <div className="flex rounded-xl border border-border bg-paper p-0.5 text-xs font-semibold">
          {(["TAKEAWAY", "DINE_IN"] as const).map((ot) => (
            <button
              key={ot}
              onClick={() => setOrderType(ot)}
              className={cn(
                "min-h-9 rounded-lg px-3 py-1.5 transition-all duration-150",
                orderType === ot ? "bg-brand text-white shadow-sm" : "text-ink-soft hover:text-ink"
              )}
            >
              {ot === "TAKEAWAY" ? t("pos.takeaway") : t("pos.dineIn")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {lines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted py-12">
            <p className="text-base font-semibold text-ink">Cart is empty</p>
            <p className="text-sm">Tap a product to add it</p>
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
                    <div className="flex items-center gap-0.5 rounded-xl border border-border bg-paper">
                      <button
                        onClick={() => decrementLine(line.product.id)}
                        className="touch-target flex w-11 items-center justify-center rounded-xl text-brand-dark hover:bg-brand-soft active:scale-95 transition-transform"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-7 text-center text-base font-bold tabular">{line.quantity}</span>
                      <button
                        onClick={() => incrementLine(line.product.id)}
                        className="touch-target flex w-11 items-center justify-center rounded-xl text-brand-dark hover:bg-brand-soft active:scale-95 transition-transform"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
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

          <div className="receipt-edge rounded-t-xl bg-brand-dark px-4 pt-3 pb-5 text-white">
            <div className="flex items-center justify-between text-sm opacity-80">
              <span>{t("pos.total")}</span>
              <span className="tabular text-2xl font-extrabold text-accent">{formatINR(estimatedTotal)}</span>
            </div>
            <p className="mt-0.5 text-xs opacity-70">Includes GST · Cash by default, tap Split for other methods</p>
          </div>

          <div className="flex gap-2">
            {onSaveOnly && (
              <Button variant="secondary" size="lg" className="px-5" onClick={onSaveOnly} disabled={printing}>
                <Save className="h-5 w-5" /> Save
              </Button>
            )}
            <Button variant="primary" size="lg" className="flex-1" onClick={onQuickPrint} loading={printing}>
              <span className="inline-flex items-center gap-2">
                <Printer className="h-5 w-5" />
                {printing ? t("pos.printing") : t("pos.printBill")}
              </span>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" size="sm" onClick={onHold}>
              {t("pos.holdBill")}
            </Button>
            {onUdhaari && (
              <Button variant="secondary" size="sm" className="border-accent-dark/40 bg-accent-soft text-brand-dark hover:bg-accent-soft" onClick={onUdhaari} disabled={printing}>
                Udhaari
              </Button>
            )}
            <Button variant="secondary" size="sm" className={onUdhaari ? "" : "col-span-2"} onClick={onCheckout}>
              {t("pos.splitCredit")}
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
    <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-paper p-2">
      <button
        onClick={() => setType(type === "PERCENT" ? "FIXED" : "PERCENT")}
        className="touch-target flex items-center gap-1 rounded-xl border border-border bg-surface px-2 text-xs font-semibold"
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
        className="w-20 rounded-xl border border-border bg-surface px-2 py-2 focus:border-brand focus:outline-none text-sm tabular"
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
            className="touch-target rounded-xl border border-border bg-surface px-2 text-xs font-semibold"
          >
            {type === "PERCENT" ? "%" : "₹ Fixed"}
          </button>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-20 rounded-xl border border-border bg-surface px-2 py-2 focus:border-brand focus:outline-none text-sm tabular"
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
