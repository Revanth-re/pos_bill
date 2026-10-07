import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";
import { normalizeFormat } from "@/lib/printing/billFormat";

// Bill format lives in the default printer's existing `config` JSON — no schema change.

export async function GET() {
  try {
    const session = await requireSession();
    const printer = await prisma.printer.findFirst({ where: { businessId: session.businessId, isDefault: true } });
    const config = (printer?.config ?? {}) as { billFormat?: unknown };
    return NextResponse.json({ format: normalizeFormat(config.billFormat) });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load the bill format." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "settings.manage");
    const format = normalizeFormat((await req.json()).format);

    const existing = await prisma.printer.findFirst({ where: { businessId: session.businessId, isDefault: true } });
    const config = { ...((existing?.config ?? {}) as Record<string, unknown>), billFormat: format } as Prisma.InputJsonValue;
    if (existing) {
      await prisma.printer.update({ where: { id: existing.id }, data: { config } });
    } else {
      await prisma.printer.create({
        data: { businessId: session.businessId, name: "Default Printer", type: format.paper === "80" ? "THERMAL_80MM" : "THERMAL_58MM", isDefault: true, config },
      });
    }
    return NextResponse.json({ format });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Only the owner can change the bill format." }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to save the bill format." }, { status: 500 });
  }
}
