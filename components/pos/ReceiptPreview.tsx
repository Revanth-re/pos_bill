"use client";

import { buildReceiptRows, paperWidth } from "@/lib/printing/escpos";
import type { BillFormat } from "@/lib/printing/billFormat";
import type { ReceiptData } from "@/lib/printing/types";
import { cn } from "@/lib/utils";

/** Pixel-faithful preview of the thermal bill — built from the same rows the printer receives. */
export function ReceiptPreview({ data, format, className }: { data: ReceiptData; format: BillFormat; className?: string }) {
  const W = paperWidth(format.paper);
  const rows = buildReceiptRows(data, format);
  const fontSize = format.paper === "58" ? 12.5 : 10.5;

  return (
    <div className={cn("flex justify-center overflow-x-auto py-1 [filter:drop-shadow(0_6px_16px_rgba(6,72,76,0.14))]", className)}>
      <div
        className="receipt-edge relative bg-white px-3 pb-6 pt-4 text-[#111]"
        style={{ fontFamily: "'Courier New', ui-monospace, monospace", fontSize, lineHeight: 1.35 }}
      >
        <div style={{ width: `${W}ch` }}>
          {rows.map((r, i) => {
            if (r.kind === "rule") return <div key={i} className="whitespace-pre">{r.ch.repeat(W)}</div>;
            if (r.kind === "feed") return <div key={i} className="h-3" />;
            if (r.kind === "cut")
              return (
                <div key={i} className="my-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#999]" style={{ fontFamily: "inherit" }}>
                  <span className="h-px flex-1 border-t border-dashed border-[#bbb]" />✂ cut<span className="h-px flex-1 border-t border-dashed border-[#bbb]" />
                </div>
              );
            const size = r.size ?? 1;
            return (
              <div
                key={i}
                className="whitespace-pre"
                style={{
                  textAlign: r.align,
                  fontWeight: r.bold ? 700 : 400,
                  fontSize: `${size}em`,
                  lineHeight: size > 1 ? 1.15 : undefined,
                  // scale width back so double-size text still wraps at paper width
                  width: `${W / size}ch`,
                }}
              >
                {r.text || " "}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const SAMPLE_RECEIPT: ReceiptData = {
  businessName: "Sri Krishna Tiffins",
  businessAddress: "12 MG Road, Bengaluru · 98450 12345",
  gstin: "29ABCDE1234F1Z5",
  invoiceNumber: "INV-000248",
  tokenNumber: 42,
  createdAt: "07/10/2026, 8:15 am",
  cashierName: "Ravi",
  orderType: "TAKEAWAY",
  customerName: "Anand",
  lines: [
    { name: "Idly (2 pcs)", qty: 2, unitPrice: 30, total: 60 },
    { name: "Masala Dosa", qty: 1, unitPrice: 60, total: 60 },
    { name: "Filter Coffee", qty: 2, unitPrice: 20, total: 40 },
  ],
  subtotal: 152.38,
  discountTotal: 0,
  cgstTotal: 3.81,
  sgstTotal: 3.81,
  igstTotal: 0,
  grandTotal: 160,
  payments: [{ method: "UPI", amount: 160 }],
};
