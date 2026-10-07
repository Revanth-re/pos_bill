import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const customer = await prisma.customer.findFirst({
      where: { id, businessId: session.businessId },
    });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const ledger = await prisma.customerLedger.findMany({
      where: { customerId: id },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            status: true,
            items: { select: { productName: true, quantity: true, lineTotal: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json({ customer, ledger });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load the customer." }, { status: 500 });
  }
}

const updateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().max(20).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

// PATCH /api/customers/:id — edit name / phone / address / notes (balance is never editable here).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "customers.manage");
    const { id } = await params;
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });

    const existing = await prisma.customer.findFirst({ where: { id, businessId: session.businessId } });
    if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        notes: parsed.data.notes || null,
      },
    });
    await prisma.auditLog.create({
      data: { businessId: session.businessId, staffId: session.staffId, action: "CUSTOMER_UPDATED", entity: "Customer", entityId: id, metadata: { name: customer.name } },
    });
    return NextResponse.json({ customer });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to update the customer." }, { status: 500 });
  }
}

// DELETE /api/customers/:id — only when nothing is owed and no tiffin plan exists,
// so udhaari history is never silently lost. Past bills stay (customer link is cleared).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "billing.void"); // owner / manager only
    const { id } = await params;

    const customer = await prisma.customer.findFirst({
      where: { id, businessId: session.businessId },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    if (Number(customer.outstandingBalance) > 0) {
      return NextResponse.json(
        { error: `${customer.name} still owes ₹${Number(customer.outstandingBalance).toFixed(2)}. Settle the udhaari before deleting.` },
        { status: 409 }
      );
    }
    if (customer._count.subscriptions > 0) {
      return NextResponse.json({ error: `${customer.name} has a tiffin plan. Remove it from Tiffin first.` }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.updateMany({ where: { customerId: id, businessId: session.businessId }, data: { customerId: null } });
      await tx.customer.delete({ where: { id } });
      await tx.auditLog.create({
        data: { businessId: session.businessId, staffId: session.staffId, action: "CUSTOMER_DELETED", entity: "Customer", entityId: id, metadata: { name: customer.name, phone: customer.phone } },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Only an owner or manager can delete customers." }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to delete the customer." }, { status: 500 });
  }
}
