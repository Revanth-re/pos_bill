"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { translate, type LanguageCode } from "./translations";

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: string;
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState<LanguageCode>((initialLanguage as LanguageCode) || "en");

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Outside the provider (e.g. auth pages before login) — default to
    // English rather than throwing, since those screens are pre-business.
    return { language: "en", setLanguage: () => {} };
  }
  return ctx;
}

/** t("nav.dashboard") -> the string in whatever language is currently active. */
export function useT() {
  const { language } = useLanguage();
  return useCallback((key: string) => translate(key, language), [language]);
}
