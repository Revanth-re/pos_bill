import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  alias: z.string().max(120).optional(),
  sku: z.string().max(60).optional(),
  barcode: z.string().max(60).optional(),
  categoryId: z.string().cuid().optional(),
  unit: z.string().min(1).max(20).optional(),
  purchasePrice: z.number().nonnegative().optional(),
  sellingPrice: z.number().positive().optional(),
  mrp: z.number().nonnegative().optional(),
  gstPercent: z.number().min(0).max(28).optional(),
  minStock: z.number().nonnegative().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  imageUrl: z.string().max(500).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "products.edit");
    const { id } = await params;

    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update", issues: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.product.findFirst({
      where: { id, businessId: session.businessId },
    });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const product = await prisma.product.update({ where: { id }, data: parsed.data });

    if (parsed.data.sellingPrice && Number(existing.sellingPrice) !== parsed.data.sellingPrice) {
      await prisma.auditLog.create({
        data: {
          businessId: session.businessId,
          staffId: session.staffId,
          action: "PRODUCT_PRICE_CHANGED",
          entity: "Product",
          entityId: id,
          metadata: { from: existing.sellingPrice, to: parsed.data.sellingPrice },
        },
      });
    }

    return NextResponse.json({ product });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to update the product." }, { status: 500 });
  }
}

// Soft delete only — a hard delete would orphan historical invoice_items.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "products.delete");
    const { id } = await params;

    await prisma.product.updateMany({
      where: { id, businessId: session.businessId },
      data: { status: "INACTIVE" },
    });

    await prisma.auditLog.create({
      data: {
        businessId: session.businessId,
        staffId: session.staffId,
        action: "PRODUCT_DELETED",
        entity: "Product",
        entityId: id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to delete the product." }, { status: 500 });
  }
}
