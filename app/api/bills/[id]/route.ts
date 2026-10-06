import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { can, assertPermission, PermissionError } from "@/lib/permissions";
import { getTokenNumber, dayStart } from "@/lib/billing/token";

type Ctx = { params: Promise<{ id: string }> };

async function loadInvoice(businessId: string, id: string) {
  return prisma.invoice.findFirst({
    where: { id, businessId },
    include: {
      items: true,
      payments: true,
      staff: { include: { user: { select: { name: true } } } },
      order: { include: { customer: { select: { id: true, name: true } } } },
      business: { select: { name: true, address: true, city: true, phone: true, gstin: true } },
    },
  });
}

/** Full bill detail + its cancel/refund history (who, why, when, how much). */
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const inv = await loadInvoice(session.businessId, id);
    if (!inv || (!can(session.role, "sales.view.all") && inv.staffId !== session.staffId)) {
      return NextResponse.json({ error: "Bill not found." }, { status: 404 });
    }

    const [tokenNumber, history] = await Promise.all([
      getTokenNumber(session.businessId, inv.createdAt),
      prisma.auditLog.findMany({
        where: { businessId: session.businessId, entity: "Invoice", entityId: inv.id },
        include: { staff: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const b = inv.business;
    return NextResponse.json({
      bill: {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        tokenNumber,
        createdAt: inv.createdAt,
        status: inv.status,
        cashier: inv.staff.user.name,
        orderType: inv.order.type,
        customerName: inv.order.customer?.name ?? null,
        business: {
          name: b.name,
          address: [b.address, b.city, b.phone].filter(Boolean).join(", ") || null,
          gstin: b.gstin,
        },
        items: inv.items.map((i) => ({
          name: i.productName,
          qty: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          total: Number(i.lineTotal),
        })),
        subtotal: Number(inv.subtotal),
        discountTotal: Number(inv.discountTotal),
        cgstTotal: Number(inv.cgstTotal),
        sgstTotal: Number(inv.sgstTotal),
        igstTotal: Number(inv.igstTotal),
        grandTotal: Number(inv.grandTotal),
        payments: inv.payments.map((p) => ({ method: p.method, amount: Number(p.amount) })),
        history: history.map((h) => ({
          action: h.action,
          by: h.staff?.user.name ?? "System",
          at: h.createdAt,
          reason: (h.metadata as { reason?: string } | null)?.reason ?? null,
          amount: (h.metadata as { amount?: number; grandTotal?: number } | null)?.amount ??
            (h.metadata as { grandTotal?: number } | null)?.grandTotal ?? null,
        })),
      },
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load this bill." }, { status: 500 });
  }
}

const actionSchema = z.object({
  action: z.enum(["cancel", "refund", "reprint"]),
  reason: z.string().trim().max(300).optional(),
});

/**
 * cancel  → same-day void (wrong entry). Bill drops out of sales.
 * refund  → money returned to the customer (any day). Bill drops out of sales;
 *           if it was from an earlier day, its cash is taken out of today's drawer.
 * Both restore stock, reverse any udhaari credit, and log who/why/when/amount.
 * reprint → just logged so owners can see who reprinted what.
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const parsed = actionSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const { action, reason } = parsed.data;

    const inv = await loadInvoice(session.businessId, id);
    if (!inv || (!can(session.role, "sales.view.all") && inv.staffId !== session.staffId)) {
      return NextResponse.json({ error: "Bill not found." }, { status: 404 });
    }

    if (action === "reprint") {
      await prisma.auditLog.create({
        data: { businessId: session.businessId, staffId: session.staffId, action: "BILL_REPRINTED", entity: "Invoice", entityId: inv.id, metadata: { invoiceNumber: inv.invoiceNumber } },
      });
      return NextResponse.json({ ok: true });
    }

    assertPermission(session.role, "billing.void");
    if (!reason || reason.length < 3) {
      return NextResponse.json({ error: "Please enter a reason." }, { status: 400 });
    }
    if (inv.status === "CANCELLED" || inv.status === "REFUNDED") {
      return NextResponse.json({ error: `This bill is already ${inv.status.toLowerCase()}.` }, { status: 409 });
    }
    const sameDay = dayStart(inv.createdAt).getTime() === dayStart(new Date()).getTime();
    if (action === "cancel" && !sameDay) {
      return NextResponse.json({ error: "Only today's bills can be cancelled. Use Refund for older bills." }, { status: 422 });
    }

    const amount = Number(inv.grandTotal);
    const cashAmount = inv.payments.filter((p) => p.method === "CASH").reduce((s, p) => s + Number(p.amount), 0);
    const creditAmount = inv.payments.filter((p) => p.method === "CREDIT").reduce((s, p) => s + Number(p.amount), 0);
    const newStatus = action === "cancel" ? "CANCELLED" : "REFUNDED";
    const label = action === "cancel" ? "Bill cancelled" : "Bill refunded";

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({ where: { id: inv.id }, data: { status: newStatus } });
      await tx.order.update({ where: { id: inv.orderId }, data: { status: "CANCELLED" } });

      // Put back everything this bill took out of stock (products + recipe ingredients).
      const movements = await tx.inventoryMovement.findMany({
        where: { businessId: session.businessId, reference: inv.invoiceNumber, type: { in: ["SALE", "RECIPE_DEDUCTION"] } },
      });
      for (const m of movements) {
        const back = -Number(m.quantity);
        if (m.productId) await tx.product.update({ where: { id: m.productId }, data: { currentStock: { increment: back } } });
        if (m.ingredientId) await tx.ingredient.update({ where: { id: m.ingredientId }, data: { currentStock: { increment: back } } });
        await tx.inventoryMovement.create({
          data: {
            businessId: session.businessId,
            productId: m.productId,
            ingredientId: m.ingredientId,
            type: "ADJUSTMENT",
            quantity: back,
            reason: `${label}: ${reason}`,
            reference: inv.invoiceNumber,
            staffId: session.staffId,
          },
        });
      }

      // Reverse any udhaari this bill added to the customer.
      const customer = inv.order.customer;
      if (creditAmount > 0 && customer) {
        const c = await tx.customer.findUniqueOrThrow({ where: { id: customer.id } });
        const balanceAfter = Math.max(0, Number(c.outstandingBalance) - creditAmount);
        await tx.customer.update({ where: { id: c.id }, data: { outstandingBalance: balanceAfter } });
        await tx.customerLedger.create({
          data: { businessId: session.businessId, customerId: c.id, type: "ADJUSTMENT", amount: creditAmount, balanceAfter, invoiceId: inv.id, note: `${label} ${inv.invoiceNumber}` },
        });
      }

      await tx.auditLog.create({
        data: {
          businessId: session.businessId,
          staffId: session.staffId,
          action: action === "cancel" ? "BILL_CANCELLED" : "BILL_REFUNDED",
          entity: "Invoice",
          entityId: inv.id,
          metadata: {
            invoiceNumber: inv.invoiceNumber,
            reason,
            amount,
            cashAmount,
            sameDay,
            billStaffId: inv.staffId,
            invoiceCreatedAt: inv.createdAt.toISOString(),
          },
        },
      });
    });

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Only a manager or owner can do this." }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to update this bill. Please try again." }, { status: 500 });
  }
}
