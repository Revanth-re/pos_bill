import { prisma } from "@/lib/db/prisma";

/**
 * Permanently deletes an owner's account:
 *  - every shop/outlet where this user is OWNER, with ALL its data
 *    (bills, payments, orders, products, menu, customers, udhaari, tiffin, expenses,
 *     day closings, printers, settings, logs, kitchen markers)
 *  - every staff login created for those shops (unless that person also works at another shop)
 *  - the owner's own login.
 * Runs in one transaction: either everything is deleted or nothing is.
 */
export async function deleteOwnerAccount(userId: string) {
  const owned = await prisma.staff.findMany({ where: { userId, role: "OWNER" }, select: { businessId: true } });
  const B = [...new Set(owned.map((s) => s.businessId))];
  const inB = { businessId: { in: B } };

  // People who had a login at these shops (owner included) — decide afterwards who to remove.
  const people = await prisma.staff.findMany({ where: inB, select: { userId: true } });
  const userIds = [...new Set([userId, ...people.map((p) => p.userId)])];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } });

  const counts = await prisma.$transaction(
    async (tx) => {
      const c: Record<string, number> = {};
      const run = async (name: string, p: Promise<{ count: number }>) => {
        c[name] = (await p).count;
      };
      if (B.length) {
        // Children first (some links don't cascade), then the shop itself.
        await run("tiffinUsage", tx.tiffinMealUsage.deleteMany({ where: { subscription: inB } }));
        await run("tiffinSubscriptions", tx.tiffinSubscription.deleteMany({ where: inB }));
        await run("udhaariEntries", tx.customerLedger.deleteMany({ where: inB }));
        await run("payments", tx.payment.deleteMany({ where: { invoice: inB } }));
        await run("billItems", tx.invoiceItem.deleteMany({ where: { invoice: inB } }));
        await run("bills", tx.invoice.deleteMany({ where: inB }));
        await run("orderItems", tx.orderItem.deleteMany({ where: { order: inB } }));
        await run("orders", tx.order.deleteMany({ where: inB }));
        await run("heldBills", tx.heldBill.deleteMany({ where: inB }));
        await run("stockMoves", tx.inventoryMovement.deleteMany({ where: inB }));
        await run("dayClosings", tx.dayClosing.deleteMany({ where: inB }));
        await run("expenses", tx.expense.deleteMany({ where: inB }));
        await run("expenseCategories", tx.expenseCategory.deleteMany({ where: inB }));
        await run("auditLogs", tx.auditLog.deleteMany({ where: inB }));
        await run("notifications", tx.notification.deleteMany({ where: inB }));
        await run("printers", tx.printer.deleteMany({ where: inB }));
        await run("offline", tx.offlineTransaction.deleteMany({ where: inB }));
        await run("recipeLines", tx.recipeIngredient.deleteMany({ where: { recipe: { product: inB } } }));
        await run("recipes", tx.recipe.deleteMany({ where: { product: inB } }));
        await run("products", tx.product.deleteMany({ where: inB }));
        await run("ingredients", tx.ingredient.deleteMany({ where: inB }));
        await run("categories", tx.category.deleteMany({ where: inB }));
        await run("tiffinPlans", tx.tiffinPlan.deleteMany({ where: inB }));
        await run("customers", tx.customer.deleteMany({ where: inB }));
        await run("staff", tx.staff.deleteMany({ where: inB }));
        await run("businesses", tx.business.deleteMany({ where: { id: { in: B } } }));
      }
      // Remove logins that no longer belong to any shop (the owner always).
      const stillWorking = await tx.staff.findMany({ where: { userId: { in: userIds } }, select: { userId: true } });
      const keep = new Set(stillWorking.map((s) => s.userId));
      keep.delete(userId);
      const remove = users.filter((u) => !keep.has(u.id));
      for (const u of remove) {
        await tx.verificationToken.deleteMany({ where: { identifier: { contains: u.email.toLowerCase() } } });
      }
      await run("logins", tx.user.deleteMany({ where: { id: { in: remove.map((u) => u.id) } } }));
      return c;
    },
    { maxWait: 15_000, timeout: 120_000 }
  );
  return { businesses: B.length, counts };
}
