import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { BillingScreen } from "@/components/pos/BillingScreen";

export default async function BillingPage() {
  const session = await requireSession();

  const [products, categories, business] = await Promise.all([
    prisma.product.findMany({
      where: { businessId: session.businessId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.category.findMany({
      where: { businessId: session.businessId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.business.findUniqueOrThrow({ where: { id: session.businessId } }),
  ]);

  return (
    <BillingScreen
      businessName={business.name}
      cashierName={session.name}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      initialProducts={products.map((p) => ({
        id: p.id,
        name: p.name,
        sellingPrice: Number(p.sellingPrice),
        gstPercent: Number(p.gstPercent),
        unit: p.unit,
        currentStock: Number(p.currentStock),
        trackInventory: p.trackInventory,
        imageUrl: p.imageUrl,
      }))}
    />
  );
}
