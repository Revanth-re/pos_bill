import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { ProductsScreen } from "./ProductsScreen";

export default async function ProductsPage() {
  const session = await requireSession();
  return <ProductsScreen canEdit={can(session.role, "products.edit")} />;
}
