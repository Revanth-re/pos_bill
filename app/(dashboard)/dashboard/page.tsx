import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { can } from "@/lib/permissions";
import { getBusinessInsights } from "@/lib/insights/getBusinessInsights";
import { formatINR } from "@/lib/utils";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardText } from "@/components/dashboard/DashboardText";

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
      <DashboardText
        firstName={session.name.split(" ")[0]}
        todaySales={formatINR(todaySales)}
        todayOrders={String(todayOrders)}
        lowStockCount={String(lowStockCount)}
        lowStockDanger={lowStockCount > 0}
        outstandingCredit={formatINR(Number(outstandingCredit._sum.outstandingBalance ?? 0))}
        activeSubs={String(activeSubs)}
        canViewProfit={canViewProfit}
        insights={insights}
      />

      <DashboardCharts />
    </div>
  );
}
