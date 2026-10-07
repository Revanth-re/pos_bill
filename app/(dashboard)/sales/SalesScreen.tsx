"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatINR, cn } from "@/lib/utils";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useSalesCache } from "@/stores/salesCache";

type RangeKey = "today" | "yesterday" | "week" | "month";

export function SalesScreen() {
  const t = useT();
  const [range, setRange] = useState<RangeKey>("today");
  const data = useSalesCache((s) => s.byRange[range]?.data ?? null);
  const loading = useSalesCache((s) => s.loading);
  const ensure = useSalesCache((s) => s.ensure);

  const RANGE_LABEL: Record<RangeKey, string> = {
    today: t("sales.today"),
    yesterday: t("sales.yesterday"),
    week: t("sales.thisWeek"),
    month: t("sales.thisMonth"),
  };
  const PAYMENT_LABEL: Record<string, string> = {
    CASH: t("payment.cash"),
    UPI: t("payment.upi"),
    CARD: t("payment.card"),
    CREDIT: t("payment.credit"),
  };

  useEffect(() => {
    void ensure(range);
  }, [range, ensure]);

  const showBoot = !data && loading;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{t("sales.title")}</h1>
        <p className="text-sm text-muted">{t("sales.subtitle")}</p>
      </div>

      <div className="flex w-full gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1 sm:w-fit">
        {(Object.keys(RANGE_LABEL) as RangeKey[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "min-h-11 rounded-lg px-4 text-sm font-semibold transition-all duration-150",
              range === r ? "bg-brand text-white shadow-sm" : "text-ink-soft hover:text-ink"
            )}
          >
            {RANGE_LABEL[r]}
          </button>
        ))}
      </div>

      {showBoot || !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-56" />
          <SkeletonList count={4} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
            <div className="border border-border bg-surface rounded-2xl shadow-sm p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("sales.sales")}</p>
              <p className="mt-1 text-[clamp(1.25rem,3vw,1.75rem)] font-extrabold leading-tight text-ink tabular">{formatINR(data.totalSales)}</p>
            </div>
            <div className="border border-border bg-surface rounded-2xl shadow-sm p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("sales.orders")}</p>
              <p className="mt-1 text-[clamp(1.25rem,3vw,1.75rem)] font-extrabold leading-tight text-ink tabular">{data.totalOrders}</p>
            </div>
            <div className="border border-border bg-surface rounded-2xl shadow-sm p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("sales.avgOrder")}</p>
              <p className="mt-1 text-[clamp(1.25rem,3vw,1.75rem)] font-extrabold leading-tight text-ink tabular">{formatINR(data.avgOrderValue)}</p>
            </div>
          </div>

          {data.dailySeries.length > 1 && (
            <div className="border border-border bg-surface rounded-2xl shadow-sm p-4">
              <p className="mb-2 text-sm font-bold text-ink-soft">{t("sales.trend")}</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.dailySeries}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatINR(Number(v ?? 0))} />
                  <Bar dataKey="sales" fill="var(--brand)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="border border-border bg-surface rounded-2xl shadow-sm">
            <p className="border-b border-border px-4 py-3 text-sm font-bold text-ink">{t("sales.topProducts")}</p>
            {data.byProduct.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">{t("sales.noSales")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.byProduct.slice(0, 10).map((p) => (
                  <li key={p.name} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="font-bold text-ink">{p.name}</p>
                      <p className="text-sm text-muted tabular">
                        {p.quantity} {t("sales.sold")}
                      </p>
                    </div>
                    <p className="font-bold text-brand tabular">{formatINR(p.revenue)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-border bg-surface rounded-2xl shadow-sm">
              <p className="border-b border-border px-4 py-3 text-sm font-bold text-ink">
                {t("sales.paymentBreakdown")}
              </p>
              {data.byPayment.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">{t("sales.noPayments")}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.byPayment.map((p) => (
                    <li key={p.method} className="flex items-center justify-between gap-3 px-4 py-3">
                      <p className="font-bold text-ink">{PAYMENT_LABEL[p.method] ?? p.method}</p>
                      <p className="font-bold tabular">{formatINR(p.amount)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border border-border bg-surface rounded-2xl shadow-sm">
              <p className="border-b border-border px-4 py-3 text-sm font-bold text-ink">{t("sales.cashierWise")}</p>
              {data.byCashier.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">{t("sales.noSalesYet")}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.byCashier.map((c) => (
                    <li key={c.name} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-bold text-ink">{c.name}</p>
                        <p className="text-sm text-muted tabular">
                          {c.bills} {t("sales.bills")}
                        </p>
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
