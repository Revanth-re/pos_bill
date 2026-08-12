import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { can } from "@/lib/permissions";
import { ExpensesScreen } from "./ExpensesScreen";

export default async function ExpensesPage() {
  const session = await requireSession();

  const [expenses, categories] = await Promise.all([
    prisma.expense.findMany({
      where: { businessId: session.businessId },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.expenseCategory.findMany({
      where: { businessId: session.businessId },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
  ]);

  return (
    <ExpensesScreen
      canManage={can(session.role, "expenses.manage")}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      initialExpenses={expenses.map((e) => ({
        id: e.id,
        amount: Number(e.amount),
        date: e.date.toISOString(),
        description: e.description,
        paymentMethod: e.paymentMethod,
        categoryId: e.categoryId,
        categoryName: e.category.name,
      }))}
    />
  );
}
