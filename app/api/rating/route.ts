import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { RATING_MILESTONES } from "@/lib/rating";

const Body = z.object({
  milestone: z.number().int().refine((m) => (RATING_MILESTONES as readonly number[]).includes(m)),
  stars: z.number().int().min(1).max(5).nullable(), // null = "Not now"
});

/** Owner's star rating of Billo (or "Not now"). Saved once per milestone. Shown on /admin. */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (session.role !== "OWNER") return NextResponse.json({ ok: false }, { status: 403 });
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
    const { milestone, stars } = parsed.data;
    const exists = await prisma.auditLog.findFirst({
      where: { businessId: session.businessId, action: { in: ["APP_RATING", "APP_RATING_SKIPPED"] }, metadata: { path: ["milestone"], equals: milestone } },
      select: { id: true },
    });
    if (!exists) {
      await prisma.auditLog.create({
        data: {
          businessId: session.businessId,
          staffId: session.staffId,
          action: stars ? "APP_RATING" : "APP_RATING_SKIPPED",
          entity: "Billo",
          metadata: { milestone, stars },
        },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof UnauthenticatedError) return NextResponse.json({ ok: false }, { status: 401 });
    console.error("[rating]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
