import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { ReportsScreen } from "./ReportsScreen";

export default async function ReportsPage() {
  const session = await requireSession();
  return <ReportsScreen canViewProfit={can(session.role, "profit.view")} />;
}
