import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";
import { normalizeTopItems } from "@/lib/pos/topItems";
import { getMenuScope } from "@/lib/menu";

// Top items live in the default printer's existing `config` JSON (next to billFormat) — no schema change.

export async function GET() {
  try {
    const session = await requireSession();
    const printer = await prisma.printer.findFirst({ where: { businessId: session.businessId, isDefault: true }, select: { config: true } });
    const config = (printer?.config ?? {}) as unknown as { topItems?: unknown };
    return NextResponse.json({ topItems: normalizeTopItems(config.topItems) });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load top items." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "settings.manage");
    const topItems = normalizeTopItems((await req.json()).topItems);

    // Only keep products that belong to this business.
    const valid = await prisma.product.findMany({
      where: { id: { in: topItems.productIds }, businessId: { in: (await getMenuScope(session.businessId)).ids } },
      select: { id: true },
    });
    const validIds = new Set(valid.map((p) => p.id));
    topItems.productIds = topItems.productIds.filter((id) => validIds.has(id));

    const existing = await prisma.printer.findFirst({ where: { businessId: session.businessId, isDefault: true } });
    const config = { ...((existing?.config ?? {}) as unknown as Record<string, unknown>), topItems } as unknown as Prisma.InputJsonValue;
    if (existing) {
      await prisma.printer.update({ where: { id: existing.id }, data: { config } });
    } else {
      await prisma.printer.create({ data: { businessId: session.businessId, name: "Default Printer", type: "THERMAL_58MM", isDefault: true, config } });
    }
    return NextResponse.json({ topItems });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Only the owner can change top items." }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to save top items." }, { status: 500 });
  }
}
