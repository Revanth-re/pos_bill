"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Minus, X, History } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductImage";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { useCatalogStore } from "@/stores/catalogStore";

interface ProductStock {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  imageUrl: string | null;
}

interface Movement {
  id: string;
  productName: string;
  unit: string;
  type: "OPENING" | "PURCHASE" | "SALE" | "ADJUSTMENT" | "DAMAGE" | "RECIPE_DEDUCTION";
  quantity: number;
  reason: string | null;
  staffName: string;
  createdAt: string;
}

const TYPE_LABEL: Record<Movement["type"], string> = {
  OPENING: "Opening stock",
  PURCHASE: "Purchase",
  SALE: "Sale",
  ADJUSTMENT: "Adjustment",
  DAMAGE: "Damage",
  RECIPE_DEDUCTION: "Recipe use",
};

const MOVEMENTS_KEY = "pos-inventory-movements-v1";

export function InventoryScreen({ canAdjust }: { canAdjust: boolean }) {
  const managedProducts = useCatalogStore((s) => s.managedProducts);
  const loadingManaged = useCatalogStore((s) => s.loadingManaged);
  const ensureManagedCatalog = useCatalogStore((s) => s.ensureManagedCatalog);
  const patchPosStock = useCatalogStore((s) => s.patchPosStock);

  const [hydrated, setHydrated] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [adjusting, setAdjusting] = useState<ProductStock | null>(null);
  const [tab, setTab] = useState<"stock" | "history">("stock");

  useEffect(() => {
    if (useCatalogStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useCatalogStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void ensureManagedCatalog();
  }, [hydrated, ensureManagedCatalog]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(MOVEMENTS_KEY);
      if (raw) setMovements(JSON.parse(raw) as Movement[]);
    } catch {
      /* ignore */
    }

    let cancelled = false;
    (async () => {
      if (movements.length === 0) setMovementsLoading(true);
      try {
        const res = await fetch("/api/inventory/movements");
        if (!res.ok) return;
        const body = await res.json();
        const rows: Movement[] = (body.movements as Record<string, unknown>[]).map((m) => {
          const product = m.product as { name?: string; unit?: string } | null;
          const staff = m.staff as { user?: { name?: string } } | null;
          return {
            id: String(m.id),
            productName: product?.name ?? "—",
            unit: product?.unit ?? "",
            type: m.type as Movement["type"],
            quantity: Number(m.quantity),
            reason: (m.reason as string | null) ?? null,
            staffName: staff?.user?.name ?? "System",
            createdAt: String(m.createdAt),
          };
        });
        if (!cancelled) {
          setMovements(rows);
          sessionStorage.setItem(MOVEMENTS_KEY, JSON.stringify(rows));
        }
      } finally {
        if (!cancelled) setMovementsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  const stockList: ProductStock[] = useMemo(
    () =>
      managedProducts
        .filter((p) => p.status === "ACTIVE" && (p.trackInventory ?? true))
        .map((p) => ({
          id: p.id,
          name: p.name,
          unit: p.unit,
          currentStock: p.currentStock,
          minStock: p.minStock,
          imageUrl: p.imageUrl,
        })),
    [managedProducts]
  );

  const lowStock = stockList.filter((p) => p.currentStock <= p.minStock);
  const showBoot = stockList.length === 0 && (loadingManaged || !hydrated);

  function handleAdjusted(productId: string, newStock: number, movement: Movement) {
    patchPosStock(productId, newStock);
    setMovements((prev) => {
      const next = [movement, ...prev];
      try {
        sessionStorage.setItem(MOVEMENTS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    setAdjusting(null);
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Inventory</h1>
        <p className="text-base text-muted">{stockList.length} tracked items</p>
      </div>

      {lowStock.length > 0 && (
        <div className="border-2 border-danger bg-danger-soft p-3">
          <p className="text-sm font-bold text-danger">
            ⚠️ {lowStock.length} item{lowStock.length > 1 ? "s" : ""} at or below minimum stock
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setTab("stock")}
          className={cn(
            "touch-target rounded-md border-2 px-4 text-sm font-bold",
            tab === "stock" ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft"
          )}
        >
          Stock Levels
        </button>
        <button
          onClick={() => setTab("history")}
          className={cn(
            "touch-target rounded-md border-2 px-4 text-sm font-bold inline-flex items-center gap-1.5",
            tab === "history" ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft"
          )}
        >
          <History className="h-4 w-4" /> History
        </button>
      </div>

      {showBoot ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : tab === "stock" ? (
        <ul className="rounded-2xl border border-border bg-surface divide-y divide-border shadow-sm overflow-hidden">
          {stockList.map((p) => {
            const low = p.currentStock <= p.minStock;
            return (
              <li key={p.id} className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <ProductImage
                    src={p.imageUrl}
                    width={44}
                    height={44}
                    className="h-11 w-11 shrink-0 border-2 border-border object-cover"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-ink truncate">{p.name}</p>
                    <p className={cn("text-sm tabular", low ? "text-danger font-bold" : "text-muted")}>
                      {p.currentStock} {p.unit} {low && "· Low stock"}
                    </p>
                  </div>
                </div>
                {canAdjust && (
                  <Button size="sm" variant="secondary" onClick={() => setAdjusting(p)}>
                    Adjust
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="rounded-2xl border border-border bg-surface divide-y divide-border shadow-sm overflow-hidden">
          {movementsLoading && movements.length === 0 && (
            <li className="flex justify-center p-6">
              <Spinner className="h-5 w-5" />
            </li>
          )}
          {!movementsLoading && movements.length === 0 && (
            <li className="p-4 text-base text-muted">No stock movements yet.</li>
          )}
          {movements.map((m) => (
            <li key={m.id} className="p-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-ink">{m.productName}</p>
                <p className={cn("font-bold tabular", m.quantity < 0 ? "text-danger" : "text-success")}>
                  {m.quantity > 0 ? "+" : ""}
                  {m.quantity} {m.unit}
                </p>
              </div>
              <p className="text-sm text-muted">
                {TYPE_LABEL[m.type]} · {m.staffName} · {new Date(m.createdAt).toLocaleString("en-IN")}
                {m.reason ? ` · ${m.reason}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      {adjusting && (
        <AdjustSheet product={adjusting} onClose={() => setAdjusting(null)} onAdjusted={handleAdjusted} />
      )}
    </div>
  );
}

function AdjustSheet({
  product,
  onClose,
  onAdjusted,
}: {
  product: ProductStock;
  onClose: () => void;
  onAdjusted: (productId: string, newStock: number, movement: Movement) => void;
}) {
  const [direction, setDirection] = useState<"add" | "remove">("remove");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isDamage, setIsDamage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const n = parseFloat(amount);
    if (!n || n <= 0) {
      setError("Enter an amount greater than 0");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required");
      return;
    }
    setSubmitting(true);
    setError(null);

    const quantity = direction === "add" ? n : -n;
    const res = await fetch("/api/inventory/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, quantity, reason, isDamage }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Unable to save the adjustment.");
      return;
    }
    const body = await res.json();
    onAdjusted(product.id, Number(body.product.currentStock), {
      id: body.movement.id,
      productName: product.name,
      unit: product.unit,
      type: isDamage ? "DAMAGE" : "ADJUSTMENT",
      quantity: Number(body.movement.quantity),
      reason,
      staffName: "You",
      createdAt: body.movement.createdAt,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40">
      <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border border-border bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold text-ink">Adjust Stock</h2>
          <button onClick={onClose} className="touch-target rounded-full p-2 hover:bg-paper">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-lg font-bold text-ink">{product.name}</p>
            <p className="text-base text-muted tabular">Current: {product.currentStock} {product.unit}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDirection("add")}
              className={cn(
                "touch-target rounded-md border-2 flex items-center justify-center gap-1.5 text-sm font-bold",
                direction === "add" ? "border-success bg-success-soft text-success" : "border-border text-ink-soft"
              )}
            >
              <Plus className="h-4 w-4" /> Add Stock
            </button>
            <button
              onClick={() => setDirection("remove")}
              className={cn(
                "touch-target rounded-md border-2 flex items-center justify-center gap-1.5 text-sm font-bold",
                direction === "remove" ? "border-danger bg-danger-soft text-danger" : "border-border text-ink-soft"
              )}
            >
              <Minus className="h-4 w-4" /> Remove Stock
            </button>
          </div>

          <div>
            <label className="field-label">Amount ({product.unit})</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="field"
              placeholder="0"
            />
          </div>

          {direction === "remove" && (
            <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
              <input type="checkbox" checked={isDamage} onChange={(e) => setIsDamage(e.target.checked)} className="h-5 w-5 accent-brand" />
              This is damaged/spoiled stock
            </label>
          )}

          <div>
            <label className="field-label">Reason (required)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="field"
              placeholder="e.g. Stock count correction, spillage"
            />
          </div>

          {error && (
            <p className="border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error}</p>
          )}

          <Button className="w-full" size="lg" disabled={submitting} onClick={handleSubmit}>
            {submitting ? "Saving…" : "Save Adjustment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
