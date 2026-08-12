import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { ProductsScreen } from "./ProductsScreen";

export default async function ProductsPage() {
  const session = await requireSession();

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { businessId: session.businessId },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { businessId: session.businessId },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <ProductsScreen
      canEdit={true}
      initialProducts={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        categoryId: p.categoryId,
        categoryName: p.category?.name ?? null,
        unit: p.unit,
        sellingPrice: Number(p.sellingPrice),
        purchasePrice: Number(p.purchasePrice),
        gstPercent: Number(p.gstPercent),
        currentStock: Number(p.currentStock),
        minStock: Number(p.minStock),
        status: p.status,
        imageUrl: p.imageUrl,
      }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
