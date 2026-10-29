import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { getMenuScope, mergeByName } from "@/lib/menu";
import { assertPermission, PermissionError } from "@/lib/permissions";

const categorySchema = z.object({
  name: z.string().min(1).max(60),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  try {
    const session = await requireSession();
    const scope = await getMenuScope(session.businessId);
    const rows = await prisma.category.findMany({
      where: { businessId: { in: scope.ids } },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
    const order = (c: unknown) => Number((c as { sortOrder?: number }).sortOrder ?? 0);
    const categories = mergeByName(rows, session.businessId).sort((a, b) => order(a) - order(b));
    return NextResponse.json({ categories });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load categories." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "products.create");

    const parsed = categorySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: { ...parsed.data, businessId: session.businessId },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to save the category." }, { status: 500 });
  }
}
