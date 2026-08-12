"use client";

import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useCartStore, type CartLine } from "@/stores/cartStore";

interface HeldBillRow {
  id: string;
  label: string | null;
  createdAt: string;
  cartJson: {
    items: { productId: string; quantity: number; discount?: { type: "PERCENT" | "FIXED"; value: number } }[];
    orderType: "DINE_IN" | "TAKEAWAY";
  };
  staff: { user: { name: string } };
}

/** Products already loaded on the POS screen — used to hydrate a held
 * bill's cartJson (which only stores productId/qty) back into full CartLines. */
export function HeldBillsSheet({
  open,
  onClose,
  productsById,
}: {
  open: boolean;
  onClose: () => void;
  productsById: Map<string, { id: string; name: string; sellingPrice: number; gstPercent: number; unit: string; currentStock: number; trackInventory: boolean; imageUrl: string | null }>;
}) {
  const [bills, setBills] = useState<HeldBillRow[]>([]);
  const [loading, setLoading] = useState(false);
  const loadHeldBill = useCartStore((s) => s.loadHeldBill);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/held-bills");
        const d = await res.json();
        if (!cancelled) setBills(d.heldBills ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  async function handleDelete(id: string) {
    await fetch(`/api/held-bills/${id}`, { method: "DELETE" });
    setBills((b) => b.filter((row) => row.id !== id));
  }

  function handleResume(bill: HeldBillRow) {
    const lines: CartLine[] = [];
    for (const i of bill.cartJson.items) {
      const product = productsById.get(i.productId);
      if (!product) continue;
      lines.push({ product, quantity: i.quantity, discount: i.discount });
    }
    loadHeldBill(bill.id, lines, bill.cartJson.orderType);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-md border-t-2 sm:border-2 border-ink bg-surface max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold text-ink">Held Bills</h2>
          <button onClick={onClose} className="touch-target rounded-full p-2 hover:bg-paper">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-sm text-muted">Loading…</p>}
          {!loading && bills.length === 0 && (
            <div className="py-10 text-center text-muted">
              <p className="text-sm">No held bills</p>
            </div>
          )}
          <ul className="space-y-2">
            {bills.map((bill) => {
              const total = bill.cartJson.items.reduce((sum, i) => {
                const p = productsById.get(i.productId);
                return sum + (p ? p.sellingPrice * i.quantity : 0);
              }, 0);
              return (
                <li
                  key={bill.id}
                  className="flex items-center justify-between border-2 border-border p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {bill.label || `Bill · ${bill.staff.user.name}`}
                    </p>
                    <p className="text-xs text-muted tabular">
                      {bill.cartJson.items.length} items · {formatINR(total)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleResume(bill)}>
                      Resume
                    </Button>
                    <button
                      onClick={() => handleDelete(bill.id)}
                      className="touch-target rounded-lg p-2 text-muted hover:bg-danger-soft hover:text-danger"
                      aria-label="Delete held bill"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
