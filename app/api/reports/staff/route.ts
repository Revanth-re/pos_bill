import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

function rangeStart(range: string): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === "week") d.setDate(d.getDate() - 6);
  else if (range === "month") d.setDate(d.getDate() - 29);
  return d;
}

/** Per-staff performance: sales, bills, discounts, voids/refunds, shift cash accuracy. */
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "reports.view");
    const range = new URL(req.url).searchParams.get("range") ?? "today";
    const since = rangeStart(range);
    const businessId = session.businessId;

    const [staff, invoices, logs] = await Promise.all([
      prisma.staff.findMany({ where: { businessId }, include: { user: { select: { name: true } } } }),
      prisma.invoice.findMany({
        where: { businessId, createdAt: { gte: since } },
        select: { staffId: true, status: true, grandTotal: true, discountTotal: true },
      }),
      prisma.auditLog.findMany({
        where: {
          businessId,
          createdAt: { gte: since },
          action: { in: ["BILL_CANCELLED", "BILL_REFUNDED", "BILL_REPRINTED", "SHIFT_CLOSED"] },
        },
        select: { staffId: true, action: true, metadata: true },
      }),
    ]);

    const rows = staff.map((s) => {
      const mine = invoices.filter((i) => i.staffId === s.id);
      const valid = mine.filter((i) => i.status !== "CANCELLED" && i.status !== "REFUNDED");
      const sales = valid.reduce((sum, i) => sum + Number(i.grandTotal), 0);
      const myLogs = logs.filter((l) => l.staffId === s.id);
      const shifts = myLogs.filter((l) => l.action === "SHIFT_CLOSED");
      return {
        id: s.id,
        name: s.user.name,
        role: s.role,
        status: s.status,
        bills: valid.length,
        sales,
        avgBill: valid.length ? sales / valid.length : 0,
        discounts: valid.reduce((sum, i) => sum + Number(i.discountTotal), 0),
        discountedBills: valid.filter((i) => Number(i.discountTotal) > 0).length,
        voidedBills: mine.length - valid.length,
        cancellationsDone: myLogs.filter((l) => l.action === "BILL_CANCELLED").length,
        refundsDone: myLogs.filter((l) => l.action === "BILL_REFUNDED").length,
        reprints: myLogs.filter((l) => l.action === "BILL_REPRINTED").length,
        shifts: shifts.length,
        cashDifference: shifts.reduce(
          (sum, l) => sum + Number((l.metadata as unknown as { difference?: number } | null)?.difference ?? 0),
          0
        ),
      };
    });
    rows.sort((a, b) => b.sales - a.sales);
    const totalSales = rows.reduce((s, r) => s + r.sales, 0);

    return NextResponse.json({ range, totalSales, staff: rows });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load staff performance." }, { status: 500 });
  }
}
