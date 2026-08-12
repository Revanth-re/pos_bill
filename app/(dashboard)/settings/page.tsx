import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { PrinterSettings } from "./PrinterSettings";
import { BusinessSettingsForm } from "@/components/dashboard/BusinessSettingsForm";
import { LanguageSettings } from "@/components/dashboard/LanguageSettings";
import { BluetoothSettings } from "@/components/dashboard/BluetoothSettings";

export default async function SettingsPage() {
  const session = await requireSession();
  const [business, printer] = await Promise.all([
    prisma.business.findUniqueOrThrow({ where: { id: session.businessId } }),
    prisma.printer.findFirst({ where: { businessId: session.businessId, isDefault: true } }),
  ]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Settings</h1>
        <p className="text-base text-muted">{business.name}</p>
      </div>

      <section className="border-2 border-border bg-surface p-4">
        <h2 className="mb-1 text-lg font-bold text-ink">Tax (GST)</h2>
        <p className="mb-4 text-sm text-muted">This controls how GST is calculated on every bill.</p>
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
        <h2 className="mb-1 text-lg font-bold text-ink">Receipt Printer</h2>
        <p className="mb-4 text-sm text-muted">Choose how receipts print at checkout.</p>
        <PrinterSettings
          initialType={printer?.type ?? "BROWSER"}
        />
      </section>

      <section className="border-2 border-border bg-surface p-4">
        <h2 className="mb-1 text-lg font-bold text-ink">Bluetooth Devices</h2>
        <p className="mb-4 text-sm text-muted">
          Pair a Bluetooth thermal printer or barcode scanner directly with this device.
        </p>
        <BluetoothSettings
          initialDeviceId={printer?.bluetoothDeviceId ?? null}
          initialDeviceName={printer?.bluetoothDeviceName ?? null}
        />
      </section>

      <section className="border-2 border-border bg-surface p-4">
        <h2 className="mb-1 text-lg font-bold text-ink">Language</h2>
        <p className="mb-4 text-sm text-muted">The language staff see across the app.</p>
        <LanguageSettings initialLanguage={business.language} />
      </section>
    </div>
  );
}
