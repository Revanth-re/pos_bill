import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

const paymentSchema = z.object({
  amount: z.number().positive(),
  note: z.string().max(200).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "payments.record");
    const { id } = await params;

    const parsed = paymentSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid payment" }, { status: 400 });

    const customer = await prisma.customer.findFirst({ where: { id, businessId: session.businessId } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    if (parsed.data.amount > Number(customer.outstandingBalance)) {
      return NextResponse.json(
        { error: `Payment exceeds outstanding balance of ₹${customer.outstandingBalance}` },
        { status: 422 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const newBalance = Number(customer.outstandingBalance) - parsed.data.amount;
      const updated = await tx.customer.update({
        where: { id },
        data: { outstandingBalance: newBalance },
      });
      const entry = await tx.customerLedger.create({
        data: {
          businessId: session.businessId,
          customerId: id,
          type: "PAYMENT",
          amount: parsed.data.amount,
          balanceAfter: newBalance,
          note: parsed.data.note,
        },
      });
      await tx.auditLog.create({
        data: {
          businessId: session.businessId,
          staffId: session.staffId,
          action: "CREDIT_PAYMENT_RECEIVED",
          entity: "Customer",
          entityId: id,
          metadata: { amount: parsed.data.amount },
        },
      });
      return { updated, entry };
    });

    return NextResponse.json({ customer: result.updated, entry: result.entry });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to record the payment." }, { status: 500 });
  }
}
