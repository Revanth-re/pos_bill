import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { TopBar } from "@/components/dashboard/TopBar";
import { OfflineSyncBoot } from "@/components/pos/OfflineSyncBoot";
import { ServiceWorkerBoot } from "@/components/pos/ServiceWorkerBoot";
import { InstallBanner } from "@/components/dashboard/InstallBanner";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const business = await prisma.business.findUniqueOrThrow({ where: { id: session.businessId } });

  return (
    <LanguageProvider initialLanguage={business.language}>
      <div className="flex min-h-screen">
        <Sidebar role={session.role} businessName={business.name} />
        <div className="flex-1 flex flex-col min-w-0 pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <TopBar businessName={business.name} />
          {children}
        </div>
        <BottomNav />
        <InstallBanner />
        <OfflineSyncBoot />
        <ServiceWorkerBoot />
      </div>
    </LanguageProvider>
  );
}
