"use client";

import { useEffect } from "react";
import { bootstrapPwaInstall } from "@/lib/pwaInstallStore";

/** Registers the install-prompt listener on first app paint. */
export function PwaInstallBoot() {
  useEffect(() => {
    bootstrapPwaInstall();
  }, []);
  return null;
}
