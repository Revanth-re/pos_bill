import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { can } from "@/lib/permissions";
import { InventoryScreen } from "./InventoryScreen";

export default async function InventoryPage() {
  const session = await requireSession();

  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      where: { businessId: session.businessId, status: "ACTIVE", trackInventory: true },
      orderBy: { name: "asc" },
    }),
    prisma.inventoryMovement.findMany({
      where: { businessId: session.businessId },
      include: { product: { select: { name: true, unit: true } }, staff: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <InventoryScreen
      canAdjust={can(session.role, "inventory.adjust")}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        unit: p.unit,
        currentStock: Number(p.currentStock),
        minStock: Number(p.minStock),
        imageUrl: p.imageUrl,
      }))}
      initialMovements={movements.map((m) => ({
        id: m.id,
        productName: m.product?.name ?? "—",
        unit: m.product?.unit ?? "",
        type: m.type,
        quantity: Number(m.quantity),
        reason: m.reason,
        staffName: m.staff?.user.name ?? "System",
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  );
}
