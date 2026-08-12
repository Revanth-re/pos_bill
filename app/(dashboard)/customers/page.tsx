import { requireSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { CustomersScreen } from "./CustomersScreen";

export default async function CustomersPage() {
  const session = await requireSession();
  return (
    <CustomersScreen
      canManage={can(session.role, "customers.manage")}
      canRecordPayment={can(session.role, "payments.record")}
    />
  );
}
