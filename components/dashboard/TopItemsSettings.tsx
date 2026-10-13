"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Plus, Search, X } from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import { useCatalogStore } from "@/stores/catalogStore";
import { cacheTopItems, type TopCount, type TopItems } from "@/lib/pos/topItems";
import { toast } from "@/stores/toastStore";
import { cn, formatINR } from "@/lib/utils";

/** Owner picks the products (and order) shown in the Billing screen's "Top" tab. Saves automatically. */
export function TopItemsSettings({ initial, canEdit }: { initial: TopItems; canEdit: boolean }) {
  const products = useCatalogStore((s) => s.products);
  const ensurePosCatalog = useCatalogStore((s) => s.ensurePosCatalog);
  const [value, setValue] = useState<TopItems>(initial);
  const [saved, setSaved] = useState<TopItems>(initial);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [q, setQ] = useState("");
  const dirty = JSON.stringify(value) !== JSON.stringify(saved);

  useEffect(() => {
    void ensurePosCatalog();
  }, [ensurePosCatalog]);

  // Auto-save shortly after each change.
  useEffect(() => {
    if (!canEdit || !dirty) return;
    const toSave = value;
    const id = window.setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch("/api/settings/top-items", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topItems: toSave }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Couldn't save top items.");
        cacheTopItems(body.topItems);
        setSaved(toSave);
        setSaveError(false);
      } catch (e) {
        setSaveError(true);
        toast.error(e instanceof Error ? e.message : "Couldn't save top items.");
      } finally {
        setSaving(false);
      }
    }, 500);
    return () => window.clearTimeout(id);
  }, [value, dirty, canEdit]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const picked = value.productIds.slice(0, value.count);
  const full = picked.length >= value.count;
  const available = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter((p) => !value.productIds.includes(p.id) && (!term || p.name.toLowerCase().includes(term)));
  }, [products, value.productIds, q]);

  const setCount = (count: TopCount) => setValue((v) => ({ count, productIds: v.productIds.slice(0, count) }));
  const add = (id: string) => setValue((v) => (v.productIds.length >= v.count ? v : { ...v, productIds: [...v.productIds, id] }));
  const remove = (id: string) => setValue((v) => ({ ...v, productIds: v.productIds.filter((x) => x !== id) }));
  const move = (i: number, dir: -1 | 1) =>
    setValue((v) => {
      const ids = [...v.productIds];
      const j = i + dir;
      if (j < 0 || j >= ids.length) return v;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      return { ...v, productIds: ids };
    });

  return (
    <div className="space-y-4">
      {/* How many */}
      <div>
        <p className="field-label">How many top items</p>
        <div className="flex rounded-xl border border-border bg-paper p-1">
          {([4, 6, 12] as const).map((n) => (
            <button
              key={n}
              type="button"
              disabled={!canEdit}
              onClick={() => setCount(n)}
              className={cn(
                "min-h-10 flex-1 rounded-lg text-sm font-semibold transition-all duration-150",
                value.count === n ? "bg-surface text-brand-dark shadow-sm" : "text-muted hover:text-ink"
              )}
            >
              {n}
              {n === 12 && <span className="ml-1 text-xs font-medium text-muted">(2 pages)</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Picked, in order */}
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="field-label">Shown on Billing, in this order</p>
          <span className="text-xs font-medium text-muted tabular">
            {picked.length} / {value.count}
          </span>
        </div>
        {picked.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted">
            No top items yet — add your fastest-selling products below.
          </p>
        ) : (
          <ol className="overflow-hidden rounded-xl border border-border">
            {picked.map((id, i) => {
              const p = byId.get(id);
              return (
                <li key={id} className="flex min-h-14 items-center gap-2.5 border-b border-border px-2.5 last:border-b-0">
                  <span className="w-5 shrink-0 text-center text-sm font-bold text-muted tabular">{i + 1}</span>
                  <ProductImage src={p?.imageUrl} width={40} height={40} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{p?.name ?? "Removed product"}</span>
                    {p && <span className="block text-xs text-muted tabular">{formatINR(p.sellingPrice)}</span>}
                  </span>
                  {canEdit && (
                    <span className="flex shrink-0 items-center">
                      <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn label="Move down" disabled={i === picked.length - 1} onClick={() => move(i, 1)}>
                        <ArrowDown className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn label="Remove" onClick={() => remove(id)}>
                        <X className="h-4 w-4 text-danger" />
                      </IconBtn>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Add */}
      {canEdit && (
        <div>
          <p className="field-label">{full ? `All ${value.count} picked — remove one to add another` : "Add products"}</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="field" style={{ paddingLeft: "2.75rem" }} />
          </div>
          <ul className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-border">
            {available.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-muted">{products.length ? "No more products" : "Loading products…"}</li>
            ) : (
              available.map((p) => (
                <li key={p.id} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    disabled={full}
                    onClick={() => add(p.id)}
                    className="flex min-h-12 w-full items-center gap-2.5 px-2.5 text-left hover:bg-paper disabled:opacity-40"
                  >
                    <ProductImage src={p.imageUrl} width={36} height={36} className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{p.name}</span>
                    <span className="shrink-0 text-sm text-muted tabular">{formatINR(p.sellingPrice)}</span>
                    <Plus className="h-4 w-4 shrink-0 text-brand" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {canEdit ? (
        <p className={cn("flex items-center gap-1.5 text-xs font-medium", saveError && !saving ? "text-danger" : "text-muted")} aria-live="polite">
          {saveError && !saving ? (
            "Not saved — check your internet and change again"
          ) : saving || dirty ? (
            "Saving…"
          ) : (
            <>
              <Check className="h-3.5 w-3.5 text-success" /> Saved automatically for all devices
            </>
          )}
        </p>
      ) : (
        <p className="text-xs text-muted">Only the owner can change top items.</p>
      )}
    </div>
  );
}

function IconBtn({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-10 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-paper disabled:opacity-30"
    >
      {children}
    </button>
  );
}
