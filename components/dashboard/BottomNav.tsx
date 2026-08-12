"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, LineChart, Package, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/LanguageProvider";

const ITEMS = [
  { href: "/dashboard", labelKey: "nav.home", icon: Home },
  { href: "/billing", labelKey: "nav.billing", icon: Receipt },
  { href: "/sales", labelKey: "nav.sales", icon: LineChart },
  { href: "/inventory", labelKey: "nav.inventory", icon: Package },
  { href: "/more", labelKey: "nav.more", icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav className="no-select md:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      {ITEMS.map(({ href, labelKey, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium touch-target transition-colors",
              active ? "text-brand" : "text-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
