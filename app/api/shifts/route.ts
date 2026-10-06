import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { can, assertPermission, PermissionError } from "@/lib/permissions";

/**
 * Cashier shifts, stored as audit-log events (no schema change):
 *   SHIFT_OPENED  → the shift's id is this log row's id; metadata.openingCash
 *   SHIFT_CLOSED  → entityId = the opening row's id; metadata = full reconciliation
 */

type OpenMeta = { openingCash: number };
type CloseMeta = {
  openingCash: number; openedAt: string; bills: number; totalSales: number;
  cashSales: number; upiSales: number; cardSales: number; creditSales: number;
  cashRefunds: number; expectedCash: number; actualCash: number; difference: number; note?: string;
};

async function findOpenShift(businessId: string, staffId: string) {
  const opened = await prisma.auditLog.findFirst({
    where: { businessId, staffId, action: "SHIFT_OPENED" },
    orderBy: { createdAt: "desc" },
  });
  if (!opened) return null;
  const closed = await prisma.auditLog.findFirst({
    where: { businessId, action: "SHIFT_CLOSED", entityId: opened.id },
    select: { id: true },
  });
  return closed ? null : opened;
}

async function summarize(businessId: string, staffId: string, openedAt: Date, openingCash: number) {
  const [invoices, refundLogs] = await Promise.all([
    prisma.invoice.findMany({
      where: { businessId, staffId, createdAt: { gte: openedAt }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      include: { payments: true },
    }),
    prisma.auditLog.findMany({
      where: { businessId, staffId, action: { in: ["BILL_REFUNDED", "BILL_CANCELLED"] }, createdAt: { gte: openedAt } },
      select: { metadata: true },
    }),
  ]);
  const by = { CASH: 0, UPI: 0, CARD: 0, CREDIT: 0 } as Record<string, number>;
  for (const inv of invoices) for (const p of inv.payments) by[p.method] = (by[p.method] ?? 0) + Number(p.amount);
  const cashRefunds = refundLogs.reduce((s, l) => {
    const m = (l.metadata ?? {}) as { cashAmount?: number; sameDay?: boolean };
    return s + (m.sameDay ? 0 : Number(m.cashAmount ?? 0));
  }, 0);
  const totalSales = invoices.reduce((s, i) => s + Number(i.grandTotal), 0);
  return {
    bills: invoices.length,
    totalSales,
    cashSales: by.CASH, upiSales: by.UPI, cardSales: by.CARD, creditSales: by.CREDIT,
    cashRefunds,
    expectedCash: openingCash + by.CASH - cashRefunds,
  };
}

export async function GET() {
  try {
    const session = await requireSession();
    const open = await findOpenShift(session.businessId, session.staffId);
    let current = null;
    if (open) {
      const openingCash = Number((open.metadata as OpenMeta | null)?.openingCash ?? 0);
      current = {
        id: open.id,
        openedAt: open.createdAt,
        openingCash,
        summary: await summarize(session.businessId, session.staffId, open.createdAt, openingCash),
      };
    }

    const seeAll = can(session.role, "sales.view.all");
    const closedLogs = await prisma.auditLog.findMany({
      where: { businessId: session.businessId, action: "SHIFT_CLOSED", ...(seeAll ? {} : { staffId: session.staffId }) },
      include: { staff: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json({
      current,
      recent: closedLogs.map((l) => ({ id: l.id, closedAt: l.createdAt, cashier: l.staff?.user.name ?? "—", ...(l.metadata as CloseMeta) })),
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load shifts." }, { status: 500 });
  }
}

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("open"), openingCash: z.number().nonnegative() }),
  z.object({ action: z.literal("close"), actualCash: z.number().nonnegative(), note: z.string().max(300).optional() }),
]);

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "shift.manage");
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid cash amount." }, { status: 400 });
    const open = await findOpenShift(session.businessId, session.staffId);

    if (parsed.data.action === "open") {
      if (open) return NextResponse.json({ error: "You already have an open shift." }, { status: 409 });
      const log = await prisma.auditLog.create({
        data: { businessId: session.businessId, staffId: session.staffId, action: "SHIFT_OPENED", entity: "Shift", metadata: { openingCash: parsed.data.openingCash } },
      });
      return NextResponse.json({ ok: true, id: log.id });
    }

    if (!open) return NextResponse.json({ error: "No open shift to close." }, { status: 409 });
    const openingCash = Number((open.metadata as OpenMeta | null)?.openingCash ?? 0);
    const summary = await summarize(session.businessId, session.staffId, open.createdAt, openingCash);
    const meta: CloseMeta = {
      ...summary,
      openingCash,
      openedAt: open.createdAt.toISOString(),
      actualCash: parsed.data.actualCash,
      difference: parsed.data.actualCash - summary.expectedCash,
      note: parsed.data.note,
    };
    await prisma.auditLog.create({
      data: { businessId: session.businessId, staffId: session.staffId, action: "SHIFT_CLOSED", entity: "Shift", entityId: open.id, metadata: meta },
    });
    return NextResponse.json({ ok: true, shift: meta });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to update the shift." }, { status: 500 });
  }
}
