import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

function rangeStart(range: string | null): Date {
  const now = new Date();
  const d = new Date(now);
  if (range === "week") d.setDate(d.getDate() - 7);
  else if (range === "month") d.setDate(d.getDate() - 30);
  else d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "profit.view");
    const { searchParams } = new URL(req.url);
    const start = rangeStart(searchParams.get("range"));

    const invoices = await prisma.invoice.findMany({
      where: { businessId: session.businessId, createdAt: { gte: start }, status: { not: "CANCELLED" } },
      include: { items: true },
    });

    const productIds = Array.from(new Set(invoices.flatMap((i) => i.items.map((it) => it.productId))));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { recipe: { include: { lines: { include: { ingredient: true } } } } },
    });
    const productsById = new Map(products.map((p) => [p.id, p]));

    const sales = invoices.reduce((sum, i) => sum + Number(i.grandTotal), 0);

    let cogs = 0;
    for (const inv of invoices) {
      for (const item of inv.items) {
        const product = productsById.get(item.productId);
        if (!product) continue;
        const unitCost = product.recipe
          ? product.recipe.lines.reduce((s, l) => s + Number(l.quantity) * Number(l.ingredient.purchaseCost), 0)
          : Number(product.purchasePrice);
        cogs += unitCost * Number(item.quantity);
      }
    }

    const expenses = await prisma.expense.aggregate({
      where: { businessId: session.businessId, date: { gte: start } },
      _sum: { amount: true },
    });
    const expensesTotal = Number(expenses._sum.amount ?? 0);

    const grossProfit = sales - cogs;
    const netProfit = grossProfit - expensesTotal;
    const profitMargin = sales > 0 ? (netProfit / sales) * 100 : 0;

    return NextResponse.json({ sales, cogs, grossProfit, expenses: expensesTotal, netProfit, profitMargin });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load profit report." }, { status: 500 });
  }
}
