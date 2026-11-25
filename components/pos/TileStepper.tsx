"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

/**
 * − qty + right on a product tile (billing screen), so a wrong item or a changed order
 * (2 water → 1) is fixed without opening the cart. At 1, "−" becomes a bin and removes it.
 */
export function TileStepper({ productId, qty }: { productId: string; qty: number }) {
  const incrementLine = useCartStore((s) => s.incrementLine);
  const decrementLine = useCartStore((s) => s.decrementLine);
  return (
    // Sits in the tile's text area (above the price), not over the photo. Taps here never add to the tile.
    <div
      className="my-1 flex w-full items-center justify-between rounded-full bg-brand text-white"
      role="group"
      aria-label="Quantity"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => decrementLine(productId)}
        className="flex h-8 w-10 items-center justify-center rounded-full active:bg-white/20"
        aria-label={qty === 1 ? "Remove item" : "Reduce quantity"}
      >
        {qty === 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-5 w-5" strokeWidth={2.5} />}
      </button>
      <span className="min-w-6 text-center text-base font-extrabold tabular" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        onClick={() => incrementLine(productId)}
        className="flex h-8 w-10 items-center justify-center rounded-full active:bg-white/20"
        aria-label="Add one more"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
