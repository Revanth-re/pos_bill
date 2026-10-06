"use client";

import { useEffect, useState } from "react";
import { Clock, PlayCircle, StopCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatINR, cn } from "@/lib/utils";
import { toast } from "@/stores/toastStore";

interface Summary {
  bills: number;
  totalSales: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  creditSales: number;
  cashRefunds: number;
  expectedCash: number;
}
interface Current {
  id: string;
  openedAt: string;
  openingCash: number;
  summary: Summary;
}
interface ClosedShift extends Summary {
  id: string;
  closedAt: string;
  openedAt: string;
  cashier: string;
  openingCash: number;
  actualCash: number;
  difference: number;
  note?: string;
}

const time = (d: string) => new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const date = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function Diff({ value, className }: { value: number; className?: string }) {
  const rounded = Math.round(value * 100) / 100;
  return (
    <span className={cn("tabular font-extrabold", rounded === 0 ? "text-success" : rounded > 0 ? "text-accent-dark" : "text-danger", className)}>
      {rounded > 0 ? "+" : ""}
      {formatINR(rounded)}
    </span>
  );
}

export function ShiftsScreen({ seeAll }: { seeAll: boolean }) {
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<Current | null>(null);
  const [recent, setRecent] = useState<ClosedShift[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cash, setCash] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const [tick, setTick] = useState(0);
  const load = () => setTick((n) => n + 1);

  useEffect(() => {
    let alive = true;
    fetch("/api/shifts")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        if (!alive) return;
        setCurrent(body.current);
        setRecent(body.recent);
        setError(null);
      })
      .catch((e) => alive && setError(e instanceof Error && e.message ? e.message : "Unable to load shifts."))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [tick]);

  async function submit(action: "open" | "close") {
    const amount = parseFloat(cash);
    if (isNaN(amount) || amount < 0) {
      toast.error(action === "open" ? "Enter the opening cash in the drawer." : "Enter the cash you counted.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "open" ? { action, openingCash: amount } : { action, actualCash: amount, note: note || undefined }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      toast.error(body.error ?? "Something went wrong.");
      return;
    }
    toast.success(action === "open" ? "Shift opened" : "Shift closed");
    setCash("");
    setNote("");
    load();
  }

  const counted = parseFloat(cash);
  const liveDiff = current && !isNaN(counted) ? counted - current.summary.expectedCash : null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Cashier Shift</h1>
        <p className="text-sm text-muted">Open your drawer, bill as usual, count and close.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <p className="font-semibold text-danger">{error}</p>
          <Button variant="secondary" className="mt-3" onClick={load}>Try again</Button>
        </div>
      ) : !current ? (
        <div className="card mx-auto max-w-md space-y-4 p-5 lg:mx-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
              <PlayCircle className="h-6 w-6 text-brand" />
            </div>
            <div>
              <p className="font-bold text-ink">No shift open</p>
              <p className="text-sm text-muted">Count the drawer and start your shift.</p>
            </div>
          </div>
          <div>
            <label className="field-label">Opening cash</label>
            <input type="number" inputMode="decimal" min="0" value={cash} onChange={(e) => setCash(e.target.value)} className="field text-lg font-bold tabular" placeholder="₹0" />
          </div>
          <Button size="lg" className="w-full" loading={busy} onClick={() => submit("open")}>
            <PlayCircle className="h-5 w-5" /> Open Shift
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between bg-brand-dark p-4 text-white">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-medium text-white/70"><Clock className="h-3.5 w-3.5" /> Open since {time(current.openedAt)}</p>
                <p className="mt-1 text-3xl font-extrabold tabular text-accent">{formatINR(current.summary.totalSales)}</p>
                <p className="text-sm text-white/70 tabular">{current.summary.bills} bills this shift</p>
              </div>
              <span className="rounded-lg bg-success px-2.5 py-1 text-xs font-bold">LIVE</span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-border">
              {[
                ["Cash", current.summary.cashSales],
                ["UPI", current.summary.upiSales],
                ["Card", current.summary.cardSales],
                ["Credit", current.summary.creditSales],
              ].map(([label, v]) => (
                <div key={label as string} className="bg-surface p-3">
                  <p className="text-xs font-medium text-muted">{label}</p>
                  <p className="text-lg font-extrabold text-ink tabular">{formatINR(v as number)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-3 p-4">
            <p className="flex items-center gap-2 font-bold text-ink"><Wallet className="h-5 w-5 text-brand" /> Cash reconciliation</p>
            <div className="space-y-1.5 text-sm">
              <Row label="Opening cash" value={formatINR(current.openingCash)} />
              <Row label="+ Cash sales" value={formatINR(current.summary.cashSales)} />
              <Row label="− Cash refunds" value={formatINR(current.summary.cashRefunds)} />
              <Row label="Expected cash" value={formatINR(current.summary.expectedCash)} bold />
            </div>
            <div>
              <label className="field-label">Actual cash counted</label>
              <input type="number" inputMode="decimal" min="0" value={cash} onChange={(e) => setCash(e.target.value)} className="field text-lg font-bold tabular" placeholder="₹0" />
            </div>
            {liveDiff !== null && (
              <div className="flex items-center justify-between rounded-xl bg-paper px-3 py-2">
                <span className="text-sm font-semibold text-ink-soft">Difference</span>
                <Diff value={liveDiff} className="text-lg" />
              </div>
            )}
            <input value={note} onChange={(e) => setNote(e.target.value)} className="field" placeholder="Note (optional)" maxLength={300} />
            <Button size="lg" variant="gold" className="w-full" loading={busy} onClick={() => submit("close")}>
              <StopCircle className="h-5 w-5" /> Close Shift
            </Button>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-lg font-bold text-ink">{seeAll ? "Recent shifts" : "Your recent shifts"}</h2>
        {recent.length === 0 ? (
          <div className="card p-6 text-center text-sm text-muted">No closed shifts yet.</div>
        ) : (
          <>
            <ul className="space-y-2 md:hidden">
              {recent.map((s) => (
                <li key={s.id} className="card p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink">{s.cashier}</p>
                      <p className="text-xs text-muted">{date(s.closedAt)} · {time(s.openedAt)}–{time(s.closedAt)} · {s.bills} bills</p>
                    </div>
                    <p className="font-extrabold text-ink tabular">{formatINR(s.totalSales)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-paper px-2.5 py-1.5 text-sm">
                    <span className="text-muted tabular">Exp {formatINR(s.expectedCash)} · Act {formatINR(s.actualCash)}</span>
                    <Diff value={s.difference} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="card hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-paper text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">Cashier</th>
                    <th className="px-3 py-3">Shift</th>
                    <th className="px-3 py-3 text-right">Bills</th>
                    <th className="px-3 py-3 text-right">Sales</th>
                    <th className="hidden px-3 py-3 text-right lg:table-cell">Expected</th>
                    <th className="hidden px-3 py-3 text-right lg:table-cell">Actual</th>
                    <th className="px-4 py-3 text-right">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recent.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-semibold text-ink">{s.cashier}</td>
                      <td className="px-3 py-3 text-ink-soft tabular">{date(s.closedAt)}, {time(s.openedAt)}–{time(s.closedAt)}</td>
                      <td className="px-3 py-3 text-right tabular">{s.bills}</td>
                      <td className="px-3 py-3 text-right font-bold tabular">{formatINR(s.totalSales)}</td>
                      <td className="hidden px-3 py-3 text-right tabular lg:table-cell">{formatINR(s.expectedCash)}</td>
                      <td className="hidden px-3 py-3 text-right tabular lg:table-cell">{formatINR(s.actualCash)}</td>
                      <td className="px-4 py-3 text-right"><Diff value={s.difference} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between", bold ? "border-t border-border pt-1.5 text-base font-extrabold text-ink" : "text-ink-soft")}>
      <span>{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}
