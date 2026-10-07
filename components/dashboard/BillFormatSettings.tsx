"use client";

import { useState } from "react";
import { Check, Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ReceiptPreview, SAMPLE_RECEIPT } from "@/components/pos/ReceiptPreview";
import {
  applyTemplate,
  cacheBillFormat,
  DEFAULT_FORMAT,
  TEMPLATES,
  type BillFormat,
} from "@/lib/printing/billFormat";
import { getPrinterAdapter } from "@/lib/printing/getPrinterAdapter";
import { choosePrinter, reconnectSavedPrinter } from "@/lib/printing/bluetoothPairing";
import { toast } from "@/stores/toastStore";
import { cn } from "@/lib/utils";

type BoolKey = {
  [K in keyof BillFormat]: BillFormat[K] extends boolean ? K : never;
}[keyof BillFormat];

const OPTIONS: { key: BoolKey; label: string }[] = [
  { key: "showAddress", label: "Address & phone" },
  { key: "showGstin", label: "GSTIN" },
  { key: "showCashier", label: "Cashier name" },
  { key: "showCustomer", label: "Customer name" },
  { key: "showOrderType", label: "Dine-in / Takeaway" },
  { key: "showItemRate", label: "Item rate (qty × price)" },
  { key: "showTaxBreakup", label: "CGST / SGST break-up" },
  { key: "showPayment", label: "Payment method" },
  { key: "kitchenCopy", label: "Print kitchen slip too" },
];

export function BillFormatSettings({
  initial,
  businessName,
  businessAddress,
  gstin,
  canEdit,
}: {
  initial: BillFormat;
  businessName: string;
  businessAddress: string | null;
  gstin: string | null;
  canEdit: boolean;
}) {
  const [format, setFormat] = useState<BillFormat>(initial);
  const [savedFormat, setSavedFormat] = useState<BillFormat>(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(format) !== JSON.stringify(savedFormat);

  const sample = {
    ...SAMPLE_RECEIPT,
    businessName: businessName || SAMPLE_RECEIPT.businessName,
    businessAddress: businessAddress || SAMPLE_RECEIPT.businessAddress,
    gstin: gstin || SAMPLE_RECEIPT.gstin,
  };

  const set = <K extends keyof BillFormat>(k: K, v: BillFormat[K]) => setFormat((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    const res = await fetch("/api/printers/format", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      toast.error(body.error ?? "Couldn't save the bill format.");
      return;
    }
    cacheBillFormat(body.format);
    setSavedFormat(body.format);
    toast.success("Bill format saved for all devices");
  }

  async function testPrint() {
    try {
      cacheBillFormat(format); // print exactly what's on screen
      if (!(await reconnectSavedPrinter())) await choosePrinter();
      await getPrinterAdapter(format.paper === "80" ? "THERMAL_80MM" : "THERMAL_58MM").print({ ...sample, copyLabel: "TEST PRINT" });
      toast.success("Test bill printed");
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (err.name !== "NotFoundError") toast.error(err.message || "Couldn't print.");
    } finally {
      cacheBillFormat(savedFormat);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <div className="min-w-0 space-y-5">
        {/* Templates */}
        <div>
          <p className="field-label">Template</p>
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            {TEMPLATES.map((t) => {
              const active = format.template === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setFormat((f) => applyTemplate(f, t.id))}
                  className={cn(
                    "relative min-h-16 rounded-xl border p-3 text-left transition-all duration-150",
                    active ? "border-brand bg-brand-soft/70 ring-1 ring-brand" : "border-border bg-surface hover:border-brand/40",
                    !canEdit && "cursor-not-allowed opacity-70"
                  )}
                >
                  {active && (
                    <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  )}
                  <p className="pr-6 text-sm font-bold text-ink">{t.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{t.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Paper + token */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Segment
            label="Paper width"
            value={format.paper}
            disabled={!canEdit}
            options={[
              { value: "58", label: "58 mm" },
              { value: "80", label: "80 mm" },
            ]}
            onChange={(v) => set("paper", v as BillFormat["paper"])}
          />
          <Segment
            label="Token number"
            value={format.tokenSize}
            disabled={!canEdit}
            options={[
              { value: "off", label: "Off" },
              { value: "normal", label: "Normal" },
              { value: "large", label: "Large" },
            ]}
            onChange={(v) => set("tokenSize", v as BillFormat["tokenSize"])}
          />
        </div>

        {/* Show / hide */}
        <div>
          <p className="field-label">Show on bill</p>
          <div className="overflow-hidden rounded-xl border border-border">
            {OPTIONS.map((o) => (
              <label
                key={o.key}
                className={cn("flex min-h-12 cursor-pointer items-center justify-between gap-3 border-b border-border px-3 last:border-b-0", !canEdit && "cursor-not-allowed opacity-70")}
              >
                <span className="text-sm font-medium text-ink">{o.label}</span>
                <Switch checked={format[o.key]} disabled={!canEdit} onChange={(v) => set(o.key, v)} />
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Header line</label>
            <input className="field" maxLength={120} disabled={!canEdit} value={format.headerNote} onChange={(e) => set("headerNote", e.target.value)} placeholder="e.g. Pure Veg · Since 1998" />
          </div>
          <div>
            <label className="field-label">Footer line</label>
            <input className="field" maxLength={120} disabled={!canEdit} value={format.footerNote} onChange={(e) => set("footerNote", e.target.value)} placeholder="e.g. Thank you, visit again!" />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {canEdit && (
            <Button className="sm:flex-1" loading={saving} disabled={!dirty} onClick={save}>
              <Check className="h-4 w-4" /> {dirty ? "Save format" : "Saved"}
            </Button>
          )}
          <Button variant="secondary" className="sm:flex-1" onClick={testPrint}>
            <Printer className="h-4 w-4" /> Test print
          </Button>
          {canEdit && (
            <Button variant="ghost" onClick={() => setFormat({ ...DEFAULT_FORMAT })}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          )}
        </div>
        {!canEdit && <p className="text-xs text-muted">Only the owner can change the bill format.</p>}
      </div>

      {/* Live preview */}
      <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
        <p className="field-label flex items-center justify-between">
          Live preview <span className="text-xs font-medium text-muted">{format.paper} mm</span>
        </p>
        <div className="rounded-2xl bg-paper p-4 ring-1 ring-border">
          <ReceiptPreview data={sample} format={format} />
        </div>
      </div>
    </div>
  );
}

function Switch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-brand" : "bg-border-strong"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function Segment({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <div className="flex rounded-xl border border-border bg-paper p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-10 flex-1 rounded-lg text-sm font-semibold transition-all duration-150",
              value === o.value ? "bg-surface text-brand-dark shadow-sm" : "text-muted hover:text-ink"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
