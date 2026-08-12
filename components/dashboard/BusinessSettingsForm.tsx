"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LanguageProvider";

interface BusinessSettings {
  gstEnabled: boolean;
  taxInclusive: boolean;
  cgstPercent: number;
  sgstPercent: number;
  gstin: string;
  invoicePrefix: string;
}

export function BusinessSettingsForm({ initial }: { initial: BusinessSettings }) {
  const t = useT();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 border-2 border-border p-3">
        <input
          type="checkbox"
          checked={values.gstEnabled}
          onChange={(e) => setValues((v) => ({ ...v, gstEnabled: e.target.checked }))}
          className="h-5 w-5 accent-brand"
        />
        <span>
          <span className="block text-sm font-bold text-ink">{t("settings.chargeGst")}</span>
          <span className="block text-sm text-muted">{t("settings.chargeGstHint")}</span>
        </span>
      </label>

      {values.gstEnabled && (
        <>
          <div className="flex gap-2">
            {(
              [
                { value: true, label: t("settings.pricesInclude") },
                { value: false, label: t("settings.gstAddedOnTop") },
              ] as const
            ).map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => setValues((v) => ({ ...v, taxInclusive: opt.value }))}
                className={`touch-target flex-1 border-2 px-3 text-sm font-semibold rounded-md ${
                  values.taxInclusive === opt.value
                    ? "border-brand bg-brand-soft text-brand-dark"
                    : "border-border text-ink-soft"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">{t("settings.cgst")}</label>
              <input
                type="number"
                step="0.01"
                value={values.cgstPercent}
                onChange={(e) => setValues((v) => ({ ...v, cgstPercent: parseFloat(e.target.value) || 0 }))}
                className="field"
              />
            </div>
            <div>
              <label className="field-label">{t("settings.sgst")}</label>
              <input
                type="number"
                step="0.01"
                value={values.sgstPercent}
                onChange={(e) => setValues((v) => ({ ...v, sgstPercent: parseFloat(e.target.value) || 0 }))}
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="field-label">{t("settings.gstin")}</label>
            <input
              value={values.gstin}
              onChange={(e) => setValues((v) => ({ ...v, gstin: e.target.value }))}
              placeholder="22AAAAA0000A1Z5"
              className="field"
            />
          </div>
        </>
      )}

      <div>
        <label className="field-label">{t("settings.invoicePrefix")}</label>
        <input
          value={values.invoicePrefix}
          onChange={(e) => setValues((v) => ({ ...v, invoicePrefix: e.target.value }))}
          className="field max-w-[10rem]"
        />
        <p className="mt-1 text-sm text-muted">Example: {values.invoicePrefix}-000123</p>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={saving}>
          {t("common.save")}
        </Button>
        {saved && !saving && <span className="text-sm font-semibold text-success">{t("toast.saved")}</span>}
      </div>
    </div>
  );
}
