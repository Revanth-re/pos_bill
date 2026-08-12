import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";

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
      include: { invoice: { select: { invoiceNumber: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ customer, ledger });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load the customer." }, { status: 500 });
  }
}
