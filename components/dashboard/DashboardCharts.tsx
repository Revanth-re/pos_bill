"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { formatINR } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { useT } from "@/lib/i18n/LanguageProvider";

interface ReportData {
  byPayment: { method: string; amount: number }[];
  dailySeries: { date: string; sales: number }[];
}

const PAYMENT_COLORS = ["#059669", "#facc15", "#0ea5e9", "#e11d48"];

export function DashboardCharts() {
  const t = useT();
  const PAYMENT_LABEL: Record<string, string> = { CASH: t("payment.cash"), UPI: t("payment.upi"), CARD: t("payment.card"), CREDIT: t("payment.credit") };
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reports/sales?range=week")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data || data.dailySeries.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted shadow-sm">
        {t("dashboard.noChartsYet")}
      </div>
    );
  }

  const paymentData = data.byPayment.map((p) => ({ name: PAYMENT_LABEL[p.method] ?? p.method, value: p.amount }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p className="mb-2 text-sm font-bold text-ink-soft">{t("dashboard.last7Days")}</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.dailySeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => formatINR(Number(v ?? 0))} />
            <Bar dataKey="sales" fill="var(--brand)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {paymentData.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="mb-2 text-sm font-bold text-ink-soft">{t("dashboard.paymentBreakdown")}</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                {paymentData.map((_, i) => (
                  <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatINR(Number(v ?? 0))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
