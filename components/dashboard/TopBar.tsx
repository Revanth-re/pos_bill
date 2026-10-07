"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";

export function TopBar({ businessName }: { businessName: string }) {
  const pathname = usePathname();

  // The billing/POS screen has its own dense header (search, connection
  // status, held bills) — stacking a second top bar there would eat
  // screen space the cashier needs. Every other screen gets this one.
  if (pathname.startsWith("/billing")) return null;

  return (
    <header className="no-select sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur md:hidden">
      <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
        <img src="/brand/billo-icon.png" alt="Billo" className="h-8 w-8 shrink-0 object-contain" />
        <span className="truncate text-base font-bold text-ink">{businessName}</span>
      </Link>
      <Link
        href="/profile"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-dark"
        aria-label="Profile"
      >
            <User className="h-5 w-5" />
      </Link>
    </header>
  );
}
