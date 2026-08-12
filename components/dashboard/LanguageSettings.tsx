"use client";

import { useState } from "react";
import { LANGUAGES, type LanguageCode } from "@/lib/i18n/translations";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function LanguageSettings({ initialLanguage }: { initialLanguage: string }) {
  const { setLanguage: applyLanguage } = useLanguage();
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
          Navigation, billing, and common actions are translated. Some screens (Reports, detailed forms) are
          still English-only — full coverage is in progress.
        </p>
      )}
      {saving && <p className="mt-2 text-xs text-muted">Saving…</p>}
      {saved && !saving && <p className="mt-2 text-xs text-success">Saved.</p>}
    </div>
  );
}
