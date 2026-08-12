import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

export async function GET() {
  try {
    const session = await requireSession();
    const categories = await prisma.expenseCategory.findMany({
      where: { businessId: session.businessId },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    return NextResponse.json({ categories });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load expense categories." }, { status: 500 });
  }
}

const categorySchema = z.object({ name: z.string().min(1).max(60) });

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "expenses.manage");

    const parsed = categorySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid category" }, { status: 400 });

    const category = await prisma.expenseCategory.create({
      data: { businessId: session.businessId, name: parsed.data.name, isDefault: false },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to save the category." }, { status: 500 });
  }
}
