import type { PrinterType, ReceiptData, ReceiptPrinter } from "./types";
import { BrowserPrinter } from "./browserPrinter";
import { encodeReceipt } from "./escpos";
import { writeToPrinter } from "./bluetoothPairing";

/** Prints ESC/POS straight to the connected Bluetooth thermal printer. */
export class BluetoothPrinter implements ReceiptPrinter {
  constructor(public type: PrinterType) {}

  async print(data: ReceiptData): Promise<void> {
    await writeToPrinter(encodeReceipt(data, this.type === "THERMAL_80MM" ? "80" : "58"));
  }

  preview(data: ReceiptData): string {
    return new BrowserPrinter(this.type).preview(data);
  }
}
