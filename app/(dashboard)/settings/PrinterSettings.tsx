"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/LanguageProvider";
import type { PrinterType } from "@/lib/printing/types";

export function PrinterSettings({ initialType }: { initialType: PrinterType }) {
  const t = useT();
  const OPTIONS: { type: PrinterType; label: string; hint: string }[] = [
    { type: "THERMAL_58MM", label: t("printer.58mm"), hint: t("printer.58mmHint") },
    { type: "THERMAL_80MM", label: t("printer.80mm"), hint: t("printer.80mmHint") },
    { type: "A4", label: t("printer.a4"), hint: t("printer.a4Hint") },
    { type: "BROWSER", label: t("printer.browser"), hint: t("printer.browserHint") },
  ];
  const [selected, setSelected] = useState<PrinterType>(initialType);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSelect(type: PrinterType) {
    setSelected(type);
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/printers/default", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.type}
            onClick={() => handleSelect(opt.type)}
            className={cn(
              "touch-target rounded-md border-2 p-3 text-left transition-colors",
              selected === opt.type ? "border-brand bg-brand-soft" : "border-border hover:border-brand/40"
            )}
          >
            <p className="text-sm font-bold text-ink">{opt.label}</p>
            <p className="text-sm text-muted">{opt.hint}</p>
          </button>
        ))}
      </div>
      {saving && <p className="mt-2 text-sm text-muted">{t("common.loading")}</p>}
      {saved && !saving && <p className="mt-2 text-sm font-semibold text-success">{t("printer.updated")}</p>}
    </div>
  );
}
