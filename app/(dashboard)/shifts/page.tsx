import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { ShiftsScreen } from "./ShiftsScreen";

export default async function ShiftsPage() {
  const session = await requireSession();
  return <ShiftsScreen seeAll={can(session.role, "sales.view.all")} />;
}
