import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getShellBusiness } from "@/lib/data/business";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { TopBar } from "@/components/dashboard/TopBar";
import { OfflineSyncBoot } from "@/components/pos/OfflineSyncBoot";
import { ServiceWorkerBoot } from "@/components/pos/ServiceWorkerBoot";
import { ApiCacheBoot } from "@/components/pos/ApiCacheBoot";
import { PhoneRequiredModal } from "@/components/pos/PhoneRequiredModal";
import { InstallTracker } from "@/components/pos/InstallTracker";
import { PresenceBeat } from "@/components/pos/PresenceBeat";
import { InstallBanner } from "@/components/dashboard/InstallBanner";
import { OfflineBanner } from "@/components/dashboard/OfflineBanner";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { isBilloAdmin } from "@/lib/admin";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const business = await getShellBusiness(session.businessId);
  // Logged in with a shop that no longer exists (e.g. after a database move) → log out cleanly.
  if (!business) redirect("/api/session-reset");

  // Billo team: only the admin panel, in its own simple frame (no shop menus, billing or popups).
  if (isBilloAdmin(session.email)) return <AdminShell name={session.name}>{children}</AdminShell>;

  // Kitchen staff get a clean full-screen kitchen display — no menus, billing or reports.
  if (session.role === "KITCHEN") {
    return (
      <LanguageProvider initialLanguage={business.language}>
        <div className="app-shell flex min-h-dvh w-full flex-col">{children}</div>
        <ServiceWorkerBoot />
        <PresenceBeat />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider initialLanguage={business.language}>
      <div className="app-shell flex min-h-screen w-full max-w-full overflow-x-clip">
        <Sidebar role={session.role} businessName={business.name} />
        <div className="flex-1 flex flex-col min-w-0 pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <TopBar businessName={business.name} />
          <OfflineBanner />
          {children}
        </div>
        <BottomNav />
        <InstallBanner />
        <OfflineSyncBoot />
        <ServiceWorkerBoot />
        <ApiCacheBoot />
        <InstallTracker />
        <PresenceBeat />
        {session.role === "OWNER" && !business.phone && <PhoneRequiredModal />}
      </div>
    </LanguageProvider>
  );
}
