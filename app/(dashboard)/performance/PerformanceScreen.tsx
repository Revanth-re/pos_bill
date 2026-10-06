"use client";

import { useEffect, useState } from "react";
import { Trophy, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatINR, cn } from "@/lib/utils";

type Range = "today" | "week" | "month";
interface StaffRow {
  id: string;
  name: string;
  role: string;
  status: string;
  bills: number;
  sales: number;
  avgBill: number;
  discounts: number;
  discountedBills: number;
  voidedBills: number;
  cancellationsDone: number;
  refundsDone: number;
  reprints: number;
  shifts: number;
  cashDifference: number;
}

const RANGES: { key: Range; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "7 days" },
  { key: "month", label: "30 days" },
];
const roleLabel = (r: string) => r.charAt(0) + r.slice(1).toLowerCase();

export function PerformanceScreen() {
  const [range, setRange] = useState<Range>("today");
  const [data, setData] = useState<{ totalSales: number; staff: StaffRow[] } | null>(null);
  const [loadedRange, setLoadedRange] = useState<Range | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = loadedRange !== range;

  useEffect(() => {
    fetch(`/api/reports/staff?range=${range}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error);
        setData(body);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error && e.message ? e.message : "Unable to load staff performance."))
      .finally(() => setLoadedRange(range));
  }, [range]);

  const active = data?.staff.filter((s) => s.bills > 0 || s.shifts > 0 || s.cancellationsDone + s.refundsDone > 0) ?? [];
  const top = active[0];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Staff Performance</h1>
          <p className="text-sm text-muted">Who billed what, discounts, cancellations and cash accuracy.</p>
        </div>
        <div className="flex rounded-xl border border-border bg-surface p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "min-h-10 rounded-lg px-3 text-sm font-semibold transition-colors duration-150",
                range === r.key ? "bg-brand text-white shadow-sm" : "text-ink-soft hover:bg-paper"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="card p-6 text-center font-semibold text-danger">{error}</div>
      ) : loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : active.length === 0 ? (
        <div className="card flex flex-col items-center p-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft">
            <Users className="h-6 w-6 text-brand" />
          </div>
          <p className="font-bold text-ink">No sales recorded for this period.</p>
        </div>
      ) : (
        <div className={cn("space-y-5 transition-opacity", loading && "opacity-60")}>
          {top && top.sales > 0 && (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-brand-dark p-4 text-white sm:p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                <Trophy className="h-6 w-6 text-brand-dark" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white/70">TOP PERFORMER</p>
                <p className="truncate text-xl font-extrabold">{top.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold tabular text-accent">{formatINR(top.sales)}</p>
                <p className="text-sm text-white/70 tabular">
                  {data && data.totalSales > 0 ? Math.round((top.sales / data.totalSales) * 100) : 0}% of sales · {top.bills} bills
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((s, idx) => {
              const share = data && data.totalSales > 0 ? (s.sales / data.totalSales) * 100 : 0;
              const diff = Math.round(s.cashDifference * 100) / 100;
              return (
                <div key={s.id} className="card p-4 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft font-extrabold text-brand-dark">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink">{s.name}</p>
                        <p className="text-xs text-muted">{roleLabel(s.role)} · #{idx + 1}</p>
                      </div>
                    </div>
                    <p className="text-lg font-extrabold text-ink tabular">{formatINR(s.sales)}</p>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper">
                    <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${Math.min(100, share)}%` }} />
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <Stat label="Bills" value={String(s.bills)} />
                    <Stat label="Avg bill" value={formatINR(s.avgBill)} />
                    <Stat label="Discounts" value={formatINR(s.discounts)} tone={s.discounts > 0 ? "warn" : undefined} />
                    <Stat label="Voided" value={String(s.voidedBills)} tone={s.voidedBills > 0 ? "bad" : undefined} />
                    <Stat label="Cancel / refund" value={`${s.cancellationsDone} / ${s.refundsDone}`} />
                    <Stat
                      label={`Cash diff (${s.shifts})`}
                      value={s.shifts ? `${diff > 0 ? "+" : ""}${formatINR(diff)}` : "—"}
                      tone={!s.shifts ? undefined : diff === 0 ? "good" : diff < 0 ? "bad" : "warn"}
                    />
                  </dl>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "warn" }) {
  return (
    <div className="rounded-lg bg-paper px-1.5 py-2">
      <dd
        className={cn(
          "truncate text-sm font-extrabold tabular",
          tone === "good" ? "text-success" : tone === "bad" ? "text-danger" : tone === "warn" ? "text-accent-dark" : "text-ink"
        )}
      >
        {value}
      </dd>
      <dt className="truncate text-[11px] font-medium text-muted">{label}</dt>
    </div>
  );
}
