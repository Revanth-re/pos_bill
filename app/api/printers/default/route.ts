import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

const printerSchema = z.object({
  type: z.enum(["THERMAL_58MM", "THERMAL_80MM", "A4", "BROWSER"]),
  bluetoothDeviceId: z.string().max(200).nullable().optional(),
  bluetoothDeviceName: z.string().max(200).nullable().optional(),
});

// GET /api/printers/default — current default printer + Bluetooth pairing
// state, so the billing screen knows whether to prompt for a Bluetooth
// connection before attempting to print.
export async function GET() {
  try {
    const session = await requireSession();
    const printer = await prisma.printer.findFirst({
      where: { businessId: session.businessId, isDefault: true },
    });
    return NextResponse.json({ printer });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load printer settings." }, { status: 500 });
  }
}


// PATCH /api/printers/default — there is exactly one default printer per
// business (seeded at registration), so Settings only ever edits that row
// rather than managing a full printer list.
export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "settings.manage");

    const parsed = printerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid printer settings" }, { status: 400 });
    }

    const existing = await prisma.printer.findFirst({
      where: { businessId: session.businessId, isDefault: true },
    });

    const printer = existing
      ? await prisma.printer.update({ where: { id: existing.id }, data: parsed.data })
      : await prisma.printer.create({
          data: { ...parsed.data, businessId: session.businessId, name: "Default Printer", isDefault: true },
        });

    return NextResponse.json({ printer });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to save printer settings." }, { status: 500 });
  }
}
