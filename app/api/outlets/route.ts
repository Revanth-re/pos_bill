import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { listOutlets } from "@/lib/outlets";
import { getMenuScope } from "@/lib/menu";

/** GET /api/outlets — all shops of this login, with sales (owner/manager outlets). */
export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json({ outlets: await listOutlets(session.userId, session.businessId) });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load outlets." }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(20).optional(),
});

/** POST /api/outlets — owner adds a new shop. It shares the main shop's menu; bill format and top items are copied. */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (session.role !== "OWNER") return NextResponse.json({ error: "Only the owner can add outlets." }, { status: 403 });
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter the outlet name." }, { status: 400 });
    const { name, city, phone } = parsed.data;

    const source = await prisma.business.findUniqueOrThrow({
      where: { id: session.businessId },
      include: {
        expenseCategories: true,
        printers: { where: { isDefault: true }, take: 1 },
      },
    });
    // Top items can only point at main-menu products (those show in every outlet).
    const { mainId } = await getMenuScope(session.businessId);
    const mainProductIds = new Set(
      (await prisma.product.findMany({ where: { businessId: mainId, status: "ACTIVE" }, select: { id: true } })).map((p) => p.id)
    );

    const created = await prisma.$transaction(
      async (tx) => {
        const business = await tx.business.create({
          data: {
            name,
            city: city || null,
            phone: phone || source.phone,
            gstin: source.gstin,
            gstEnabled: source.gstEnabled,
            taxInclusive: source.taxInclusive,
            cgstPercent: source.cgstPercent,
            sgstPercent: source.sgstPercent,
            igstPercent: source.igstPercent,
            language: source.language,
            invoicePrefix: source.invoicePrefix,
            logoUrl: source.logoUrl,
          },
        });
        await tx.staff.create({ data: { businessId: business.id, userId: session.userId, role: "OWNER" } });
        await tx.expenseCategory.createMany({
          data: source.expenseCategories.map((c) => ({ businessId: business.id, name: c.name, isDefault: c.isDefault })),
        });

        // Menu is NOT copied: every outlet automatically shows the main shop's menu (lib/menu.ts),
        // plus any extra items added in that outlet. Categories are shared the same way.

        // Same printer + bill format; top items carried over when they're main-menu items.
        const srcPrinter = source.printers[0];
        const srcConfig = (srcPrinter?.config ?? {}) as unknown as { billFormat?: unknown; topItems?: { count?: number; productIds?: string[] } };
        const config: Record<string, unknown> = {};
        if (srcConfig.billFormat) config.billFormat = srcConfig.billFormat;
        if (srcConfig.topItems?.productIds) {
          config.topItems = {
            count: srcConfig.topItems.count ?? 6,
            productIds: srcConfig.topItems.productIds.filter((id) => mainProductIds.has(id)),
          };
        }
        await tx.printer.create({
          data: {
            businessId: business.id,
            name: srcPrinter?.name ?? "Default Printer",
            type: srcPrinter?.type ?? "BROWSER",
            isDefault: true,
            config: config as unknown as Prisma.InputJsonValue,
          },
        });
        return business;
      },
      { maxWait: 10_000, timeout: 60_000 }
    );

    return NextResponse.json({ outlet: { businessId: created.id, name: created.name } }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Unable to add the outlet. Please try again." }, { status: 500 });
  }
}
