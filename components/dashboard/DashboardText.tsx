"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

interface Insight {
  icon: string;
  title: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
}

export function DashboardText({
  firstName,
  todaySales,
  todayOrders,
  lowStockCount,
  lowStockDanger,
  outstandingCredit,
  activeSubs,
  canViewProfit,
  insights,
  avgBill,
  payments,
  quickInsights = [],
}: {
  firstName: string;
  todaySales: string;
  todayOrders: string;
  lowStockCount: string;
  lowStockDanger: boolean;
  outstandingCredit: string;
  activeSubs: string;
  canViewProfit: boolean;
  insights: Insight[];
  avgBill?: string;
  payments?: { label: string; value: string; share: number }[];
  quickInsights?: string[];
}) {
  const t = useT();

  return (
    <>
      <div>
        <h1 className="text-xl font-extrabold text-ink">
          {t("dashboard.greeting")}, {firstName} 👋
        </h1>
        <p className="text-sm text-muted">{t("dashboard.subtitle")}</p>
      </div>

      {/* Hero metrics: understand the day in 5 seconds */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-brand-dark p-5 text-white shadow-md sm:col-span-2 lg:col-span-1">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/15" />
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{t("dashboard.todaySales")}</p>
          <p className="mt-1 text-[clamp(1.75rem,4vw,2.4rem)] font-extrabold leading-tight tabular text-accent">{todaySales}</p>
        </div>
        <Kpi label={t("dashboard.orders")} value={todayOrders} big />
        <Kpi label="Average bill" value={avgBill ?? "—"} big />
      </div>

      {payments && payments.length > 0 && (
        <div className="card p-4">
          <div className="mb-3 flex h-2 overflow-hidden rounded-full bg-paper">
            {payments.map((p, i) => (
              <div key={p.label} style={{ width: `${p.share}%`, background: ["#075E63", "#F2D21B", "#5BA8A6", "#C9A900"][i] }} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {payments.map((p, i) => (
              <div key={p.label} className="flex items-start gap-2">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ["#075E63", "#F2D21B", "#5BA8A6", "#C9A900"][i] }} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted">{p.label}</p>
                  <p className="text-lg font-extrabold text-ink tabular">{p.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {quickInsights.length > 0 && (
        <ul className="grid gap-2 md:grid-cols-3">
          {quickInsights.map((line) => (
            <li key={line} className="flex items-start gap-2 rounded-xl border border-brand/15 bg-brand-soft/60 px-3 py-2.5 text-sm font-medium text-brand-dark">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-dark" />
              {line}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-3">
        <Kpi label={t("dashboard.lowStock")} value={lowStockCount} accent={lowStockDanger ? "danger" : undefined} />
        <Kpi label={t("dashboard.outstandingCredit")} value={outstandingCredit} />
        <Kpi label={t("dashboard.activeTiffin")} value={activeSubs} />
      </div>

      {canViewProfit && (
        <Link
          href="/reports"
          className="block rounded-2xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <p className="text-sm font-bold text-ink-soft mb-1">{t("dashboard.profitSnapshot")}</p>
          <p className="text-sm text-muted">{t("dashboard.profitLink")}</p>
        </Link>
      )}

      <div>
        <h2 className="mb-2 text-sm font-bold text-ink-soft">{t("dashboard.businessAlerts")}</h2>
        {insights.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm text-sm text-muted">
            {t("dashboard.noAlerts")}
          </div>
        ) : (
          <ul className="space-y-2">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm">
                <span className="text-xl leading-none">{insight.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{insight.title}</p>
                  <p className="text-xs text-muted">{insight.message}</p>
                </div>
                <Link
                  href={insight.actionUrl}
                  className="shrink-0 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-dark border border-brand/30 transition-colors hover:bg-brand hover:text-white"
                >
                  {insight.actionLabel}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function Kpi({ label, value, accent, big }: { label: string; value: string; accent?: "brand" | "danger"; big?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 font-extrabold tabular",
          big ? "text-[clamp(1.5rem,3.2vw,2rem)] leading-tight" : "text-xl",
          accent === "brand" ? "text-brand" : accent === "danger" ? "text-danger" : "text-ink"
        )}
      >
        {value}
      </p>
    </div>
  );
}
