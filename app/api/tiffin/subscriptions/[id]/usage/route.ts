import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

const usageSchema = z.object({
  type: z.enum(["USED", "SKIPPED", "EXTRA"]),
  reason: z.string().max(200).optional(),
  extraCharge: z.number().nonnegative().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "tiffin.manage");
    const { id } = await params;

    const parsed = usageSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const sub = await prisma.tiffinSubscription.findFirst({ where: { id, businessId: session.businessId } });
    if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

    if (parsed.data.type === "USED" && sub.mealsUsed >= sub.totalMeals) {
      return NextResponse.json({ error: "No meals remaining on this plan — use Extra Meal instead." }, { status: 422 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const usage = await tx.tiffinMealUsage.create({
        data: {
          subscriptionId: id,
          type: parsed.data.type,
          reason: parsed.data.reason,
          extraCharge: parsed.data.extraCharge,
        },
      });
      const updated = await tx.tiffinSubscription.update({
        where: { id },
        data: {
          mealsUsed: parsed.data.type === "USED" ? { increment: 1 } : undefined,
          mealsSkipped: parsed.data.type === "SKIPPED" ? { increment: 1 } : undefined,
          extraMeals: parsed.data.type === "EXTRA" ? { increment: 1 } : undefined,
        },
      });
      return { usage, updated };
    });

    return NextResponse.json({ subscription: result.updated });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to record the meal." }, { status: 500 });
  }
}
