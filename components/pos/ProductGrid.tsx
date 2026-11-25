"use client";

import { ProductImage } from "@/components/ui/ProductImage";
import { formatINR, cn } from "@/lib/utils";
import { useCartStore, type CartProduct } from "@/stores/cartStore";
import { TileStepper } from "./TileStepper";

export function ProductGrid({ products }: { products: CartProduct[] }) {
  const addProduct = useCartStore((s) => s.addProduct);
  const lines = useCartStore((s) => s.lines);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-base font-semibold text-ink">No products found</p>
        <p className="mt-1 text-sm text-muted">Try another name or category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 min-[480px]:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-3">
      {products.map((product) => {
        const inCartQty = lines.find((l) => l.product.id === product.id)?.quantity ?? 0;
        // Billo doesn't track stock — every item can always be billed.
        const outOfStock = false;
        const lowStock = false;

        return (
          // Whole tile adds one; the − qty + bar (above the price) adjusts without opening the cart.
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
              "no-select relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-sm transition-all duration-150 touch-target",
              "hover:border-brand/50 hover:shadow-md active:scale-[0.98]",
              outOfStock && "opacity-40 pointer-events-none",
              inCartQty > 0 && "border-brand ring-2 ring-brand"
            )}
          >
            <ProductImage
              src={product.imageUrl}
              width={200}
              height={96}
              sizes="(max-width: 640px) 50vw, 200px"
              className="aspect-[16/10] h-auto w-full border-b border-border object-cover"
            />

            <div className="flex w-full flex-1 flex-col p-2.5 sm:p-3">
              <span className="text-sm font-bold text-ink line-clamp-2 min-h-[2.5em]">
                {product.name}
              </span>
              {inCartQty > 0 && <TileStepper productId={product.id} qty={inCartQty} />}
              <span className="mt-auto pt-1 text-base font-extrabold text-brand tabular">
                {formatINR(product.sellingPrice)}
              </span>
              {!outOfStock && lowStock && (
                <span className="mt-1 text-xs font-semibold text-accent-dark">Only {product.currentStock} left</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
