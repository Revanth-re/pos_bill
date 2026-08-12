import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: { id, businessId: session.businessId },
      include: { recipe: { include: { lines: { include: { ingredient: true } } } } },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const lines = product.recipe?.lines ?? [];
    const foodCost = round2(
      lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.ingredient.purchaseCost), 0)
    );
    const sellingPrice = Number(product.sellingPrice);
    const grossProfit = round2(sellingPrice - foodCost);
    const foodCostPercent = sellingPrice > 0 ? round2((foodCost / sellingPrice) * 100) : 0;
    const grossMargin = sellingPrice > 0 ? round2((grossProfit / sellingPrice) * 100) : 0;

    return NextResponse.json({
      lines: lines.map((l) => ({
        ingredientId: l.ingredientId,
        ingredientName: l.ingredient.name,
        unit: l.ingredient.unit,
        quantity: Number(l.quantity),
        purchaseCost: Number(l.ingredient.purchaseCost),
      })),
      sellingPrice,
      foodCost,
      foodCostPercent,
      grossProfit,
      grossMargin,
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load the recipe." }, { status: 500 });
  }
}

const recipeSchema = z.object({
  lines: z.array(z.object({ ingredientId: z.string().cuid(), quantity: z.number().positive() })),
});

// PUT replaces the entire recipe (simplest correct semantics for a small
// per-dish ingredient list — no incremental add/remove endpoints needed).
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "products.edit");
    const { id } = await params;

    const parsed = recipeSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid recipe" }, { status: 400 });

    const product = await prisma.product.findFirst({ where: { id, businessId: session.businessId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.upsert({
        where: { productId: id },
        create: { productId: id },
        update: {},
      });
      await tx.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
      if (parsed.data.lines.length > 0) {
        await tx.recipeIngredient.createMany({
          data: parsed.data.lines.map((l) => ({
            recipeId: recipe.id,
            ingredientId: l.ingredientId,
            quantity: l.quantity,
          })),
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to save the recipe." }, { status: 500 });
  }
}
