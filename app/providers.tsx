"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { PwaInstallBoot } from "@/components/dashboard/PwaInstallBoot";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <PwaInstallBoot />
      {children}
    </SessionProvider>
  );
}
