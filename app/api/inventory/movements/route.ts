import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") ?? undefined;

    const movements = await prisma.inventoryMovement.findMany({
      where: { businessId: session.businessId, ...(productId ? { productId } : {}) },
      include: { product: { select: { name: true, unit: true } }, staff: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ movements });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load stock history." }, { status: 500 });
  }
}
