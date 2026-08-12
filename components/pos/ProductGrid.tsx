"use client";

import Image from "next/image";
import { Package } from "lucide-react";
import { formatINR, cn } from "@/lib/utils";
import { useCartStore, type CartProduct } from "@/stores/cartStore";

export function ProductGrid({ products }: { products: CartProduct[] }) {
  const addProduct = useCartStore((s) => s.addProduct);
  const lines = useCartStore((s) => s.lines);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted">
        <p className="text-base">No products match your search.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
              "hover:border-brand/50 hover:shadow-sm active:scale-[0.97]",
              outOfStock && "opacity-40 pointer-events-none",
              inCartQty > 0 && "border-brand ring-2 ring-brand"
            )}
          >
            {inCartQty > 0 && (
              <span className="absolute top-1.5 right-1.5 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white tabular">
                {inCartQty}
              </span>
            )}

            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt=""
                width={200}
                height={112}
               
                className="h-24 w-full border-b-2 border-border object-cover"
              />
            ) : (
              <div className="flex h-24 w-full items-center justify-center border-b-2 border-border bg-paper text-muted">
                <Package className="h-8 w-8" />
              </div>
            )}

            <div className="flex w-full flex-col p-3">
              <span className="text-sm font-bold text-ink line-clamp-2 min-h-[2.5em]">
                {product.name}
              </span>
              <span className="mt-1 text-base font-bold text-brand tabular">
                {formatINR(product.sellingPrice)}
              </span>
              {outOfStock && (
                <span className="mt-1 text-sm font-semibold text-danger">Out of stock</span>
              )}
              {!outOfStock && lowStock && (
                <span className="mt-1 text-sm font-semibold text-gold">Only {product.currentStock} left</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
