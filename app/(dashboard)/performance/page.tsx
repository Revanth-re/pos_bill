import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PerformanceScreen } from "./PerformanceScreen";

export default async function PerformancePage() {
  const session = await requireSession();
  if (!can(session.role, "reports.view")) redirect("/dashboard");
  return <PerformanceScreen />;
}
