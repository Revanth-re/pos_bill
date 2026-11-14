import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { istDayStart } from "@/lib/time";

/**
 * Kitchen Display (KDS). Every bill made today is a kitchen order:
 *   NEW → COOKING → READY → SERVED (done, hidden)
 * The status is saved as one audit-log marker per bill (action KITCHEN_<STATUS>),
 * so no table change is needed. Cancelled / refunded bills drop off the screen.
 */
export const dynamic = "force-dynamic";

const STATUSES = ["COOKING", "READY", "SERVED"] as const;
type Marked = (typeof STATUSES)[number];
const ACTIONS = STATUSES.map((s) => `KITCHEN_${s}`);

export async function GET() {
  try {
    const session = await requireSession();
    const start = istDayStart();
    const [invoices, marks] = await Promise.all([
      prisma.invoice.findMany({
        where: { businessId: session.businessId, createdAt: { gte: start } },
        select: {
          id: true,
          status: true,
          createdAt: true,
          items: { select: { productName: true, quantity: true, product: { select: { alias: true } } } },
          order: { select: { type: true, label: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.auditLog.findMany({
        where: { businessId: session.businessId, action: { in: ACTIONS }, createdAt: { gte: start } },
        select: { entityId: true, action: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    const mark = new Map<string, { status: Marked; at: Date }>();
    for (const m of marks) if (m.entityId) mark.set(m.entityId, { status: m.action.slice(8) as Marked, at: m.createdAt });

    const orders = invoices
      .map((inv, i) => {
        const m = mark.get(inv.id);
        return {
          id: inv.id,
          token: i + 1, // same token number as the printed bill
          cancelled: inv.status === "CANCELLED" || inv.status === "REFUNDED",
          createdAt: inv.createdAt.toISOString(),
          type: inv.order?.type ?? "TAKEAWAY",
          label: inv.order?.label ?? null,
          items: inv.items.map((it) => ({ name: it.productName, alias: it.product?.alias || null, qty: Number(it.quantity) })),
          status: (m?.status ?? "NEW") as "NEW" | Marked,
          statusAt: m?.at.toISOString() ?? null,
        };
      })
      .filter((o) => !o.cancelled);

    return NextResponse.json({
      now: new Date().toISOString(),
      orders: orders.filter((o) => o.status !== "SERVED"),
      served: orders
        .filter((o) => o.status === "SERVED")
        .sort((a, b) => (b.statusAt! > a.statusAt! ? 1 : -1))
        .slice(0, 15),
    });
  } catch (e) {
    if (e instanceof UnauthenticatedError) return NextResponse.json({ error: "Login required" }, { status: 401 });
    console.error("[kitchen GET]", e);
    return NextResponse.json({ error: "Could not load kitchen orders" }, { status: 500 });
  }
}

const Body = z.object({ invoiceId: z.string().min(1), status: z.enum(["NEW", "COOKING", "READY", "SERVED"]) });

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
    const { invoiceId, status } = parsed.data;
    const inv = await prisma.invoice.findFirst({ where: { id: invoiceId, businessId: session.businessId }, select: { id: true } });
    if (!inv) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // One marker per bill: replace the old one (NEW = no marker).
    await prisma.$transaction(async (tx) => {
      await tx.auditLog.deleteMany({ where: { businessId: session.businessId, action: { in: ACTIONS }, entityId: invoiceId } });
      if (status !== "NEW") {
        await tx.auditLog.create({
          data: { businessId: session.businessId, staffId: session.staffId, action: `KITCHEN_${status}`, entity: "Invoice", entityId: invoiceId },
        });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof UnauthenticatedError) return NextResponse.json({ error: "Login required" }, { status: 401 });
    console.error("[kitchen POST]", e);
    return NextResponse.json({ error: "Could not update order" }, { status: 500 });
  }
}
