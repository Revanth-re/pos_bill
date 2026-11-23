import { NextResponse } from "next/server";
import { istDayStart, istDaysAgoStart } from "@/lib/time";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

function rangeStart(range: string | null): Date {
  if (range === "week") return istDaysAgoStart(7);
  if (range === "month") return istDaysAgoStart(30);
  return istDayStart();
}

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "profit.view");
    const { searchParams } = new URL(req.url);
    const start = rangeStart(searchParams.get("range"));

    // Profit = Sales − Expenses (no food-cost/recipe tracking in Billo).
    const [salesAgg, expenses] = await Promise.all([
      prisma.invoice.aggregate({
        where: { businessId: session.businessId, createdAt: { gte: start }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
        _sum: { grandTotal: true },
      }),
      prisma.expense.aggregate({
        where: { businessId: session.businessId, date: { gte: start } },
        _sum: { amount: true },
      }),
    ]);
    const sales = Number(salesAgg._sum.grandTotal ?? 0);
    const expensesTotal = Number(expenses._sum.amount ?? 0);
    const netProfit = sales - expensesTotal;
    const profitMargin = sales > 0 ? (netProfit / sales) * 100 : 0;

    return NextResponse.json({ sales, expenses: expensesTotal, netProfit, profitMargin });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load profit report." }, { status: 500 });
  }
}
