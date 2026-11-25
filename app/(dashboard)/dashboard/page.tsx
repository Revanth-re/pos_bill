import { requireSession } from "@/lib/auth";
import { istDayStart } from "@/lib/time";
import { prisma } from "@/lib/db/prisma";
import { can } from "@/lib/permissions";
import { getBusinessInsights, getQuickInsights } from "@/lib/insights/getBusinessInsights";
import { formatINR } from "@/lib/utils";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardText } from "@/components/dashboard/DashboardText";
import { RatingPrompt } from "@/components/dashboard/RatingPrompt";
import { AddProductsNudge } from "@/components/dashboard/AddProductsNudge";
import { getMenuScope } from "@/lib/menu";
import { pendingRatingMilestone } from "@/lib/rating";

// "Today" = India-time day (servers run in UTC).
const startOfToday = () => istDayStart();

export default async function DashboardPage() {
  const session = await requireSession();
  const since = startOfToday();

  const [todayInvoices, lowStockProducts, outstandingCredit, activeSubs, insights, todayExpenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { businessId: session.businessId, createdAt: { gte: since }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      include: { payments: { select: { method: true, amount: true } }, items: { select: { productName: true, quantity: true } } },
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
    prisma.expense.aggregate({ where: { businessId: session.businessId, date: { gte: since } }, _sum: { amount: true } }),
  ]);
  const lowStockCount = lowStockProducts.filter((p) => Number(p.currentStock) <= Number(p.minStock)).length;

  const todaySales = todayInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);
  const todayOrders = todayInvoices.length;
  const canViewProfit = can(session.role, "profit.view");

  const byMethod: Record<string, number> = { CASH: 0, UPI: 0, CARD: 0, CREDIT: 0 };
  for (const inv of todayInvoices) for (const p of inv.payments) byMethod[p.method] += Number(p.amount);
  const paidTotal = Object.values(byMethod).reduce((a, b) => a + b, 0);
  const payments = (["CASH", "UPI", "CARD", "CREDIT"] as const).map((m) => ({
    label: m === "CASH" ? "Cash" : m === "UPI" ? "UPI" : m === "CARD" ? "Card" : "Credit",
    value: formatINR(byMethod[m]),
    share: paidTotal > 0 ? (byMethod[m] / paidTotal) * 100 : 0,
  }));
  const [quickInsights, ratingMilestone, productCount] = await Promise.all([
    getQuickInsights(session.businessId, todayInvoices, todaySales),
    session.role === "OWNER" ? pendingRatingMilestone(session.businessId) : Promise.resolve(null),
    getMenuScope(session.businessId).then((m) => prisma.product.count({ where: { businessId: { in: m.ids } } })),
  ]);
  const canAddProducts = can(session.role, "products.edit");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6">
      {productCount === 0 && canAddProducts && <AddProductsNudge />}
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
        avgBill={formatINR(todayOrders ? todaySales / todayOrders : 0)}
        payments={payments}
        quickInsights={quickInsights}
        todayExpenses={formatINR(Number(todayExpenses._sum.amount ?? 0))}
      />

      <DashboardCharts />
      {ratingMilestone && <RatingPrompt milestone={ratingMilestone} />}
    </div>
  );
}
