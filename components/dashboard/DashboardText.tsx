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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label={t("dashboard.todaySales")} value={todaySales} accent="brand" />
        <Kpi label={t("dashboard.orders")} value={todayOrders} />
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

function Kpi({ label, value, accent }: { label: string; value: string; accent?: "brand" | "danger" }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-extrabold tabular",
          accent === "brand" ? "text-brand" : accent === "danger" ? "text-danger" : "text-ink"
        )}
      >
        {value}
      </p>
    </div>
  );
}
