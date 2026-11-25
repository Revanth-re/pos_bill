"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatINR, cn } from "@/lib/utils";
import { TileStepper } from "./TileStepper";
import { useCartStore, type CartProduct } from "@/stores/cartStore";
import { TOP_PAGE_SIZE } from "@/lib/pos/topItems";

/**
 * Owner-picked top items: big cards, 6 per page so they all fit on a phone screen
 * without scrolling. More than 6 → pages with ‹ 1/2 › buttons and swipe.
 */
export function TopItemsGrid({ products }: { products: CartProduct[] }) {
  const addProduct = useCartStore((s) => s.addProduct);
  const lines = useCartStore((s) => s.lines);
  const [page, setPage] = useState(0);
  const touchX = useRef<number | null>(null);

  const pages = Math.max(1, Math.ceil(products.length / TOP_PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const shown = products.slice(current * TOP_PAGE_SIZE, current * TOP_PAGE_SIZE + TOP_PAGE_SIZE);
  const go = (p: number) => setPage(Math.max(0, Math.min(pages - 1, p)));

  return (
    <div
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
        {shown.map((product) => {
          const inCartQty = lines.find((l) => l.product.id === product.id)?.quantity ?? 0;
          const outOfStock = false; // no stock tracking
          return (
            // Whole tile adds one; the − qty + bar (above the name & price) adjusts without opening the cart.
            <div
              key={product.id}
              role="button"
              tabIndex={0}
              aria-label={`Add ${product.name}`}
              onClick={() => addProduct(product)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  addProduct(product);
                }
              }}
              className={cn(
                // Height is sized so 3 rows (6 cards) fit between the search bar and the cart bar.
                "no-select relative flex h-[clamp(100px,calc((100dvh-27rem)/3),180px)] cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-sm transition-all duration-150",
                "hover:border-brand/50 hover:shadow-md active:scale-[0.98]",
                outOfStock && "pointer-events-none opacity-40",
                inCartQty > 0 && "border-brand ring-2 ring-brand"
              )}
            >
              <div className="relative min-h-0 w-full flex-1 overflow-hidden border-b border-border">
                <ProductImage
                  src={product.imageUrl}
                  width={240}
                  height={120}
                  sizes="(max-width: 640px) 50vw, 240px"
                  className="absolute inset-0 h-full! w-full! object-cover"
                />
              </div>
              {inCartQty > 0 && (
                <div className="shrink-0 px-2 pt-1">
                  <TileStepper productId={product.id} qty={inCartQty} />
                </div>
              )}
              <div className="flex w-full shrink-0 items-end justify-between gap-1 px-2.5 py-2">
                <span className="line-clamp-2 text-sm font-bold leading-tight text-ink">{product.name}</span>
                <span className="shrink-0 text-base font-extrabold text-brand tabular">{formatINR(product.sellingPrice)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {pages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            onClick={() => go(current - 1)}
            disabled={current === 0}
            aria-label="Previous page"
            className="touch-target flex items-center justify-center rounded-xl border border-border bg-surface px-3 text-ink disabled:opacity-35"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-14 text-center text-sm font-bold tabular text-ink-soft">
            {current + 1} / {pages}
          </span>
          <button
            onClick={() => go(current + 1)}
            disabled={current === pages - 1}
            aria-label="Next page"
            className="touch-target flex items-center justify-center rounded-xl border border-border bg-surface px-3 text-ink disabled:opacity-35"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
