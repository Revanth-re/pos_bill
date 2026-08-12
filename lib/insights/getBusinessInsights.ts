import { prisma } from "@/lib/db/prisma";
import type { NotificationType } from "@prisma/client";

export interface Insight {
  type: NotificationType;
  icon: string;
  title: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
}

/**
 * Computes today's business alerts directly from live data — no chatbot,
 * no free-form LLM text, just thresholds and comparisons against the
 * app's own numbers, per spec §15 ("Do NOT build a chatbot... focus only
 * on automatically generated business insights from the application's
 * own data"). This intentionally stays simple for Phase 1/4 — a fuller
 * version would add week-over-week trend and food-cost alerts once
 * Sales Tracking (Phase 2) and Recipes (Phase 4) have enough history.
 */
export async function getBusinessInsights(businessId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  const lowStockProducts = await prisma.product.findMany({
    where: {
      businessId,
      status: "ACTIVE",
      trackInventory: true,
    },
  });
  const lowStock = lowStockProducts.filter((p) => Number(p.currentStock) <= Number(p.minStock));
  const outOfStock = lowStock.filter((p) => Number(p.currentStock) <= 0);

  if (outOfStock.length > 0) {
    insights.push({
      type: "OUT_OF_STOCK",
      icon: "🚫",
      title: `${outOfStock.length} product${outOfStock.length > 1 ? "s" : ""} out of stock`,
      message: outOfStock
        .slice(0, 3)
        .map((p) => p.name)
        .join(", "),
      actionLabel: "View Inventory",
      actionUrl: "/inventory",
    });
  } else if (lowStock.length > 0) {
    insights.push({
      type: "LOW_STOCK",
      icon: "⚠️",
      title: `${lowStock.length} product${lowStock.length > 1 ? "s" : ""} running low`,
      message: lowStock
        .slice(0, 3)
        .map((p) => `${p.name} (${Number(p.currentStock)} ${p.unit} left)`)
        .join(", "),
      actionLabel: "View Inventory",
      actionUrl: "/inventory",
    });
  }

  const yesterdayStart = new Date();
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const dayBeforeStart = new Date(yesterdayStart);
  dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
  const dayBeforeEnd = new Date(dayBeforeStart);
  dayBeforeEnd.setHours(23, 59, 59, 999);

  const [yesterdayInvoices, dayBeforeInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: { businessId, createdAt: { gte: yesterdayStart, lte: yesterdayEnd }, status: { not: "CANCELLED" } },
      select: { grandTotal: true },
    }),
    prisma.invoice.findMany({
      where: { businessId, createdAt: { gte: dayBeforeStart, lte: dayBeforeEnd }, status: { not: "CANCELLED" } },
      select: { grandTotal: true },
    }),
  ]);
  const yesterdaySales = yesterdayInvoices.reduce((sum, i) => sum + Number(i.grandTotal), 0);
  const dayBeforeSales = dayBeforeInvoices.reduce((sum, i) => sum + Number(i.grandTotal), 0);

  if (dayBeforeSales > 0) {
    const changePercent = ((yesterdaySales - dayBeforeSales) / dayBeforeSales) * 100;
    if (changePercent <= -10) {
      insights.push({
        type: "SALES_DROP",
        icon: "📉",
        title: `Sales dropped ${Math.abs(changePercent).toFixed(0)}% yesterday`,
        message: `₹${yesterdaySales.toLocaleString("en-IN")} vs ₹${dayBeforeSales.toLocaleString("en-IN")} the day before`,
        actionLabel: "View Sales",
        actionUrl: "/sales",
      });
    } else if (changePercent >= 15) {
      insights.push({
        type: "INFO",
        icon: "📈",
        title: `Sales grew ${changePercent.toFixed(0)}% yesterday`,
        message: `₹${yesterdaySales.toLocaleString("en-IN")} vs ₹${dayBeforeSales.toLocaleString("en-IN")} the day before`,
        actionLabel: "View Sales",
        actionUrl: "/sales",
      });
    }
  }

  const customersWithCredit = await prisma.customer.aggregate({
    where: { businessId, outstandingBalance: { gt: 0 } },
    _sum: { outstandingBalance: true },
    _count: true,
  });
  const pendingCredit = Number(customersWithCredit._sum.outstandingBalance ?? 0);
  if (pendingCredit > 0) {
    insights.push({
      type: "PENDING_CREDIT",
      icon: "💰",
      title: `₹${pendingCredit.toLocaleString("en-IN")} customer credit pending`,
      message: `Across ${customersWithCredit._count} customer${customersWithCredit._count > 1 ? "s" : ""}`,
      actionLabel: "View Udhaari",
      actionUrl: "/customers",
    });
  }

  const soonExpiring = await prisma.tiffinSubscription.count({
    where: {
      businessId,
      status: "ACTIVE",
      endDate: { lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    },
  });
  if (soonExpiring > 0) {
    insights.push({
      type: "TIFFIN_EXPIRY",
      icon: "📅",
      title: `${soonExpiring} tiffin plan${soonExpiring > 1 ? "s" : ""} expiring within 3 days`,
      message: "Renew before the customer runs out of meals",
      actionLabel: "View Tiffin",
      actionUrl: "/tiffin",
    });
  }

  return insights;
}
