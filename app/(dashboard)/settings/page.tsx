import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { PrinterSettings } from "./PrinterSettings";
import { BusinessSettingsForm } from "@/components/dashboard/BusinessSettingsForm";
import { LanguageSettings } from "@/components/dashboard/LanguageSettings";
import { BluetoothSettings } from "@/components/dashboard/BluetoothSettings";
import { T } from "@/components/i18n/T";

export default async function SettingsPage() {
  const session = await requireSession();
  const [business, printer] = await Promise.all([
    prisma.business.findUniqueOrThrow({ where: { id: session.businessId } }),
    prisma.printer.findFirst({ where: { businessId: session.businessId, isDefault: true } }),
  ]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold text-ink"><T k="settings.title" /></h1>
        <p className="text-base text-muted">{business.name}</p>
      </div>

      <section className="border-2 border-border bg-surface p-4">
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

      <section className="border-2 border-border bg-surface p-4">
        <h2 className="mb-1 text-lg font-bold text-ink"><T k="settings.printerTitle" /></h2>
        <p className="mb-4 text-sm text-muted"><T k="settings.printerSubtitle" /></p>
        <PrinterSettings
          initialType={printer?.type ?? "BROWSER"}
        />
      </section>

      <section className="border-2 border-border bg-surface p-4">
        <h2 className="mb-1 text-lg font-bold text-ink"><T k="settings.bluetoothTitle" /></h2>
        <p className="mb-4 text-sm text-muted">
          <T k="settings.bluetoothSubtitle" />
        </p>
        <BluetoothSettings
          initialDeviceId={printer?.bluetoothDeviceId ?? null}
          initialDeviceName={printer?.bluetoothDeviceName ?? null}
        />
      </section>

      <section className="border-2 border-border bg-surface p-4">
        <h2 className="mb-1 text-lg font-bold text-ink"><T k="settings.languageTitle" /></h2>
        <p className="mb-4 text-sm text-muted"><T k="settings.languageSubtitle" /></p>
        <LanguageSettings initialLanguage={business.language} />
      </section>
    </div>
  );
}
