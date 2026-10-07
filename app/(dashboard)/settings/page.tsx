import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { PrinterSettings } from "./PrinterSettings";
import { BusinessSettingsForm } from "@/components/dashboard/BusinessSettingsForm";
import { LanguageSettings } from "@/components/dashboard/LanguageSettings";
import { BluetoothSettings } from "@/components/dashboard/BluetoothSettings";
import { T } from "@/components/i18n/T";
import { BillFormatSettings } from "@/components/dashboard/BillFormatSettings";
import { normalizeFormat } from "@/lib/printing/billFormat";
import { can } from "@/lib/permissions";

export default async function SettingsPage() {
  const session = await requireSession();
  const [business, printer] = await Promise.all([
    prisma.business.findUniqueOrThrow({ where: { id: session.businessId } }),
    prisma.printer.findFirst({ where: { businessId: session.businessId, isDefault: true } }),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink sm:text-[28px]"><T k="settings.title" /></h1>
        <p className="text-base text-muted">{business.name}</p>
      </div>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-1 text-lg font-bold text-ink"><T k="settings.taxTitle" /></h2>
        <p className="mb-4 text-sm text-muted"><T k="settings.taxSubtitle" /></p>
        <BusinessSettingsForm
          initial={{
            gstEnabled: business.gstEnabled,
            taxInclusive: business.taxInclusive,
            cgstPercent: Number(business.cgstPercent),
            sgstPercent: Number(business.sgstPercent),
            gstin: business.gstin ?? "",
            invoicePrefix: business.invoicePrefix,
          }}
        />
      </section>

      <section id="bill-format" className="card p-4 sm:p-5">
        <h2 className="mb-1 text-lg font-bold text-ink">Bill format</h2>
        <p className="mb-4 text-sm text-muted">Pick a template, choose what shows on the bill and preview it before printing.</p>
        <BillFormatSettings
          initial={normalizeFormat((printer?.config as { billFormat?: unknown } | null)?.billFormat)}
          businessName={business.name}
          businessAddress={[business.address, business.city, business.phone].filter(Boolean).join(", ") || null}
          gstin={business.gstin}
          canEdit={can(session.role, "settings.manage")}
        />
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-1 text-lg font-bold text-ink"><T k="settings.printerTitle" /></h2>
        <p className="mb-4 text-sm text-muted"><T k="settings.printerSubtitle" /></p>
        <PrinterSettings
          initialType={printer?.type ?? "BROWSER"}
        />
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-1 text-lg font-bold text-ink"><T k="settings.bluetoothTitle" /></h2>
        <p className="mb-4 text-sm text-muted">
          <T k="settings.bluetoothSubtitle" />
        </p>
        <BluetoothSettings
          initialDeviceId={printer?.bluetoothDeviceId ?? null}
          initialDeviceName={printer?.bluetoothDeviceName ?? null}
        />
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-1 text-lg font-bold text-ink"><T k="settings.languageTitle" /></h2>
        <p className="mb-4 text-sm text-muted"><T k="settings.languageSubtitle" /></p>
        <LanguageSettings initialLanguage={business.language} />
      </section>
    </div>
  );
}
