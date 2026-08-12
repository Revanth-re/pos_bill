import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

const adjustSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().refine((n) => n !== 0, "Enter a non-zero adjustment"),
  reason: z.string().min(1, "Reason is required").max(200),
  isDamage: z.boolean().default(false),
});

// POST /api/inventory/adjust — manual stock correction. `quantity` is
// signed: positive adds stock (e.g. found extra), negative removes it
// (e.g. spoilage, breakage, miscount). Always requires a reason, and
// always writes an InventoryMovement row so nothing changes stock silently.
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "inventory.adjust");

    const parsed = adjustSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid adjustment", issues: parsed.error.flatten() }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { id: parsed.data.productId, businessId: session.businessId },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: product.id },
        data: { currentStock: { increment: parsed.data.quantity } },
      });
      const movement = await tx.inventoryMovement.create({
        data: {
          businessId: session.businessId,
          productId: product.id,
          type: parsed.data.isDamage ? "DAMAGE" : "ADJUSTMENT",
          quantity: parsed.data.quantity,
          reason: parsed.data.reason,
          staffId: session.staffId,
        },
      });
      await tx.auditLog.create({
        data: {
          businessId: session.businessId,
          staffId: session.staffId,
          action: "INVENTORY_ADJUSTED",
          entity: "Product",
          entityId: product.id,
          metadata: { quantity: parsed.data.quantity, reason: parsed.data.reason },
        },
      });
      return { updated, movement };
    });

    return NextResponse.json({ product: result.updated, movement: result.movement });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to save the adjustment." }, { status: 500 });
  }
}
