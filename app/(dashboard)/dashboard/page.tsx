import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { can } from "@/lib/permissions";
import { getBusinessInsights } from "@/lib/insights/getBusinessInsights";
import { formatINR } from "@/lib/utils";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import Link from "next/link";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function DashboardPage() {
  const session = await requireSession();
  const since = startOfToday();

  const [todayInvoices, lowStockProducts, outstandingCredit, activeSubs, insights] = await Promise.all([
    prisma.invoice.findMany({
      where: { businessId: session.businessId, createdAt: { gte: since }, status: { not: "CANCELLED" } },
    }),
    prisma.product.findMany({
      where: { businessId: session.businessId, trackInventory: true, status: "ACTIVE" },
      select: { currentStock: true, minStock: true },
    }),
    prisma.customer.aggregate({
      where: { businessId: session.businessId, outstandingBalance: { gt: 0 } },
      _sum: { outstandingBalance: true },
    }),
    prisma.tiffinSubscription.count({ where: { businessId: session.businessId, status: "ACTIVE" } }),
    getBusinessInsights(session.businessId),
  ]);
  const lowStockCount = lowStockProducts.filter((p) => Number(p.currentStock) <= Number(p.minStock)).length;

  const todaySales = todayInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);
  const todayOrders = todayInvoices.length;
  const canViewProfit = can(session.role, "profit.view");

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Good day, {session.name.split(" ")[0]} 👋</h1>
        <p className="text-sm text-muted">Here&apos;s how today is going so far.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Today's Sales" value={formatINR(todaySales)} accent="brand" />
        <Kpi label="Orders" value={String(todayOrders)} />
        <Kpi label="Low Stock Items" value={String(lowStockCount)} accent={lowStockCount > 0 ? "danger" : undefined} />
        <Kpi label="Outstanding Credit" value={formatINR(Number(outstandingCredit._sum.outstandingBalance ?? 0))} />
        <Kpi label="Active Tiffin Plans" value={String(activeSubs)} />
      </div>

      <DashboardCharts />

      {canViewProfit && (
        <Link
          href="/reports"
          className="block rounded-2xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <p className="text-sm font-bold text-ink-soft mb-1">Profit snapshot</p>
          <p className="text-sm text-muted">See Sales − COGS − Expenses broken down for today, this week, or this month →</p>
        </Link>
      )}

      <div>
        <h2 className="mb-2 text-sm font-bold text-ink-soft">Business Alerts</h2>
        {insights.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm text-sm text-muted">
            No alerts right now — everything looks on track.
          </div>
        ) : (
          <ul className="space-y-2">
            {insights.map((insight, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm"
              >
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
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: "brand" | "danger" }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={`mt-1 text-xl font-extrabold tabular ${
          accent === "brand" ? "text-brand" : accent === "danger" ? "text-danger" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
