import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { OfflineSyncBoot } from "@/components/pos/OfflineSyncBoot";
import { ServiceWorkerBoot } from "@/components/pos/ServiceWorkerBoot";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const business = await prisma.business.findUniqueOrThrow({ where: { id: session.businessId } });

  return (
    <div className="flex min-h-screen">
      <Sidebar role={session.role} businessName={business.name} />
      <div className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0">{children}</div>
      <BottomNav />
      <OfflineSyncBoot />
      <ServiceWorkerBoot />
    </div>
  );
}
