import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

export async function GET() {
  try {
    const session = await requireSession();
    const plans = await prisma.tiffinPlan.findMany({
      where: { businessId: session.businessId, active: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ plans });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load plans." }, { status: 500 });
  }
}

const planSchema = z.object({
  name: z.string().min(1).max(80),
  price: z.number().positive(),
  totalMeals: z.number().int().positive(),
  durationDays: z.number().int().positive(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "tiffin.manage");

    const parsed = planSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const plan = await prisma.tiffinPlan.create({ data: { ...parsed.data, businessId: session.businessId } });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to save the plan." }, { status: 500 });
  }
}
