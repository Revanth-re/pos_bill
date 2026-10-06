import type { PrinterType, ReceiptPrinter } from "./types";
import { BrowserPrinter } from "./browserPrinter";
import { BluetoothPrinter } from "./bluetoothPrinter";

/**
 * Central factory. Billing/receipt UI calls `getPrinterAdapter(printer.type)`
 * and never instantiates a concrete class directly. To add a native thermal
 * SDK (WebUSB, Bluetooth ESC/POS, a cloud print API) later: implement
 * `ReceiptPrinter` in a new file and add one case here — nothing in
 * components/billing or the checkout API needs to change.
 */
export function getPrinterAdapter(type: PrinterType): ReceiptPrinter {
  switch (type) {
    case "THERMAL_58MM":
    case "THERMAL_80MM":
      // Thermal receipts go straight to the Bluetooth printer — no print dialog.
      return new BluetoothPrinter(type);
    case "A4":
    case "BROWSER":
    default:
      return new BrowserPrinter(type);
  }
}
