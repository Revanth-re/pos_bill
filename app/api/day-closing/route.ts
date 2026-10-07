import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

function todayDateOnly(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function computeTodaySummary(businessId: string) {
  const start = todayDateOnly();

  const [invoices, expenses, lastClosing, refundLogs] = await Promise.all([
    prisma.invoice.findMany({
      where: { businessId, createdAt: { gte: start }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      include: { payments: true },
    }),
    prisma.expense.aggregate({
      where: { businessId, date: { gte: start } },
      _sum: { amount: true },
    }),
    prisma.dayClosing.findFirst({ where: { businessId }, orderBy: { date: "desc" } }),
    prisma.auditLog.findMany({
      where: { businessId, action: { in: ["BILL_REFUNDED", "BILL_CANCELLED"] }, createdAt: { gte: start } },
      select: { metadata: true },
    }),
  ]);

  // Today's bills that were refunded/cancelled are already excluded from sales,
  // so only refunds of *earlier* days' bills take cash out of today's drawer.
  let refundsTotal = 0, cashRefunds = 0;
  for (const log of refundLogs) {
    const m = (log.metadata ?? {}) as unknown as { amount?: number; cashAmount?: number; sameDay?: boolean };
    refundsTotal += Number(m.amount ?? 0);
    if (!m.sameDay) cashRefunds += Number(m.cashAmount ?? 0);
  }

  let cashSales = 0, upiSales = 0, cardSales = 0, creditSales = 0, discountsTotal = 0;
  for (const inv of invoices) {
    discountsTotal += Number(inv.discountTotal);
    for (const p of inv.payments) {
      if (p.method === "CASH") cashSales += Number(p.amount);
      else if (p.method === "UPI") upiSales += Number(p.amount);
      else if (p.method === "CARD") cardSales += Number(p.amount);
      else if (p.method === "CREDIT") creditSales += Number(p.amount);
    }
  }
  const totalSales = invoices.reduce((sum, i) => sum + Number(i.grandTotal), 0);
  const expensesTotal = Number(expenses._sum.amount ?? 0);
  const openingCash = lastClosing ? Number(lastClosing.actualCash) : 0;
  const expectedCash = openingCash + cashSales - expensesTotal - cashRefunds;

  return { totalSales, cashSales, upiSales, cardSales, creditSales, expensesTotal, discountsTotal, refundsTotal, cashRefunds, openingCash, expectedCash };
}

export async function GET() {
  try {
    const session = await requireSession();
    const start = todayDateOnly();

    const existing = await prisma.dayClosing.findUnique({
      where: { businessId_date: { businessId: session.businessId, date: start } },
    });

    if (existing) {
      return NextResponse.json({ closed: true, closing: existing });
    }

    const summary = await computeTodaySummary(session.businessId);
    return NextResponse.json({ closed: false, summary });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load day closing summary." }, { status: 500 });
  }
}

const closeSchema = z.object({ actualCash: z.number().nonnegative() });

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "dayClosing.perform");

    const parsed = closeSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter the counted cash amount." }, { status: 400 });

    const start = todayDateOnly();
    const alreadyClosed = await prisma.dayClosing.findUnique({
      where: { businessId_date: { businessId: session.businessId, date: start } },
    });
    if (alreadyClosed) {
      return NextResponse.json({ error: "Today has already been closed." }, { status: 409 });
    }

    const summary = await computeTodaySummary(session.businessId);
    const cashDifference = parsed.data.actualCash - summary.expectedCash;

    const closing = await prisma.dayClosing.create({
      data: {
        businessId: session.businessId,
        date: start,
        totalSales: summary.totalSales,
        cashSales: summary.cashSales,
        upiSales: summary.upiSales,
        cardSales: summary.cardSales,
        creditSales: summary.creditSales,
        expensesTotal: summary.expensesTotal,
        discountsTotal: summary.discountsTotal,
        refundsTotal: summary.refundsTotal,
        openingCash: summary.openingCash,
        expectedCash: summary.expectedCash,
        actualCash: parsed.data.actualCash,
        cashDifference,
        closedByStaffId: session.staffId,
        locked: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        businessId: session.businessId,
        staffId: session.staffId,
        action: "DAY_CLOSED",
        entity: "DayClosing",
        entityId: closing.id,
        metadata: { cashDifference },
      },
    });

    return NextResponse.json({ closing });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to close the day." }, { status: 500 });
  }
}
