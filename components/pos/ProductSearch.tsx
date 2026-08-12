"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ScanLine } from "lucide-react";

/**
 * USB/Bluetooth barcode scanners behave as HID keyboards: they "type" the
 * barcode digits very fast and then send Enter. We don't need special
 * driver code for that — a focused text input with debounced search plus
 * an Enter handler that fires an exact-match search covers it. Camera
 * scanning (getUserMedia + a barcode-detection lib) is left as an
 * extension point behind the ScanLine button below.
 */
export function ProductSearch({
  onSearch,
  onBarcodeEnter,
}: {
  onSearch: (query: string) => void;
  onBarcodeEnter: (code: string) => void;
}) {
  const [value, setValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(value), 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flex items-center gap-2 border-2 border-border bg-surface px-3 touch-target">
      <Search className="h-4 w-4 text-muted shrink-0" />
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            onBarcodeEnter(value.trim());
            setValue("");
          }
        }}
        placeholder="Search name, SKU, barcode…"
        className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted"
      />
      <button
        type="button"
        title="Camera barcode scan (connect a scanner integration)"
        className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-paper"
      >
        <ScanLine className="h-4 w-4" />
      </button>
    </div>
  );
}
