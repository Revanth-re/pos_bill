import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";
import { holdBillSchema } from "@/validations/billing";

// GET /api/held-bills — list held bills for this business (any staff can see
// all held bills, since another cashier may need to resume one).
export async function GET() {
  try {
    const session = await requireSession();
    const heldBills = await prisma.heldBill.findMany({
      where: { businessId: session.businessId },
      include: { staff: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ heldBills });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Unable to load held bills." }, { status: 500 });
  }
}

// POST /api/held-bills — park the current cart ("customer is waiting").
// Deliberately does NOT touch inventory or create an Order — see §3.
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "billing.create");

    const parsed = holdBillSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid hold-bill payload" }, { status: 400 });
    }

    const heldBill = await prisma.heldBill.create({
      data: {
        businessId: session.businessId,
        staffId: session.staffId,
        label: parsed.data.label,
        cartJson: parsed.data,
      },
    });

    return NextResponse.json({ heldBill });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (err instanceof PermissionError) {
      return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    }
    console.error(err);
    return NextResponse.json({ error: "Unable to hold the bill." }, { status: 500 });
  }
}
