import Link from "next/link";
import { PackagePlus, ArrowRight } from "lucide-react";

/** New shop with no products yet: one big, obvious next step. Opens the Add Product form directly. */
export function AddProductsNudge({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/products?new=1"
      className={`group flex items-center gap-4 rounded-2xl border-2 border-dashed border-brand/50 bg-brand-soft/60 text-left transition-colors hover:border-brand hover:bg-brand-soft ${compact ? "p-4" : "p-5 sm:p-6"}`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-white">
        <PackagePlus className="h-6 w-6" />
      </span>
      <span className="flex-1">
        <span className="block text-lg font-extrabold text-ink">Add your products first</span>
        <span className="mt-0.5 block text-sm text-ink-soft">
          Add the items you sell (Idli, Tea, Biryani…) with their price — then you can start billing. Takes 2 minutes.
        </span>
      </span>
      <span className="hidden items-center gap-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white sm:flex">
        Add product <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 text-brand sm:hidden" />
    </Link>
  );
}
