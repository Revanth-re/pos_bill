import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { normalizeIndianMobile, MOBILE_ERROR } from "@/lib/phone";

const Body = z.object({ phone: z.string().min(1).max(20), confirm: z.literal(true) });

/** Owner saves their real mobile number (asked right after sign-up). */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Enter your number and tick the box to confirm." }, { status: 400 });
    const phone = normalizeIndianMobile(parsed.data.phone);
    if (!phone) return NextResponse.json({ error: MOBILE_ERROR }, { status: 400 });

    const taken = await prisma.user.findFirst({ where: { phone, id: { not: session.userId } }, select: { id: true } });
    if (taken) return NextResponse.json({ error: "This number is already used by another Billo account. Please enter your own number." }, { status: 409 });

    await prisma.$transaction([
      prisma.user.update({ where: { id: session.userId }, data: { phone } }),
      ...(session.role === "OWNER" ? [prisma.business.update({ where: { id: session.businessId }, data: { phone } })] : []),
    ]);
    revalidateTag(`business-${session.businessId}`, { expire: 0 });
    return NextResponse.json({ ok: true, phone });
  } catch (e) {
    if (e instanceof UnauthenticatedError) return NextResponse.json({ error: "Login required" }, { status: 401 });
    console.error("[account phone]", e);
    return NextResponse.json({ error: "Could not save. Please try again." }, { status: 500 });
  }
}

/** GET: owner already has a number on their login → copy it to this shop (e.g. a new outlet). Returns { hasPhone }. */
export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ hasPhone: false }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { phone: true } });
  if (!user?.phone) return NextResponse.json({ hasPhone: false });
  if (session.role === "OWNER") {
    await prisma.business.updateMany({ where: { id: session.businessId, phone: null }, data: { phone: user.phone } });
    revalidateTag(`business-${session.businessId}`, { expire: 0 });
  }
  return NextResponse.json({ hasPhone: true });
}
