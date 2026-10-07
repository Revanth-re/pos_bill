import type { PrinterType, ReceiptData, ReceiptPrinter } from "./types";
import { BrowserPrinter } from "./browserPrinter";
import { encodeReceipt } from "./escpos";
import { writeToPrinter } from "./bluetoothPairing";
import { getCachedBillFormat } from "./billFormat";

/** Prints ESC/POS straight to the connected Bluetooth thermal printer, in the business's chosen bill format. */
export class BluetoothPrinter implements ReceiptPrinter {
  constructor(public type: PrinterType) {}

  async print(data: ReceiptData): Promise<void> {
    const format = { ...getCachedBillFormat(), paper: this.type === "THERMAL_80MM" ? ("80" as const) : ("58" as const) };
    await writeToPrinter(encodeReceipt(data, format));
  }

  preview(data: ReceiptData): string {
    return new BrowserPrinter(this.type).preview(data);
  }
}
