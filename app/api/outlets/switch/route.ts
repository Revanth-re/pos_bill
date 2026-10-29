import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, unstable_update, UnauthenticatedError } from "@/lib/auth";
import { signOutletSwitch } from "@/lib/auth/outletSwitch";

/** POST /api/outlets/switch — move this login to another shop it belongs to. */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const parsed = z.object({ businessId: z.string().min(1) }).safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Pick an outlet." }, { status: 400 });

    const staff = await prisma.staff.findFirst({
      where: { userId: session.userId, businessId: parsed.data.businessId, status: "ACTIVE" },
      select: { id: true, role: true, business: { select: { id: true, name: true } } },
    });
    if (!staff) return NextResponse.json({ error: "You don't have access to this outlet." }, { status: 403 });

    const outletSwitch = await signOutletSwitch({
      userId: session.userId,
      staffId: staff.id,
      businessId: staff.business.id,
      businessName: staff.business.name,
      role: staff.role,
    });
    await unstable_update({ outletSwitch } as never);
    return NextResponse.json({ ok: true, outlet: { businessId: staff.business.id, name: staff.business.name } });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to switch outlet." }, { status: 500 });
  }
}
