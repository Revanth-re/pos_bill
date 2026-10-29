"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Store, ArrowRightLeft, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatINR, cn } from "@/lib/utils";
import { toast } from "@/stores/toastStore";
import { useSyncStore } from "@/stores/syncStore";
import type { OutletSummary } from "@/lib/outlets";

/** Clears everything saved on this phone for the current outlet, so the next one starts clean. */
function clearOutletCache() {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith("pos-") || k.startsWith("billo-")) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
  navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_PAGES" });
}

export function OutletsScreen({ outlets, canAdd }: { outlets: OutletSummary[]; canAdd: boolean }) {
  const router = useRouter();
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const [switching, setSwitching] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const withSales = outlets.filter((o) => o.today);
  const combinedToday = withSales.reduce((s, o) => s + (o.today?.sales ?? 0), 0);
  const combinedBills = withSales.reduce((s, o) => s + (o.today?.bills ?? 0), 0);
  const combinedMonth = withSales.reduce((s, o) => s + (o.month?.sales ?? 0), 0);

  async function switchTo(o: OutletSummary) {
    if (pendingCount > 0) {
      toast.error(`${pendingCount} offline bill${pendingCount > 1 ? "s" : ""} not synced yet. Connect to the internet and wait for sync before switching outlet.`);
      return;
    }
    setSwitching(o.businessId);
    const res = await fetch("/api/outlets/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: o.businessId }),
    }).catch(() => null);
    if (!res?.ok) {
      setSwitching(null);
      const body = await res?.json().catch(() => ({}));
      toast.error(body?.error ?? "Couldn't switch outlet. Check your internet.");
      return;
    }
    clearOutletCache();
    window.location.replace("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink sm:text-[28px]">Outlets</h1>
        <p className="text-base text-muted">All your shops in one place. Tap an outlet to bill there.</p>
      </div>

      {withSales.length > 1 && (
        <section className="grid grid-cols-3 gap-3 rounded-2xl bg-brand-dark p-4 text-white">
          <Stat label="Today · all outlets" value={formatINR(combinedToday)} />
          <Stat label="Bills today" value={String(combinedBills)} />
          <Stat label="This month" value={formatINR(combinedMonth)} />
        </section>
      )}

      <ul className="space-y-3">
        {outlets.map((o) => (
          <li key={o.businessId} className={cn("card p-4", o.isCurrent && "ring-2 ring-brand")}>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                <Store className="h-5 w-5 text-brand" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold text-ink">{o.name}</p>
                <p className="text-sm text-muted">
                  {[o.city, o.role === "OWNER" ? "Owner" : o.role === "MANAGER" ? "Manager" : "Cashier"].filter(Boolean).join(" · ")}
                </p>
              </div>
              {o.isCurrent ? (
                <span className="flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success">
                  <Check className="h-3.5 w-3.5" /> Current
                </span>
              ) : (
                <Button size="sm" loading={switching === o.businessId} disabled={!!switching} onClick={() => void switchTo(o)}>
                  <ArrowRightLeft className="h-4 w-4" /> Switch
                </Button>
              )}
            </div>
            {o.today && (
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-paper p-3 text-center">
                <MiniStat label="Today" value={formatINR(o.today.sales)} />
                <MiniStat label="Bills" value={String(o.today.bills)} />
                <MiniStat label="Month" value={formatINR(o.month?.sales ?? 0)} />
              </div>
            )}
          </li>
        ))}
      </ul>

      {canAdd &&
        (adding ? (
          <AddOutletForm
            onClose={() => setAdding(false)}
            onAdded={() => {
              setAdding(false);
              toast.success("Outlet added — tap Switch to start billing there");
              router.refresh();
            }}
          />
        ) : (
          <Button variant="secondary" className="w-full" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add outlet
          </Button>
        ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">{label}</p>
      <p className="mt-1 text-lg font-extrabold tabular text-accent sm:text-2xl">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-bold tabular text-ink">{value}</p>
    </div>
  );
}

function AddOutletForm({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/outlets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, city: city || undefined }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      const body = await res?.json().catch(() => ({}));
      setError(body?.error ?? "Couldn't add the outlet. Check your internet.");
      return;
    }
    onAdded();
  }

  return (
    <section className="card space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Add outlet</h2>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-paper" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div>
        <label className="field-label" htmlFor="outlet-name">Outlet name</label>
        <input id="outlet-name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sri Krishna Tiffins – Kukatpally" />
      </div>
      <div>
        <label className="field-label" htmlFor="outlet-city">Area / city (optional)</label>
        <input id="outlet-city" className="field" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Kukatpally, Hyderabad" />
      </div>
      <p className="rounded-xl bg-brand-soft/60 px-3 py-2.5 text-sm text-brand-dark">
        The new outlet uses the <b>same menu as your main shop</b> (changes show everywhere). Add outlet-only items from Products while
        that outlet is open. Bill format and top items are copied.
      </p>
      {error && <p className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error}</p>}
      <Button className="w-full" loading={saving} disabled={name.trim().length < 2} onClick={() => void submit()}>
        <Plus className="h-4 w-4" /> Add outlet
      </Button>
    </section>
  );
}
