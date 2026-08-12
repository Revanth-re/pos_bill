import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

const expenseSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().cuid(),
  date: z.string().datetime().optional(),
  description: z.string().max(300).optional(),
  paymentMethod: z.enum(["CASH", "UPI", "CARD", "CREDIT"]),
});

function rangeStart(range: string | null): Date | undefined {
  const now = new Date();
  if (range === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (range === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (range === "month") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  return undefined;
}

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range");
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const start = rangeStart(range);

    const expenses = await prisma.expense.findMany({
      where: {
        businessId: session.businessId,
        ...(start ? { date: { gte: start } } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 200,
    });

    return NextResponse.json({ expenses });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load expenses." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "expenses.manage");

    const parsed = expenseSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid expense", issues: parsed.error.flatten() }, { status: 400 });
    }

    const category = await prisma.expenseCategory.findFirst({
      where: { id: parsed.data.categoryId, businessId: session.businessId },
    });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const expense = await prisma.expense.create({
      data: {
        businessId: session.businessId,
        categoryId: parsed.data.categoryId,
        amount: parsed.data.amount,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
        description: parsed.data.description,
        paymentMethod: parsed.data.paymentMethod,
      },
      include: { category: true },
    });

    await prisma.auditLog.create({
      data: {
        businessId: session.businessId,
        staffId: session.staffId,
        action: "EXPENSE_CREATED",
        entity: "Expense",
        entityId: expense.id,
        metadata: { amount: parsed.data.amount, category: category.name },
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to save the expense." }, { status: 500 });
  }
}
