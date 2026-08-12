"use client";

import { useState } from "react";
import { LANGUAGES, type LanguageCode } from "@/lib/i18n/translations";
import { useLanguage, useT } from "@/lib/i18n/LanguageProvider";

export function LanguageSettings({ initialLanguage }: { initialLanguage: string }) {
  const { setLanguage: applyLanguage } = useLanguage();
  const t = useT();
  const [language, setLanguage] = useState(initialLanguage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleChange(code: string) {
    setLanguage(code);
    applyLanguage(code as LanguageCode); // instant, app-wide — no reload needed
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: code }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  return (
    <div>
      <select
        value={language}
        onChange={(e) => handleChange(e.target.value)}
        className="field max-w-xs"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
      {language !== "en" && (
        <p className="mt-2 text-sm text-muted">
          {LANGUAGES.find((l) => l.code === language)?.label} — {t("toast.saved")}
        </p>
      )}
      {saving && <p className="mt-2 text-xs text-muted">{t("common.loading")}</p>}
      {saved && !saving && <p className="mt-2 text-xs text-success">{t("toast.saved")}</p>}
    </div>
  );
}
