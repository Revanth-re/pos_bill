import { dayStart } from "@/lib/billing/token";
import { NextResponse } from "next/server";
import { alertDbDown } from "@/lib/alerts";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { getMenuScope } from "@/lib/menu";
import { assertPermission, PermissionError } from "@/lib/permissions";
import { checkoutSchema } from "@/validations/billing";
import { calculateBillTotals, validatePaymentSum } from "@/lib/billing/calculateTotals";

/**
 * POST /api/billing/checkout
 *
 * Implements spec §19 end-to-end, inside a single Prisma transaction so a
 * failure at any step (e.g. a payment insert) rolls back everything —
 * including inventory deductions and credit ledger updates. Steps below are
 * numbered to match the spec.
 */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "billing.create");

    const json = await req.json();
    const parsed = checkoutSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const input = parsed.data;

    // Idempotency: if this exact offline-originated bill was already synced,
    // return the existing invoice instead of double-billing.
    if (input.clientId) {
      const existing = await prisma.offlineTransaction.findUnique({
        where: { clientId: input.clientId },
        select: { invoiceId: true },
      });
      if (existing?.invoiceId) {
        const invoice = await prisma.invoice.findUnique({ where: { id: existing.invoiceId } });
        return NextResponse.json({ invoice, deduped: true });
      }
    }

    // SPEED: all read-only lookups run BEFORE the transaction and in parallel (one round-trip
    // instead of three), so the locked transaction is as short as possible.
    const productIds = input.items.map((i) => i.productId);
    const menuIds = (await getMenuScope(session.businessId)).ids; // cached
    const [products, customer] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds }, businessId: { in: menuIds } },
      }),
      input.customerId
        ? prisma.customer.findFirst({ where: { id: input.customerId, businessId: session.businessId } })
        : Promise.resolve(null),
    ]);
    if (products.length !== new Set(productIds).size) {
      return NextResponse.json({ error: "One or more products were not found" }, { status: 422 });
    }
    if (input.customerId && !customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 422 });
    }
    const productsById = new Map(products.map((p) => [p.id, p]));

    const result = await prisma.$transaction(async (tx) => {

      // Stock check before committing to anything.
      // No stock check: Billo sells by plate and doesn't block bills on stock counts.

      // Reserve the next invoice number AND read business settings in one round-trip.
      const business = await tx.business.update({
        where: { id: session.businessId },
        data: { invoiceCounter: { increment: 1 } },
      });

      // 2–5. Recalculate prices, discounts, GST, final total — server-authoritative.
      const totals = calculateBillTotals(input, productsById, business);

      // Validate payments sum to the computed grand total (handles split payments).
      const paymentCheck = validatePaymentSum(input.payments, totals.grandTotal);
      if (!paymentCheck.valid) {
        throw new BillingError(
          `Payments (₹${paymentCheck.paid}) do not match bill total (₹${totals.grandTotal})`
        );
      }

      const hasCredit = input.payments.some((p) => p.method === "CREDIT");

      // 6. Create order (status COMPLETED — held bills never reach checkout).
      const order = await tx.order.create({
        data: {
          businessId: session.businessId,
          staffId: session.staffId,
          customerId: input.customerId,
          type: input.orderType,
          status: "COMPLETED",
          billDiscountType: input.billDiscount?.type,
          billDiscountValue: input.billDiscount?.value,
          items: {
            create: input.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: productsById.get(i.productId)!.sellingPrice,
              discountType: i.discount?.type,
              discountValue: i.discount?.value,
            })),
          },
        },
      });

      const invoiceNumber = `${business.invoicePrefix}-${String(business.invoiceCounter).padStart(6, "0")}`;

      // 7–8. Create invoice + invoice items (snapshotted, immutable).
      const invoice = await tx.invoice.create({
        data: {
          businessId: session.businessId,
          invoiceNumber,
          orderId: order.id,
          staffId: session.staffId,
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          cgstTotal: totals.cgstTotal,
          sgstTotal: totals.sgstTotal,
          igstTotal: totals.igstTotal,
          grandTotal: totals.grandTotal,
          status: hasCredit && paymentCheck.paid < totals.grandTotal ? "PARTIALLY_PAID" : "PAID",
          items: {
            create: totals.lines.map((l) => ({
              productId: l.productId,
              productName: l.productName,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              discount: l.lineDiscount,
              gstPercent: l.gstPercent,
              lineTotal: l.lineTotal,
            })),
          },
        },
      });

      // 9. Create payment(s) — one row per split-payment method.
      await tx.payment.createMany({
        data: input.payments.filter((p) => p.amount > 0).map((p) => ({
          invoiceId: invoice.id,
          staffId: session.staffId,
          method: p.method,
          amount: p.amount,
          reference: p.reference,
        })),
      });

      // 10. Products that still have stock tracking on: take the sold quantity out of stock.
      for (const item of input.items) {
        const product = productsById.get(item.productId)!;
        if (!product.trackInventory) continue;
        await tx.product.update({ where: { id: product.id }, data: { currentStock: { decrement: item.quantity } } });
      }

      // 12. Update customer credit ledger if any portion was paid on Credit.
      const creditAmount = input.payments
        .filter((p) => p.method === "CREDIT")
        .reduce((sum, p) => sum + p.amount, 0);
      if (creditAmount > 0 && customer) {
        const updated = await tx.customer.update({
          where: { id: customer.id },
          data: { outstandingBalance: { increment: creditAmount } },
          select: { outstandingBalance: true },
        });
        const newBalance = Number(updated.outstandingBalance);
        await tx.customerLedger.create({
          data: {
            businessId: session.businessId,
            customerId: customer.id,
            type: "CREDIT_SALE",
            amount: creditAmount,
            balanceAfter: newBalance,
            invoiceId: invoice.id,
          },
        });
      }

      // If this checkout resumed a held bill, remove the hold.
      if (input.heldBillId) {
        await tx.heldBill.deleteMany({
          where: { id: input.heldBillId, businessId: session.businessId },
        });
      }

      // 16. Mark offline-origin sync record as synced, if applicable.
      if (input.clientId) {
        await tx.offlineTransaction.upsert({
          where: { clientId: input.clientId },
          create: {
            businessId: session.businessId,
            clientId: input.clientId,
            payload: json,
            status: "SYNCED",
            invoiceId: invoice.id,
            syncedAt: new Date(),
          },
          update: { status: "SYNCED", invoiceId: invoice.id, syncedAt: new Date() },
        });
      }

      return { invoice, invoiceNumber, totals };
    }, { maxWait: 10_000, timeout: 30_000 }); // remote DBs (Neon/Supabase) need more than the 5s default

    // After the bill is saved: token number + audit log together, on separate connections.
    const [tokenNumberRaw] = await Promise.all([
      prisma.invoice.count({
        where: { businessId: session.businessId, createdAt: { gte: dayStart(result.invoice.createdAt), lte: result.invoice.createdAt } },
      }),
      prisma.auditLog
        .create({
          data: {
            businessId: session.businessId,
            staffId: session.staffId,
            action: "BILL_CREATED",
            entity: "Invoice",
            entityId: result.invoice.id,
            metadata: { invoiceNumber: result.invoiceNumber, grandTotal: result.totals.grandTotal },
          },
        })
        .catch((e) => console.error("[checkout] audit log", e)),
    ]);
    const result2 = { ...result, tokenNumber: tokenNumberRaw };

    // 15. Printable invoice is generated client-side (see lib/printing) from
    // this response payload — no server-side rendering needed for receipts.
    // Daily token for the kitchen slip + payment split for the printed bill.
    const tokenNumber = result2.tokenNumber;
    const payments = input.payments.map((p) => ({ method: p.method, amount: p.amount }));
    return NextResponse.json({ invoice: { ...result.invoice, tokenNumber, payments }, totals: result.totals });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (err instanceof PermissionError) {
      return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    }
    if (err instanceof BillingError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // Never leak raw DB errors to the client — spec §22.
      console.error("Checkout DB error:", err.code, err.message);
      return NextResponse.json(
        { error: "Unable to save the bill. Please try again." },
        { status: 500 }
      );
    }
    console.error("Checkout error:", err);
    // Not a normal bill problem → likely the database is down. Tell the team (rate-limited).
    if (/connect|timeout|terminated|tenant|ENOTFOUND|ECONN/i.test(String((err as Error)?.message ?? ""))) {
      await alertDbDown(err, "saving a bill").catch(() => {});
    }
    return NextResponse.json(
      { error: "Unable to save the bill. Please try again." },
      { status: 500 }
    );
  }
}

class BillingError extends Error {}
