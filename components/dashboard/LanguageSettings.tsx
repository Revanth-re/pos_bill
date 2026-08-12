"use client";

import { useState } from "react";

const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ml", label: "മലയാളം (Malayalam)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "bn", label: "বাংলা (Bengali)" },
];

export function LanguageSettings({ initialLanguage }: { initialLanguage: string }) {
  const [language, setLanguage] = useState(initialLanguage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleChange(code: string) {
    setLanguage(code);
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
          Saved. The billing screen is currently English-only — full {LANGUAGES.find((l) => l.code === language)?.label} translation is on the roadmap.
        </p>
      )}
      {saving && <p className="mt-2 text-xs text-muted">Saving…</p>}
      {saved && !saving && <p className="mt-2 text-xs text-success">Saved.</p>}
    </div>
  );
}
