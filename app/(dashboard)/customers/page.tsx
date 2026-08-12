import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { can } from "@/lib/permissions";
import { CustomersScreen } from "./CustomersScreen";

export default async function CustomersPage() {
  const session = await requireSession();

  const customers = await prisma.customer.findMany({
    where: { businessId: session.businessId },
    orderBy: { name: "asc" },
  });

  return (
    <CustomersScreen
      canManage={can(session.role, "customers.manage")}
      canRecordPayment={can(session.role, "payments.record")}
      initialCustomers={customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        outstandingBalance: Number(c.outstandingBalance),
      }))}
    />
  );
}
