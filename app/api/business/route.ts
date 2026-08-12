import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

const businessSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  gstin: z.string().max(20).optional(),
  gstEnabled: z.boolean().optional(),
  taxInclusive: z.boolean().optional(),
  cgstPercent: z.number().min(0).max(28).optional(),
  sgstPercent: z.number().min(0).max(28).optional(),
  igstPercent: z.number().min(0).max(28).optional(),
  invoicePrefix: z.string().min(1).max(10).optional(),
  language: z.enum(["en", "hi", "ta", "te", "kn", "ml", "mr", "bn", "gu", "pa"]).optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "settings.manage");

    const parsed = businessSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings", issues: parsed.error.flatten() }, { status: 400 });
    }

    const business = await prisma.business.update({
      where: { id: session.businessId },
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        businessId: session.businessId,
        staffId: session.staffId,
        action: "SETTINGS_UPDATED",
        entity: "Business",
        entityId: business.id,
        metadata: parsed.data,
      },
    });

    return NextResponse.json({ business });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to save settings. Please try again." }, { status: 500 });
  }
}
