"use client";

import { useEffect, useMemo, useState } from "react";
import { PauseCircle, Printer, Save } from "lucide-react";
import { CategoryTabs, TOP_TAB } from "./CategoryTabs";
import { TopItemsGrid } from "./TopItemsGrid";
import { getCachedTopItems, loadTopItems, type TopItems } from "@/lib/pos/topItems";
import { ProductGrid } from "./ProductGrid";
import { ProductSearch } from "./ProductSearch";
import { CartPanel } from "./CartPanel";
import { PaymentSheet } from "./PaymentSheet";
import { HeldBillsSheet } from "./HeldBillsSheet";
import { ReceiptModal } from "./ReceiptModal";
import { ConnectionStatus } from "./ConnectionStatus";
import { CustomerPickerSheet } from "./CustomerPickerSheet";
import { useCartStore, estimateCartTotal, type CartProduct } from "@/stores/cartStore";
import { useCatalogStore } from "@/stores/catalogStore";
import { formatINR } from "@/lib/utils";
import { submitBill } from "@/lib/billing/submitBill";
import { cartTotals, loadTaxSettings } from "@/lib/billing/clientTotals";
import type { BillTotals } from "@/lib/billing/calculateTotals";
import { nextOfflineToken, recordServerToken } from "@/lib/offline/localToken";
import type { CheckoutSuccess } from "./PaymentSheet";
import { toast } from "@/stores/toastStore";
import { useT } from "@/lib/i18n/LanguageProvider";
import type { ReceiptData } from "@/lib/printing/types";
import { reconnectSavedPrinter } from "@/lib/printing/bluetoothPairing";
import { loadBillFormat } from "@/lib/printing/billFormat";
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
  // Owner-picked top items (cached for instant display, refreshed in the background).
  const [topItems, setTopItems] = useState<TopItems | null>(null);
  useEffect(() => {
    const cached = getCachedTopItems();
    setTopItems(cached);
    if (cached.productIds.length) setActiveCategory(TOP_TAB);
    void loadTopItems().then((fresh) => {
      setTopItems(fresh);
      setActiveCategory((cur) => (fresh.productIds.length ? (cur === null ? TOP_TAB : cur) : cur === TOP_TAB ? null : cur));
    });
  }, []);
  const [query, setQuery] = useState("");
  const [cartOpenMobile, setCartOpenMobile] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [heldOpen, setHeldOpen] = useState(false);
  const [udhaariOpen, setUdhaariOpen] = useState(false);
  const [receipt, setReceipt] = useState<{ data: ReceiptData; offline: boolean } | null>(null);
  const [quickPrinting, setQuickPrinting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const t = useT();

  const lines = useCartStore((s) => s.lines);
  const orderType = useCartStore((s) => s.orderType);
  const addProduct = useCartStore((s) => s.addProduct);

  useEffect(() => {
    if (useCatalogStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useCatalogStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  // Keep the Bluetooth printer connected while billing, so "Print" doesn't wait for a reconnect.
  useEffect(() => {
    void reconnectSavedPrinter();
    const id = window.setInterval(() => void reconnectSavedPrinter(), 20_000);
    const onVis = () => document.visibilityState === "visible" && void reconnectSavedPrinter();
    document.addEventListener("visibilitychange", onVis);
    void loadBillFormat(); // cache the latest bill format before the first print
    void loadTaxSettings(); // cache GST settings so totals are exact even offline
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void ensurePosCatalog();
  }, [hydrated, ensurePosCatalog]);

  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const topProducts = useMemo(() => {
    if (!topItems) return [];
    const byId = new Map(products.map((p) => [p.id, p]));
    return topItems.productIds
      .map((id) => byId.get(id))
      .filter((p): p is CartProduct => !!p)
      .slice(0, topItems.count);
  }, [products, topItems]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory && activeCategory !== TOP_TAB) {
      list = list.filter((p) => p.categoryId === activeCategory);
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
    // Offline: the list is already filtered on the phone from the saved products.
    const res = await fetch(`/api/products?q=${encodeURIComponent(q)}`).catch(() => null);
    if (res?.ok) {
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
          categoryId?: string | null;
          alias?: string | null;
        }) => ({
          id: p.id,
          name: p.name,
          sellingPrice: Number(p.sellingPrice),
          gstPercent: Number(p.gstPercent),
          unit: p.unit,
          currentStock: Number(p.currentStock),
          trackInventory: p.trackInventory,
          categoryId: p.categoryId ?? null,
          alias: p.alias ?? null,
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

  /**
   * Printed bill data. Online: the server's invoice. Offline: totals worked out on the phone
   * (same maths as the server), a temporary bill number and the next token on this phone.
   */
  function buildReceiptData(
    invoice: unknown,
    offline?: { clientId?: string; totals?: BillTotals; payments?: { method: string; amount: number }[] }
  ): ReceiptData {
    const inv = invoice as
      | {
          invoiceNumber?: string;
          grandTotal?: number;
          subtotal?: number;
          discountTotal?: number;
          cgstTotal?: number;
          sgstTotal?: number;
          igstTotal?: number;
          tokenNumber?: number;
          payments?: { method: string; amount: number }[];
        }
      | undefined;
    const local = offline?.totals ?? cartTotals(lines, useCartStore.getState().billDiscount);
    if (inv?.tokenNumber) recordServerToken(inv.tokenNumber);

    return {
      businessName,
      invoiceNumber: inv?.invoiceNumber ?? `OFF-${(offline?.clientId ?? "").slice(0, 6).toUpperCase() || "PENDING"}`,
      tokenNumber: inv ? inv.tokenNumber : nextOfflineToken(),
      copyLabel: inv ? undefined : "OFFLINE",
      createdAt: new Date().toLocaleString("en-IN"),
      cashierName,
      orderType,
      lines: lines.map((l) => ({
        name: l.product.name,
        localName: l.product.alias,
        qty: l.quantity,
        unitPrice: l.product.sellingPrice,
        total: l.product.sellingPrice * l.quantity,
      })),
      subtotal: Number(inv?.subtotal ?? local.subtotal),
      discountTotal: Number(inv?.discountTotal ?? local.discountTotal),
      cgstTotal: Number(inv?.cgstTotal ?? local.cgstTotal),
      sgstTotal: Number(inv?.sgstTotal ?? local.sgstTotal),
      igstTotal: Number(inv?.igstTotal ?? local.igstTotal),
      grandTotal: Number(inv?.grandTotal ?? local.grandTotal),
      payments: (inv?.payments ?? offline?.payments ?? []).map((p) => ({ method: p.method, amount: Number(p.amount) })),
    };
  }

  function handleCheckoutSuccess({ invoice, offline, creditOnly, clientId, totals, payments }: CheckoutSuccess) {
    setPaymentOpen(false);
    setCartOpenMobile(false);
    // Don't toast "completed" yet — that only happens after a successful print
    // in ReceiptModal. Offline still needs a heads-up that the sale was queued.
    if (offline) toast.info(t("toast.savedOffline"));
    // Udhaari (credit) bills don't print — the amount just goes on the customer's khata.
    const serverPayments = ((invoice as { payments?: { method: string; amount: number }[] } | undefined)?.payments ?? []).filter(
      (p) => Number(p.amount) > 0
    );
    const isUdhaari = creditOnly || (serverPayments.length > 0 && serverPayments.every((p) => p.method === "CREDIT"));
    if (isUdhaari) {
      const total = Number((invoice as { grandTotal?: number } | undefined)?.grandTotal ?? totals?.grandTotal ?? estimateCartTotal(lines));
      toast.success(`${formatINR(total)} added to udhaari`);
      void useCatalogStore.getState().ensureCustomers({ force: true });
      useCartStore.getState().clear();
      return;
    }
    setReceipt({ data: buildReceiptData(invoice, offline ? { clientId, totals, payments } : undefined), offline });
  }

  // Udhaari: pick the customer, bill goes straight onto their khata — no payment screen, no print.
  async function handleUdhaari(customerId: string, customerName: string) {
    setUdhaariOpen(false);
    const { lines: cartLines, orderType: cartOrderType, billDiscount, heldBillId } = useCartStore.getState();
    if (cartLines.length === 0) return;
    setQuickPrinting(true);
    const total = cartTotals(cartLines, billDiscount).grandTotal;
    const result = await submitBill({
      orderType: cartOrderType,
      items: cartLines.map((l) => ({ productId: l.product.id, quantity: l.quantity, discount: l.discount })),
      billDiscount,
      customerId,
      payments: [{ method: "CREDIT", amount: total }],
      heldBillId,
    });
    setQuickPrinting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setCartOpenMobile(false);
    const billed = Number((result.invoice as { grandTotal?: number } | undefined)?.grandTotal ?? total);
    toast.success(`${formatINR(billed)} added to ${customerName}'s udhaari`);
    void useCatalogStore.getState().ensureCustomers({ force: true }); // refresh balances
    if (result.offline) toast.info(t("toast.savedOffline"));
    useCartStore.getState().clear();
  }

  async function handleQuickPrint(print = true) {
    const {
      lines: cartLines,
      orderType: cartOrderType,
      billDiscount,
      heldBillId,
      customerId,
    } = useCartStore.getState();
    if (cartLines.length === 0) return;

    setQuickPrinting(true);
    // Exact total incl. GST + bill discount — the server checks payments match it.
    const totals = cartTotals(cartLines, billDiscount);
    const payments = [{ method: "CASH" as const, amount: totals.grandTotal }];
    const result = await submitBill({
      orderType: cartOrderType,
      items: cartLines.map((l) => ({
        productId: l.product.id,
        quantity: l.quantity,
        discount: l.discount,
      })),
      billDiscount,
      customerId,
      payments,
      heldBillId,
    });
    setQuickPrinting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setCartOpenMobile(false);
    if (result.offline) toast.info(t("toast.savedOffline"));
    const data = buildReceiptData(result.invoice, result.offline ? { clientId: result.clientId, totals, payments } : undefined);
    useCartStore.getState().clear();
    if (!print) {
      // Saved without printing — reprint any time from Bills.
      toast.success(`Bill saved${data.tokenNumber ? ` · Token ${data.tokenNumber}` : ""} · ${formatINR(data.grandTotal)}`);
      return;
    }
    setReceipt({ data, offline: result.offline });
  }

  const estimatedTotal = estimateCartTotal(lines);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const showBootSpinner = products.length === 0 && (loadingProducts || !hydrated);

  return (
    <div className="flex h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom))] flex-col md:h-screen">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2.5">
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

      <div className={`flex flex-1 overflow-hidden ${lines.length > 0 ? "pb-20 md:pb-0" : ""}`}>
        <div className="flex-1 overflow-y-auto px-3 pb-3 lg:px-4 lg:pb-4">
          <div className="sticky top-0 z-10 -mx-3 mb-3 bg-paper/95 px-3 pt-3 pb-1 backdrop-blur lg:-mx-4 lg:px-4">
            <CategoryTabs
              categories={categories}
              activeId={activeCategory}
              onSelect={setActiveCategory}
              showTop={topProducts.length > 0}
            />
          </div>
          {showBootSpinner ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : activeCategory === TOP_TAB && !query && topProducts.length > 0 ? (
            <TopItemsGrid products={topProducts} />
          ) : (
            <ProductGrid products={filtered} />
          )}
        </div>

        <div className="hidden md:block md:w-80 lg:w-96 border-l border-border shrink-0">
          <CartPanel
            onQuickPrint={() => handleQuickPrint(true)}
            onSaveOnly={() => handleQuickPrint(false)}
            onCheckout={() => setPaymentOpen(true)}
            onHold={() => holdCurrentBill()}
            onUdhaari={() => setUdhaariOpen(true)}
            printing={quickPrinting}
          />
        </div>
      </div>

      {/* Floating cart bar — sits above the bottom nav, right under the thumb */}
      {lines.length > 0 && (
        <div className="no-select toast-enter md:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-3 right-3 z-40 flex items-stretch overflow-hidden rounded-2xl bg-brand-dark text-white shadow-lg">
          {/* Save (no print) on the left, cart in the middle, Print Bill on the right */}
          <button
            onClick={() => handleQuickPrint(false)}
            disabled={quickPrinting}
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 border-r border-white/10 px-3.5 text-xs font-semibold text-white/90 active:bg-white/5 disabled:opacity-60"
          >
            <Save className="h-5 w-5" />
            Save
          </button>
          <button
            onClick={() => setCartOpenMobile(true)}
            className="touch-target flex min-w-0 flex-1 items-center gap-2.5 px-3 text-left active:bg-white/5"
          >
            <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-white/10 px-1.5 text-sm font-bold tabular">
              {itemCount}
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-extrabold leading-tight tabular text-accent">{formatINR(estimatedTotal)}</span>
              <span className="block text-xs text-white/70">View cart · {t("pos.items")}</span>
            </span>
          </button>
          <button
            onClick={() => handleQuickPrint(true)}
            disabled={quickPrinting}
            className="flex min-h-14 items-center gap-2 bg-accent px-5 font-bold text-brand-dark transition-colors active:bg-accent-dark disabled:opacity-60"
          >
            <Printer className="h-5 w-5" />
            {quickPrinting ? t("pos.printing") : t("pos.printBill")}
          </button>
        </div>
      )}

      {cartOpenMobile && (
        <div className="fixed inset-0 z-40 flex flex-col bg-surface md:hidden">
          <div className="flex h-14 items-center justify-between border-b border-border px-2 pt-[env(safe-area-inset-top)]">
            <button
              onClick={() => setCartOpenMobile(false)}
              className="no-select touch-target flex items-center gap-1 rounded-xl px-3 text-sm font-semibold text-brand hover:bg-brand-soft/60"
            >
              ← Menu
            </button>
            <span className="pr-3 text-base font-bold text-ink">Current bill</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <CartPanel
              onQuickPrint={() => handleQuickPrint(true)}
            onSaveOnly={() => handleQuickPrint(false)}
              onCheckout={() => setPaymentOpen(true)}
              onHold={() => holdCurrentBill()}
              onUdhaari={() => setUdhaariOpen(true)}
              printing={quickPrinting}
            />
          </div>
        </div>
      )}

      <PaymentSheet open={paymentOpen} onClose={() => setPaymentOpen(false)} onSuccess={handleCheckoutSuccess} />
      <CustomerPickerSheet open={udhaariOpen} onClose={() => setUdhaariOpen(false)} onSelect={handleUdhaari} />
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
