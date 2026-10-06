import { NextResponse } from "next/server";
import type { Prisma, InvoiceStatus, PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getTokenMap } from "@/lib/billing/token";

const PAGE_SIZE = 25;
const STATUSES = ["PAID", "PARTIALLY_PAID", "CANCELLED", "REFUNDED"];
const METHODS = ["CASH", "UPI", "CARD", "CREDIT"];

/** Bill History list: search, filter, paginate. Cashiers only see their own bills. */
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const sp = new URL(req.url).searchParams;
    const page = Math.max(1, Number(sp.get("page") ?? 1) || 1);
    const q = (sp.get("q") ?? "").trim();
    const status = sp.get("status") ?? "";
    const method = sp.get("method") ?? "";
    const from = sp.get("from");
    const to = sp.get("to");

    const where: Prisma.InvoiceWhereInput = { businessId: session.businessId };
    if (!can(session.role, "sales.view.all")) where.staffId = session.staffId;
    if (STATUSES.includes(status)) where.status = status as InvoiceStatus;
    if (METHODS.includes(method)) where.payments = { some: { method: method as PaymentMethod } };
    if (from || to) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (from) { const d = new Date(from); d.setHours(0, 0, 0, 0); createdAt.gte = d; }
      if (to) { const d = new Date(to); d.setHours(23, 59, 59, 999); createdAt.lte = d; }
      where.createdAt = createdAt;
    }
    if (q) {
      where.OR = [
        { invoiceNumber: { contains: q, mode: "insensitive" } },
        { items: { some: { productName: { contains: q, mode: "insensitive" } } } },
        { staff: { user: { name: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: {
          items: { select: { productName: true, quantity: true } },
          payments: { select: { method: true, amount: true } },
          staff: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);
    const tokens = await getTokenMap(session.businessId, invoices);

    return NextResponse.json({
      page,
      pageSize: PAGE_SIZE,
      total,
      bills: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        tokenNumber: tokens.get(inv.id) ?? null,
        createdAt: inv.createdAt,
        cashier: inv.staff.user.name,
        itemCount: inv.items.reduce((s, i) => s + Number(i.quantity), 0),
        itemSummary: inv.items.map((i) => `${Number(i.quantity)}× ${i.productName}`).join(", "),
        grandTotal: Number(inv.grandTotal),
        methods: Array.from(new Set(inv.payments.map((p) => p.method))),
        status: inv.status,
      })),
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load bills." }, { status: 500 });
  }
}
