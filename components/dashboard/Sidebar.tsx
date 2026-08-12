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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { can, type Permission } from "@/lib/permissions";
import { useT } from "@/lib/i18n/LanguageProvider";
import type { StaffRole } from "@prisma/client";

const ITEMS: { href: string; labelKey: string; icon: typeof LayoutDashboard; permission?: Permission }[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/billing", labelKey: "nav.billing", icon: Receipt, permission: "billing.create" },
  { href: "/sales", labelKey: "nav.sales", icon: LineChart, permission: "sales.view.own" },
  { href: "/products", labelKey: "nav.products", icon: ShoppingBag, permission: "products.view" },
  { href: "/inventory", labelKey: "nav.inventory", icon: Package, permission: "inventory.view" },
  { href: "/customers", labelKey: "nav.customers", icon: Users, permission: "customers.view" },
  { href: "/expenses", labelKey: "nav.expenses", icon: Wallet, permission: "expenses.view" },
  { href: "/tiffin", labelKey: "nav.tiffin", icon: Utensils, permission: "tiffin.manage" },
  { href: "/reports", labelKey: "nav.reports", icon: BarChart3, permission: "reports.view" },
  { href: "/day-closing", labelKey: "nav.dayClosing", icon: Lock, permission: "dayClosing.perform" },
  { href: "/staff", labelKey: "nav.staff", icon: UserCog, permission: "staff.manage" },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, permission: "settings.manage" },
];

export function Sidebar({ role, businessName }: { role: StaffRole; businessName: string }) {
  const pathname = usePathname();
  const t = useT();
  const visibleItems = ITEMS.filter((item) => !item.permission || can(role, item.permission));

  return (
    <aside className="hidden md:flex md:w-56 lg:w-64 shrink-0 flex-col border-r border-border bg-surface">
      <Link href="/profile" className="flex items-center gap-2 px-4 py-4 transition-colors hover:bg-paper">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink/20 bg-brand text-base font-black text-white">
          ₹
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{businessName}</p>
          <p className="text-xs text-muted">{role.charAt(0) + role.slice(1).toLowerCase()}</p>
        </div>
      </Link>
      <nav className="no-select flex-1 space-y-0.5 px-2 py-2">
        {visibleItems.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-brand-soft text-brand-dark" : "text-ink-soft hover:bg-paper"
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
