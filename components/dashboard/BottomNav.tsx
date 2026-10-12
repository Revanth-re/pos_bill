"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, LineChart, ReceiptText, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/LanguageProvider";

// Billing sits in the middle as the main button.
const ITEMS = [
  { href: "/dashboard", labelKey: "nav.home", icon: Home },
  { href: "/bills", labelKey: "nav.bills", icon: ReceiptText },
  { href: "/billing", labelKey: "nav.billing", icon: Receipt, main: true },
  { href: "/sales", labelKey: "nav.sales", icon: LineChart },
  { href: "/more", labelKey: "nav.more", icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav className="no-select md:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(6,72,76,0.06)]">
      {ITEMS.map(({ href, labelKey, icon: Icon, main }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        if (main)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="relative flex h-14 flex-1 flex-col items-center justify-end pb-1 text-xs font-semibold text-brand-dark"
            >
              <span
                className={cn(
                  "absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg ring-4 ring-surface transition-transform duration-150 active:scale-95",
                  active && "bg-brand-dark"
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              {t(labelKey)}
            </Link>
          );
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors duration-150",
              active ? "text-brand-dark font-semibold" : "text-muted active:text-ink"
            )}
          >
            {active && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-brand" />}
            <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150", active && "bg-brand-soft")}>
              <Icon className="h-5 w-5" />
            </span>
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
