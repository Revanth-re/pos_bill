import { requireSession } from "@/lib/auth";
import { listOutlets } from "@/lib/outlets";
import { OutletsScreen } from "./OutletsScreen";

export default async function OutletsPage() {
  const session = await requireSession();
  const outlets = await listOutlets(session.userId, session.businessId);
  return <OutletsScreen outlets={outlets} canAdd={session.role === "OWNER"} />;
}
