"use client";

import { ProductImage } from "@/components/ui/ProductImage";
import { formatINR, cn } from "@/lib/utils";
import { useCartStore, type CartProduct } from "@/stores/cartStore";

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
        const outOfStock = product.trackInventory && product.currentStock <= 0;
        const lowStock = product.trackInventory && product.currentStock > 0 && product.currentStock <= 5;

        return (
          <button
            key={product.id}
            disabled={outOfStock}
            onClick={() => addProduct(product)}
            className={cn(
              "no-select relative flex flex-col items-start overflow-hidden rounded-2xl border border-border bg-surface text-left transition-all duration-150 touch-target shadow-sm",
              "hover:border-brand/50 hover:shadow-md active:scale-[0.97]",
              outOfStock && "opacity-40 pointer-events-none",
              inCartQty > 0 && "border-brand ring-2 ring-brand"
            )}
          >
            {inCartQty > 0 && (
              <span className="absolute top-1.5 right-1.5 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white tabular">
                {inCartQty}
              </span>
            )}

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
              <span className="mt-auto pt-1 text-base font-extrabold text-brand tabular">
                {formatINR(product.sellingPrice)}
              </span>
              {outOfStock && (
                <span className="mt-1 text-xs font-semibold text-danger">Out of stock</span>
              )}
              {!outOfStock && lowStock && (
                <span className="mt-1 text-xs font-semibold text-accent-dark">Only {product.currentStock} left</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
