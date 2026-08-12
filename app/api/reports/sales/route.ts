import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";

function resolveRange(searchParams: URLSearchParams): { start: Date; end: Date } {
  const range = searchParams.get("range") ?? "today";
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (range === "custom") {
    const start = new Date(searchParams.get("start") ?? now);
    const customEnd = new Date(searchParams.get("end") ?? now);
    start.setHours(0, 0, 0, 0);
    customEnd.setHours(23, 59, 59, 999);
    return { start, end: customEnd };
  }

  const start = new Date(now);
  if (range === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (range === "yesterday") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const yEnd = new Date(start);
    yEnd.setHours(23, 59, 59, 999);
    return { start, end: yEnd };
  } else if (range === "week") {
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (range === "month") {
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const { start, end } = resolveRange(searchParams);

    const invoices = await prisma.invoice.findMany({
      where: {
        businessId: session.businessId,
        createdAt: { gte: start, lte: end },
        status: { not: "CANCELLED" },
      },
      include: {
        items: true,
        payments: true,
        staff: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });

    const totalSales = invoices.reduce((sum, i) => sum + Number(i.grandTotal), 0);
    const totalOrders = invoices.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    const byProductMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const inv of invoices) {
      for (const item of inv.items) {
        const existing = byProductMap.get(item.productName) ?? { name: item.productName, quantity: 0, revenue: 0 };
        existing.quantity += Number(item.quantity);
        existing.revenue += Number(item.lineTotal);
        byProductMap.set(item.productName, existing);
      }
    }
    const byProduct = Array.from(byProductMap.values()).sort((a, b) => b.revenue - a.revenue);

    const byPaymentMap = new Map<string, number>();
    for (const inv of invoices) {
      for (const p of inv.payments) {
        byPaymentMap.set(p.method, (byPaymentMap.get(p.method) ?? 0) + Number(p.amount));
      }
    }
    const byPayment = Array.from(byPaymentMap.entries()).map(([method, amount]) => ({ method, amount }));

    const byCashierMap = new Map<string, { name: string; sales: number; bills: number }>();
    for (const inv of invoices) {
      const name = inv.staff.user.name;
      const existing = byCashierMap.get(name) ?? { name, sales: 0, bills: 0 };
      existing.sales += Number(inv.grandTotal);
      existing.bills += 1;
      byCashierMap.set(name, existing);
    }
    const byCashier = Array.from(byCashierMap.values()).sort((a, b) => b.sales - a.sales);

    const dailyMap = new Map<string, number>();
    for (const inv of invoices) {
      const day = inv.createdAt.toISOString().slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + Number(inv.grandTotal));
    }
    const dailySeries = Array.from(dailyMap.entries())
      .map(([date, sales]) => ({ date, sales }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalSales,
      totalOrders,
      avgOrderValue,
      byProduct,
      byPayment,
      byCashier,
      dailySeries,
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load the sales report." }, { status: 500 });
  }
}
