"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, ShieldCheck } from "lucide-react";
import { logoutEverywhere } from "@/lib/auth/deviceData";

/** Frame for Billo team logins: logo, "Admin" and Logout only — none of the shop app's menus. */
export function AdminShell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-paper">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 bg-brand-dark px-4 text-white">
        <Link href="/admin" className="flex items-center gap-2.5" aria-label="Billo admin home">
          <img src="/brand/billo-icon.png" alt="" className="h-8 w-8 rounded-lg bg-white object-contain p-0.5" />
          <span className="text-base font-extrabold">Billo Admin</span>
          <ShieldCheck className="h-4 w-4 text-accent" />
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-white/70 sm:inline">{name}</span>
          <button
            type="button"
            onClick={() => logoutEverywhere(signOut)}
            className="flex min-h-10 items-center gap-1.5 rounded-xl bg-white/10 px-3 text-sm font-bold hover:bg-white/15"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
