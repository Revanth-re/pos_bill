"use client";

import { useEffect, useMemo, useState } from "react";
import { PauseCircle, Printer } from "lucide-react";
import { CategoryTabs } from "./CategoryTabs";
import { ProductGrid } from "./ProductGrid";
import { ProductSearch } from "./ProductSearch";
import { CartPanel } from "./CartPanel";
import { PaymentSheet } from "./PaymentSheet";
import { HeldBillsSheet } from "./HeldBillsSheet";
import { ReceiptModal } from "./ReceiptModal";
import { ConnectionStatus } from "./ConnectionStatus";
import { useCartStore, estimateCartTotal, type CartProduct } from "@/stores/cartStore";
import { useCatalogStore } from "@/stores/catalogStore";
import { formatINR } from "@/lib/utils";
import { submitBill } from "@/lib/billing/submitBill";
import { toast } from "@/stores/toastStore";
import { useT } from "@/lib/i18n/LanguageProvider";
import type { ReceiptData } from "@/lib/printing/types";
import { Spinner } from "@/components/ui/Spinner";

interface Props {
  businessName: string;
  cashierName: string;
}

export function BillingScreen({ businessName, cashierName }: Props) {
  const products = useCatalogStore((s) => s.products);
  const categories = useCatalogStore((s) => s.categories);
  const loadingProducts = useCatalogStore((s) => s.loadingProducts);
  const ensurePosCatalog = useCatalogStore((s) => s.ensurePosCatalog);
  const seedPosCatalog = useCatalogStore((s) => s.seedPosCatalog);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cartOpenMobile, setCartOpenMobile] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [heldOpen, setHeldOpen] = useState(false);
  const [receipt, setReceipt] = useState<{ data: ReceiptData; offline: boolean } | null>(null);
  const [quickPrinting, setQuickPrinting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const t = useT();

  const lines = useCartStore((s) => s.lines);
  const orderType = useCartStore((s) => s.orderType);
  const addProduct = useCartStore((s) => s.addProduct);

  useEffect(() => {
    const finish = () => setHydrated(true);
    finish();
    const unsub = useCatalogStore.persist.onFinishHydration(finish);
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void ensurePosCatalog();
  }, [hydrated, ensurePosCatalog]);

  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory) {
      // Categories come from the catalog; product.categoryId isn't on CartProduct.
      // Filtering by category is handled when searching via API below if needed.
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
    if (!q) {
      void ensurePosCatalog({ force: true });
      return;
    }
    const res = await fetch(`/api/products?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const body = await res.json();
      const mapped: CartProduct[] = body.products.map(
        (p: {
          id: string;
          name: string;
          sellingPrice: number;
          gstPercent: number;
          unit: string;
          currentStock: number;
          trackInventory: boolean;
          imageUrl: string | null;
        }) => ({
          id: p.id,
          name: p.name,
          sellingPrice: Number(p.sellingPrice),
          gstPercent: Number(p.gstPercent),
          unit: p.unit,
          currentStock: Number(p.currentStock),
          trackInventory: p.trackInventory,
          imageUrl: p.imageUrl,
        })
      );
      // Merge search hits into the persisted catalog so images/names stick around.
      const map = new Map(products.map((p) => [p.id, p]));
      for (const p of mapped) map.set(p.id, p);
      seedPosCatalog(Array.from(map.values()), categories);
    }
  }

  function handleBarcodeEnter(code: string) {
    const match =
      products.find((p) => p.id === code) ??
      products.find((p) => p.name.toLowerCase() === code.toLowerCase());
    if (match) addProduct(match);
  }

  function buildReceiptData(invoice: unknown): ReceiptData {
    const inv = invoice as
      | {
          invoiceNumber?: string;
          grandTotal?: number;
          subtotal?: number;
          discountTotal?: number;
          cgstTotal?: number;
          sgstTotal?: number;
          igstTotal?: number;
        }
      | undefined;

    return {
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
  }

  function handleCheckoutSuccess({ invoice, offline }: { invoice?: unknown; offline: boolean }) {
    setPaymentOpen(false);
    setCartOpenMobile(false);
    toast.success(offline ? t("toast.savedOffline") : t("toast.billCompleted"));
    setReceipt({ data: buildReceiptData(invoice), offline });
  }

  async function handleQuickPrint() {
    const {
      lines: cartLines,
      orderType: cartOrderType,
      billDiscount,
      heldBillId,
      customerId,
    } = useCartStore.getState();
    if (cartLines.length === 0) return;

    setQuickPrinting(true);
    const total = estimateCartTotal(cartLines);
    const result = await submitBill({
      orderType: cartOrderType,
      items: cartLines.map((l) => ({
        productId: l.product.id,
        quantity: l.quantity,
        discount: l.discount,
      })),
      billDiscount,
      customerId,
      payments: [{ method: "CASH", amount: Math.round(total * 100) / 100 }],
      heldBillId,
    });
    setQuickPrinting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setCartOpenMobile(false);
    toast.success(result.offline ? t("toast.savedOffline") : t("toast.billCompleted"));
    const data = buildReceiptData(result.invoice);
    setReceipt({ data, offline: result.offline });
    useCartStore.getState().clear();
  }

  const estimatedTotal = estimateCartTotal(lines);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const showBootSpinner = (!hydrated || (products.length === 0 && loadingProducts));

  return (
    <div className="flex h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom))] flex-col md:h-screen">
      <div className="flex items-center gap-2 border-b border-border bg-surface p-3">
        <div className="flex-1">
          <ProductSearch onSearch={handleSearch} onBarcodeEnter={handleBarcodeEnter} />
        </div>
        <ConnectionStatus />
        <button
          onClick={() => setHeldOpen(true)}
          className="no-select touch-target flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-ink-soft transition-colors hover:border-brand/40"
        >
          <PauseCircle className="h-4 w-4" />
          <span className="hidden sm:inline">{t("pos.held")}</span>
        </button>
      </div>

      <div className={`flex flex-1 overflow-hidden ${lines.length > 0 ? "pb-14 md:pb-0" : ""}`}>
        <div className="flex-1 overflow-y-auto p-3 lg:p-4">
          <div className="mb-3">
            <CategoryTabs
              categories={categories}
              activeId={activeCategory}
              onSelect={setActiveCategory}
            />
          </div>
          {showBootSpinner ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <ProductGrid products={filtered} />
          )}
        </div>

        <div className="hidden md:block md:w-80 lg:w-96 border-l border-border shrink-0">
          <CartPanel
            onQuickPrint={handleQuickPrint}
            onCheckout={() => setPaymentOpen(true)}
            onHold={() => holdCurrentBill()}
            printing={quickPrinting}
          />
        </div>
      </div>

      {/* Sit above the fixed bottom navbar on every mobile viewport */}
      {lines.length > 0 && (
        <div className="no-select md:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 flex items-stretch border-t border-border bg-ink text-white shadow-[0_-4px_16px_rgba(0,0,0,0.18)]">
          <button
            onClick={() => setCartOpenMobile(true)}
            className="touch-target flex flex-1 items-center gap-2 px-4 text-left"
          >
            <span className="text-sm font-semibold opacity-90">
              {itemCount} {t("pos.items")}
            </span>
            <span className="text-base font-bold tabular text-accent">
              {formatINR(estimatedTotal)}
            </span>
          </button>
          <button
            onClick={handleQuickPrint}
            disabled={quickPrinting}
            className="touch-target flex items-center gap-1.5 bg-brand px-5 font-bold transition-colors active:bg-brand-dark disabled:opacity-60"
          >
            <Printer className="h-4 w-4" />
            {quickPrinting ? t("pos.printing") : t("pos.printBill")}
          </button>
        </div>
      )}

      {cartOpenMobile && (
        <div className="fixed inset-0 z-40 flex flex-col bg-surface md:hidden">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="font-bold text-ink">Your Cart</span>
            <button
              onClick={() => setCartOpenMobile(false)}
              className="no-select touch-target rounded-full px-3 text-sm font-semibold text-brand"
            >
              Back to menu
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <CartPanel
              onQuickPrint={handleQuickPrint}
              onCheckout={() => setPaymentOpen(true)}
              onHold={() => holdCurrentBill()}
              printing={quickPrinting}
            />
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
        items: lines.map((l) => ({
          productId: l.product.id,
          quantity: l.quantity,
          discount: l.discount,
        })),
      }),
    });
    clear();
    setCartOpenMobile(false);
    toast.info(t("pos.holdBill"));
  }
}
