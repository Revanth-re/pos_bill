import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { ProductsScreen } from "./ProductsScreen";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const session = await requireSession();
  const canEdit = can(session.role, "products.edit");
  // "Add your products first" links here with ?new=1 → open the Add Product form straight away.
  const openNew = canEdit && (await searchParams).new === "1";
  return <ProductsScreen canEdit={canEdit} openNew={openNew} />;
}
