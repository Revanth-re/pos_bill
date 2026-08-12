import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

export async function GET() {
  try {
    const session = await requireSession();
    const subscriptions = await prisma.tiffinSubscription.findMany({
      where: { businessId: session.businessId, status: "ACTIVE" },
      include: { customer: { select: { name: true, phone: true } }, plan: { select: { name: true } } },
      orderBy: { endDate: "asc" },
    });
    return NextResponse.json({ subscriptions });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load subscriptions." }, { status: 500 });
  }
}

const subSchema = z.object({
  planId: z.string().cuid(),
  customerId: z.string().cuid(),
  amountPaid: z.number().nonnegative(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "tiffin.manage");

    const parsed = subSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });

    const plan = await prisma.tiffinPlan.findFirst({ where: { id: parsed.data.planId, businessId: session.businessId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const customer = await prisma.customer.findFirst({ where: { id: parsed.data.customerId, businessId: session.businessId } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const subscription = await prisma.tiffinSubscription.create({
      data: {
        businessId: session.businessId,
        planId: plan.id,
        customerId: customer.id,
        totalMeals: plan.totalMeals,
        endDate,
        amountPaid: parsed.data.amountPaid,
      },
      include: { customer: { select: { name: true, phone: true } }, plan: { select: { name: true } } },
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to create the subscription." }, { status: 500 });
  }
}
