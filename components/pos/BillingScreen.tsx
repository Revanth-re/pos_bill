"use client";

import { useMemo, useState } from "react";
import { PauseCircle, ShoppingCart } from "lucide-react";
import { CategoryTabs, type CategoryOption } from "./CategoryTabs";
import { ProductGrid } from "./ProductGrid";
import { ProductSearch } from "./ProductSearch";
import { CartPanel } from "./CartPanel";
import { PaymentSheet } from "./PaymentSheet";
import { HeldBillsSheet } from "./HeldBillsSheet";
import { ReceiptModal } from "./ReceiptModal";
import { ConnectionStatus } from "./ConnectionStatus";
import { useCartStore, estimateCartTotal, type CartProduct } from "@/stores/cartStore";
import { formatINR } from "@/lib/utils";
import type { ReceiptData } from "@/lib/printing/types";

interface Props {
  initialProducts: CartProduct[];
  categories: CategoryOption[];
  businessName: string;
  cashierName: string;
}

export function BillingScreen({ initialProducts, categories, businessName, cashierName }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cartOpenMobile, setCartOpenMobile] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [heldOpen, setHeldOpen] = useState(false);
  const [receipt, setReceipt] = useState<{ data: ReceiptData; offline: boolean } | null>(null);

  const lines = useCartStore((s) => s.lines);
  const orderType = useCartStore((s) => s.orderType);
  const addProduct = useCartStore((s) => s.addProduct);

  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory) {
      // Category filtering happens server-side normally; for the demo grid
      // we filter client-side against whatever's loaded.
      list = list;
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, activeCategory, query]);

  async function handleSearch(q: string) {
    setQuery(q);
    if (!q) return;
    const res = await fetch(`/api/products?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const body = await res.json();
      setProducts((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        for (const p of body.products) {
          map.set(p.id, {
            id: p.id,
            name: p.name,
            sellingPrice: Number(p.sellingPrice),
            gstPercent: Number(p.gstPercent),
            unit: p.unit,
            currentStock: Number(p.currentStock),
            trackInventory: p.trackInventory,
            imageUrl: p.imageUrl,
          });
        }
        return Array.from(map.values());
      });
    }
  }

  function handleBarcodeEnter(code: string) {
    const match = products.find((p) => p.id === code) ?? products.find((p) => p.name.toLowerCase() === code.toLowerCase());
    if (match) addProduct(match);
  }

  function handleCheckoutSuccess({ invoice, offline }: { invoice?: unknown; offline: boolean }) {
    setPaymentOpen(false);
    setCartOpenMobile(false);

    const inv = invoice as
      | { invoiceNumber?: string; grandTotal?: number; subtotal?: number; discountTotal?: number; cgstTotal?: number; sgstTotal?: number; igstTotal?: number }
      | undefined;

    const data: ReceiptData = {
      businessName,
      invoiceNumber: inv?.invoiceNumber ?? "OFFLINE-PENDING",
      createdAt: new Date().toLocaleString("en-IN"),
      cashierName,
      orderType,
      lines: lines.map((l) => ({
        name: l.product.name,
        qty: l.quantity,
        unitPrice: l.product.sellingPrice,
        total: l.product.sellingPrice * l.quantity,
      })),
      subtotal: Number(inv?.subtotal ?? estimateCartTotal(lines)),
      discountTotal: Number(inv?.discountTotal ?? 0),
      cgstTotal: Number(inv?.cgstTotal ?? 0),
      sgstTotal: Number(inv?.sgstTotal ?? 0),
      igstTotal: Number(inv?.igstTotal ?? 0),
      grandTotal: Number(inv?.grandTotal ?? estimateCartTotal(lines)),
      payments: [],
    };
    setReceipt({ data, offline });
  }

  const estimatedTotal = estimateCartTotal(lines);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col lg:h-screen">
      {/* Top bar: search + status + held bills, shared across breakpoints */}
      <div className="flex items-center gap-2 border-b border-border bg-surface p-3">
        <div className="flex-1">
          <ProductSearch onSearch={handleSearch} onBarcodeEnter={handleBarcodeEnter} />
        </div>
        <ConnectionStatus />
        <button
          onClick={() => setHeldOpen(true)}
          className="touch-target flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-ink-soft hover:border-brand/40"
        >
          <PauseCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Held</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main product area: full width on mobile/tablet, flexes with sidebar cart on desktop */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-4">
          <div className="mb-3">
            <CategoryTabs categories={categories} activeId={activeCategory} onSelect={setActiveCategory} />
          </div>
          <ProductGrid products={filtered} />
        </div>

        {/* Desktop/tablet: persistent cart column */}
        <div className="hidden md:block md:w-80 lg:w-96 border-l border-border shrink-0">
          <CartPanel onCheckout={() => setPaymentOpen(true)} onHold={() => holdCurrentBill()} />
        </div>
      </div>

      {/* Mobile: sticky cart bar + full-screen bottom sheet cart */}
      {lines.length > 0 && (
        <button
          onClick={() => setCartOpenMobile(true)}
          className="md:hidden flex items-center justify-between gap-3 border-t border-border bg-ink px-4 py-3 text-white touch-target"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShoppingCart className="h-4 w-4" />
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
          <span className="text-base font-bold tabular">View Cart · {formatINR(estimatedTotal)}</span>
        </button>
      )}

      {cartOpenMobile && (
        <div className="fixed inset-0 z-40 flex flex-col bg-surface md:hidden">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="font-bold text-ink">Your Cart</span>
            <button onClick={() => setCartOpenMobile(false)} className="touch-target rounded-full px-3 text-sm font-semibold text-brand">
              Back to menu
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <CartPanel onCheckout={() => setPaymentOpen(true)} onHold={() => holdCurrentBill()} />
          </div>
        </div>
      )}

      <PaymentSheet open={paymentOpen} onClose={() => setPaymentOpen(false)} onSuccess={handleCheckoutSuccess} />
      <HeldBillsSheet open={heldOpen} onClose={() => setHeldOpen(false)} productsById={productsById} />
      <ReceiptModal
        key={receipt?.data.invoiceNumber ?? "closed"}
        open={!!receipt}
        onClose={() => setReceipt(null)}
        receipt={receipt?.data ?? null}
        offline={receipt?.offline ?? false}
      />
    </div>
  );

  async function holdCurrentBill() {
    const { lines, orderType, billDiscount, customerId, clear } = useCartStore.getState();
    if (lines.length === 0) return;
    await fetch("/api/held-bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderType,
        billDiscount,
        customerId,
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity, discount: l.discount })),
      }),
    });
    clear();
    setCartOpenMobile(false);
  }
}
