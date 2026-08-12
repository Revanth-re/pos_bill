import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { InventoryScreen } from "./InventoryScreen";

export default async function InventoryPage() {
  const session = await requireSession();
  return <InventoryScreen canAdjust={can(session.role, "inventory.adjust")} />;
}
