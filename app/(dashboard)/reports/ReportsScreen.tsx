"use client";

import { useEffect, useState } from "react";
import { formatINR, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

type RangeKey = "today" | "week" | "month";

interface Profit {
  sales: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
}

export function ReportsScreen({ canViewProfit }: { canViewProfit: boolean }) {
  const [range, setRange] = useState<RangeKey>("today");
  const [data, setData] = useState<Profit | null>(null);
  const [loading, setLoading] = useState(canViewProfit);

  useEffect(() => {
    if (!canViewProfit) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/profit?range=${range}`);
        const d = await res.json();
        if (!cancelled) setData(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range, canViewProfit]);

  if (!canViewProfit) {
    return (
      <div className="p-4 lg:p-6">
        <h1 className="text-2xl font-extrabold text-ink mb-4">Reports</h1>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm text-base text-muted">
          Profit reports are visible to owners only. See Sales for order and revenue breakdowns.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-lg">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Reports</h1>
        <p className="text-base text-muted">Sales, cost of goods, and profit</p>
      </div>

      <div className="flex gap-2">
        {(["today", "week", "month"] as RangeKey[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "touch-target rounded-md border-2 px-4 text-sm font-bold",
              range === r ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft"
            )}
          >
            {r === "today" ? "Today" : r === "week" ? "This Week" : "This Month"}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="space-y-2">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-10" />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm space-y-3">
          <Row label="Sales" value={formatINR(data.sales)} />
          <Row label="Cost of Goods (COGS)" value={`-${formatINR(data.cogs)}`} muted />
          <div className="border-t-2 border-border pt-2">
            <Row label="Gross Profit" value={formatINR(data.grossProfit)} bold />
          </div>
          <Row label="Expenses" value={`-${formatINR(data.expenses)}`} muted />
          <div className="border-t-2 border-border pt-2">
            <Row
              label="Net Profit"
              value={formatINR(data.netProfit)}
              bold
              tone={data.netProfit >= 0 ? "success" : "danger"}
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-muted">Profit Margin</span>
            <span className="text-sm font-bold tabular">{data.profitMargin.toFixed(1)}%</span>
          </div>
        </div>
      )}

      <p className="text-sm text-muted">
        COGS uses each product&apos;s recipe food cost where one exists, otherwise its purchase price.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  tone?: "success" | "danger";
}) {
  return (
    <div className={cn("flex items-center justify-between", bold && "text-lg font-extrabold")}>
      <span className={cn("text-sm", muted ? "text-muted" : "text-ink-soft")}>{label}</span>
      <span className={cn("tabular", tone === "success" && "text-success", tone === "danger" && "text-danger")}>
        {value}
      </span>
    </div>
  );
}
