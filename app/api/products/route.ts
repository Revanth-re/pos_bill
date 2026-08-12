import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

const productSchema = z.object({
  name: z.string().min(1).max(120),
  alias: z.string().max(120).optional(),
  sku: z.string().max(60).optional(),
  barcode: z.string().max(60).optional(),
  categoryId: z.string().cuid().optional(),
  unit: z.string().min(1).max(20).default("pc"),
  purchasePrice: z.number().nonnegative().default(0),
  sellingPrice: z.number().positive(),
  mrp: z.number().nonnegative().optional(),
  gstPercent: z.number().min(0).max(28).default(5),
  trackInventory: z.boolean().default(true),
  currentStock: z.number().nonnegative().default(0),
  minStock: z.number().nonnegative().default(0),
  imageUrl: z.string().max(500).optional(),
});

// GET /api/products?q=search — used by POS search (name/SKU/barcode/alias)
// and by the product management screen. Kept to a single indexed query so
// it stays fast on a shared tablet with a mediocre connection.
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const statusAll = searchParams.get("status") === "all";
    const limitParam = Number(searchParams.get("limit") ?? (statusAll ? 500 : 200));
    const take = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 200;

    const products = await prisma.product.findMany({
      where: {
        businessId: session.businessId,
        ...(statusAll ? {} : { status: "ACTIVE" }),
        ...(categoryId ? { categoryId } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { alias: { contains: q, mode: "insensitive" } },
                { sku: { contains: q, mode: "insensitive" } },
                { barcode: { equals: q } },
              ],
            }
          : {}),
      },
      include: statusAll ? { category: { select: { name: true } } } : undefined,
      orderBy: { name: "asc" },
      take,
    });

    return NextResponse.json({ products });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Unable to load products." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "products.create");

    const parsed = productSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid product data", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: { ...parsed.data, businessId: session.businessId },
    });

    if (parsed.data.currentStock > 0) {
      await prisma.inventoryMovement.create({
        data: {
          businessId: session.businessId,
          productId: product.id,
          type: "OPENING",
          quantity: parsed.data.currentStock,
          staffId: session.staffId,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        businessId: session.businessId,
        staffId: session.staffId,
        action: "PRODUCT_CREATED",
        entity: "Product",
        entityId: product.id,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (err instanceof PermissionError) {
      return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    }
    console.error(err);
    return NextResponse.json({ error: "Unable to save the product." }, { status: 500 });
  }
}
