import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

export async function GET() {
  try {
    const session = await requireSession();
    const ingredients = await prisma.ingredient.findMany({
      where: { businessId: session.businessId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ ingredients });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load ingredients." }, { status: 500 });
  }
}

const ingredientSchema = z.object({
  name: z.string().min(1).max(120),
  unit: z.string().min(1).max(20),
  purchaseCost: z.number().nonnegative(),
  currentStock: z.number().nonnegative().default(0),
  minStock: z.number().nonnegative().default(0),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "products.create");

    const parsed = ingredientSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid ingredient" }, { status: 400 });

    const ingredient = await prisma.ingredient.create({
      data: { ...parsed.data, businessId: session.businessId },
    });
    return NextResponse.json({ ingredient }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to save the ingredient." }, { status: 500 });
  }
}
