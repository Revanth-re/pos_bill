"use client";

import { useT } from "@/lib/i18n/LanguageProvider";

/** <T k="nav.dashboard" /> — renders the translated string for the current
 * language. Use this to drop translations into server-component JSX
 * without converting the whole page to a client component. */
export function T({ k }: { k: string }) {
  const t = useT();
  return <>{t(k)}</>;
}
