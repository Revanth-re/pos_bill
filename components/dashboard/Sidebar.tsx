"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  LineChart,
  ShoppingBag,
  Package,
  Users,
  Wallet,
  Utensils,
  BarChart3,
  UserCog,
  Settings,
  Lock,
  ReceiptText,
  Clock,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { can, type Permission } from "@/lib/permissions";
import { useT } from "@/lib/i18n/LanguageProvider";
import type { StaffRole } from "@prisma/client";

const ITEMS: { href: string; labelKey: string; icon: typeof LayoutDashboard; permission?: Permission }[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/billing", labelKey: "nav.billing", icon: Receipt, permission: "billing.create" },
  { href: "/bills", labelKey: "nav.bills", icon: ReceiptText, permission: "billing.create" },
  { href: "/shifts", labelKey: "nav.shifts", icon: Clock, permission: "shift.manage" },
  { href: "/sales", labelKey: "nav.sales", icon: LineChart, permission: "sales.view.own" },
  { href: "/products", labelKey: "nav.products", icon: ShoppingBag, permission: "products.view" },
  { href: "/inventory", labelKey: "nav.inventory", icon: Package, permission: "inventory.view" },
  { href: "/customers", labelKey: "nav.customers", icon: Users, permission: "customers.view" },
  { href: "/expenses", labelKey: "nav.expenses", icon: Wallet, permission: "expenses.view" },
  { href: "/tiffin", labelKey: "nav.tiffin", icon: Utensils, permission: "tiffin.manage" },
  { href: "/reports", labelKey: "nav.reports", icon: BarChart3, permission: "reports.view" },
  { href: "/performance", labelKey: "nav.performance", icon: Trophy, permission: "reports.view" },
  { href: "/day-closing", labelKey: "nav.dayClosing", icon: Lock, permission: "dayClosing.perform" },
  { href: "/staff", labelKey: "nav.staff", icon: UserCog, permission: "staff.manage" },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, permission: "settings.manage" },
];

export function Sidebar({ role, businessName }: { role: StaffRole; businessName: string }) {
  const pathname = usePathname();
  const t = useT();
  const visibleItems = ITEMS.filter((item) => !item.permission || can(role, item.permission));

  return (
    <aside className="hidden md:flex md:w-[76px] lg:w-64 shrink-0 flex-col sticky top-0 h-screen overflow-y-auto bg-brand-dark text-white">
      <div className="flex h-16 items-center justify-center px-3 lg:justify-start lg:px-5">
        <Link href="/dashboard" aria-label="Billo home" className="flex items-center">
          <img src="/brand/billo-icon.png" alt="Billo" className="h-10 w-10 object-contain drop-shadow-sm lg:hidden" />
          <img src="/brand/billo-logo-light.png" alt="Billo" className="hidden h-9 w-auto lg:block" />
        </Link>
      </div>
      <Link
        href="/profile"
        title={businessName}
        className="mx-3 mb-1 flex items-center justify-center gap-3 rounded-xl bg-white/5 p-2 transition-colors duration-200 hover:bg-white/10 lg:justify-start lg:px-3"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-extrabold text-brand-dark">
          {businessName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden min-w-0 lg:block">
          <span className="block truncate text-sm font-semibold text-white">{businessName}</span>
          <span className="block text-xs text-white/60">{role.charAt(0) + role.slice(1).toLowerCase()}</span>
        </span>
      </Link>
      <nav className="no-select flex-1 space-y-1 px-3 py-4">
        {visibleItems.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={t(labelKey)}
              className={cn(
                "relative flex min-h-11 items-center justify-center lg:justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-white/10 text-white before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r before:bg-accent"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active && "text-accent")} />
              <span className="hidden lg:inline truncate">{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
