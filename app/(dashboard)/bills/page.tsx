import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { BillsScreen } from "./BillsScreen";

export default async function BillsPage() {
  const session = await requireSession();
  return <BillsScreen canVoid={can(session.role, "billing.void")} seeAll={can(session.role, "sales.view.all")} />;
}
