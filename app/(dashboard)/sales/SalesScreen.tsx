"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatINR, cn } from "@/lib/utils";

type RangeKey = "today" | "yesterday" | "week" | "month";

interface ReportData {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  byProduct: { name: string; quantity: number; revenue: number }[];
  byPayment: { method: string; amount: number }[];
  byCashier: { name: string; sales: number; bills: number }[];
  dailySeries: { date: string; sales: number }[];
}

const RANGE_LABEL: Record<RangeKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
  month: "This Month",
};

const PAYMENT_LABEL: Record<string, string> = { CASH: "Cash", UPI: "UPI", CARD: "Card", CREDIT: "Credit" };

export function SalesScreen() {
  const [range, setRange] = useState<RangeKey>("today");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/sales?range=${range}`);
        const d = await res.json();
        if (!cancelled) setData(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Sales</h1>
        <p className="text-base text-muted">Daily, weekly, and monthly performance</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(RANGE_LABEL) as RangeKey[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "touch-target rounded-md border-2 px-4 text-sm font-bold",
              range === r ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft"
            )}
          >
            {RANGE_LABEL[r]}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <p className="text-base text-muted">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="border-2 border-border bg-surface p-4">
              <p className="text-sm font-semibold text-muted">Sales</p>
              <p className="text-xl font-extrabold text-ink tabular">{formatINR(data.totalSales)}</p>
            </div>
            <div className="border-2 border-border bg-surface p-4">
              <p className="text-sm font-semibold text-muted">Orders</p>
              <p className="text-xl font-extrabold text-ink tabular">{data.totalOrders}</p>
            </div>
            <div className="border-2 border-border bg-surface p-4">
              <p className="text-sm font-semibold text-muted">Avg. Order</p>
              <p className="text-xl font-extrabold text-ink tabular">{formatINR(data.avgOrderValue)}</p>
            </div>
          </div>

          {data.dailySeries.length > 1 && (
            <div className="border-2 border-border bg-surface p-4">
              <p className="mb-2 text-sm font-bold text-ink-soft">Sales trend</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                  <Bar dataKey="sales" fill="var(--brand)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="border-2 border-border bg-surface">
            <p className="border-b-2 border-border p-3 text-sm font-bold text-ink-soft">Top Products</p>
            {data.byProduct.length === 0 ? (
              <p className="p-4 text-base text-muted">No sales in this range.</p>
            ) : (
              <ul className="divide-y-2 divide-border">
                {data.byProduct.slice(0, 10).map((p) => (
                  <li key={p.name} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-bold text-ink">{p.name}</p>
                      <p className="text-sm text-muted tabular">{p.quantity} sold</p>
                    </div>
                    <p className="font-bold text-brand tabular">{formatINR(p.revenue)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-2 border-border bg-surface">
              <p className="border-b-2 border-border p-3 text-sm font-bold text-ink-soft">Payment Breakdown</p>
              {data.byPayment.length === 0 ? (
                <p className="p-4 text-base text-muted">No payments yet.</p>
              ) : (
                <ul className="divide-y-2 divide-border">
                  {data.byPayment.map((p) => (
                    <li key={p.method} className="flex items-center justify-between p-3">
                      <p className="font-bold text-ink">{PAYMENT_LABEL[p.method] ?? p.method}</p>
                      <p className="font-bold tabular">{formatINR(p.amount)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-2 border-border bg-surface">
              <p className="border-b-2 border-border p-3 text-sm font-bold text-ink-soft">Cashier-wise Sales</p>
              {data.byCashier.length === 0 ? (
                <p className="p-4 text-base text-muted">No sales yet.</p>
              ) : (
                <ul className="divide-y-2 divide-border">
                  {data.byCashier.map((c) => (
                    <li key={c.name} className="flex items-center justify-between p-3">
                      <div>
                        <p className="font-bold text-ink">{c.name}</p>
                        <p className="text-sm text-muted tabular">{c.bills} bills</p>
                      </div>
                      <p className="font-bold tabular">{formatINR(c.sales)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
