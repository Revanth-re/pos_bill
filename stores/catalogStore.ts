"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartProduct } from "@/stores/cartStore";

export interface CatalogCategory {
  id: string;
  name: string;
}

export interface ManagedProduct {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  categoryId: string | null;
  categoryName: string | null;
  unit: string;
  sellingPrice: number;
  purchasePrice: number;
  gstPercent: number;
  currentStock: number;
  minStock: number;
  status: "ACTIVE" | "INACTIVE";
  imageUrl: string | null;
  trackInventory?: boolean;
}

export interface CustomerCacheRow {
  id: string;
  name: string;
  phone: string | null;
  outstandingBalance: number;
}

const STALE_MS = 5 * 60 * 1000; // 5 minutes — show cache, refresh in background after this

interface CatalogState {
  products: CartProduct[];
  categories: CatalogCategory[];
  managedProducts: ManagedProduct[];
  customers: CustomerCacheRow[];
  productsFetchedAt: number;
  managedFetchedAt: number;
  customersFetchedAt: number;
  loadingProducts: boolean;
  loadingManaged: boolean;
  loadingCustomers: boolean;

  seedPosCatalog: (products: CartProduct[], categories: CatalogCategory[]) => void;
  seedManaged: (products: ManagedProduct[], categories?: CatalogCategory[]) => void;
  seedCustomers: (customers: CustomerCacheRow[]) => void;
  ensurePosCatalog: (opts?: { force?: boolean }) => Promise<void>;
  ensureManagedCatalog: (opts?: { force?: boolean }) => Promise<void>;
  ensureCustomers: (opts?: { force?: boolean }) => Promise<void>;
  upsertManagedProduct: (product: ManagedProduct) => void;
  removeManagedProduct: (id: string) => void;
  patchPosStock: (productId: string, currentStock: number) => void;
}

function mapApiProductToCart(p: Record<string, unknown>): CartProduct {
  return {
    id: String(p.id),
    name: String(p.name),
    sellingPrice: Number(p.sellingPrice),
    gstPercent: Number(p.gstPercent),
    unit: String(p.unit ?? "pc"),
    currentStock: Number(p.currentStock ?? 0),
    trackInventory: Boolean(p.trackInventory ?? true),
    imageUrl: (p.imageUrl as string | null) ?? null,
  };
}

function mapApiProductToManaged(p: Record<string, unknown>): ManagedProduct {
  const category = p.category as { name?: string } | null | undefined;
  return {
    id: String(p.id),
    name: String(p.name),
    sku: (p.sku as string | null) ?? null,
    barcode: (p.barcode as string | null) ?? null,
    categoryId: (p.categoryId as string | null) ?? null,
    categoryName: category?.name ?? (p.categoryName as string | null) ?? null,
    unit: String(p.unit ?? "pc"),
    sellingPrice: Number(p.sellingPrice),
    purchasePrice: Number(p.purchasePrice ?? 0),
    gstPercent: Number(p.gstPercent ?? 0),
    currentStock: Number(p.currentStock ?? 0),
    minStock: Number(p.minStock ?? 0),
    status: (p.status as "ACTIVE" | "INACTIVE") ?? "ACTIVE",
    imageUrl: (p.imageUrl as string | null) ?? null,
    trackInventory: p.trackInventory !== undefined ? Boolean(p.trackInventory) : undefined,
  };
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      managedProducts: [],
      customers: [],
      productsFetchedAt: 0,
      managedFetchedAt: 0,
      customersFetchedAt: 0,
      loadingProducts: false,
      loadingManaged: false,
      loadingCustomers: false,

      seedPosCatalog: (products, categories) => {
        set({
          products,
          categories,
          productsFetchedAt: Date.now(),
        });
      },

      seedManaged: (products, categories) => {
        set({
          managedProducts: products,
          ...(categories ? { categories } : {}),
          managedFetchedAt: Date.now(),
          // Keep POS list in sync with managed edits when possible
          products: products
            .filter((p) => p.status === "ACTIVE")
            .map((p) => ({
              id: p.id,
              name: p.name,
              sellingPrice: p.sellingPrice,
              gstPercent: p.gstPercent,
              unit: p.unit,
              currentStock: p.currentStock,
              trackInventory: p.trackInventory ?? true,
              imageUrl: p.imageUrl,
            })),
          productsFetchedAt: Date.now(),
        });
      },

      seedCustomers: (customers) => {
        set({ customers, customersFetchedAt: Date.now() });
      },

      ensurePosCatalog: async ({ force } = {}) => {
        const { productsFetchedAt, products, loadingProducts } = get();
        const fresh = Date.now() - productsFetchedAt < STALE_MS;
        if (!force && products.length > 0 && fresh) return;
        if (loadingProducts) return;

        set({ loadingProducts: true });
        try {
          const [prodRes, catRes] = await Promise.all([
            fetch("/api/products?limit=200"),
            fetch("/api/categories"),
          ]);
          if (prodRes.ok) {
            const body = await prodRes.json();
            const mapped = (body.products as Record<string, unknown>[]).map(mapApiProductToCart);
            set({ products: mapped, productsFetchedAt: Date.now() });
          }
          if (catRes.ok) {
            const body = await catRes.json();
            set({
              categories: (body.categories as { id: string; name: string }[]).map((c) => ({
                id: c.id,
                name: c.name,
              })),
            });
          }
        } finally {
          set({ loadingProducts: false });
        }
      },

      ensureManagedCatalog: async ({ force } = {}) => {
        const { managedFetchedAt, managedProducts, loadingManaged } = get();
        const fresh = Date.now() - managedFetchedAt < STALE_MS;
        if (!force && managedProducts.length > 0 && fresh) return;
        if (loadingManaged) return;

        set({ loadingManaged: true });
        try {
          const [prodRes, catRes] = await Promise.all([
            fetch("/api/products?status=all&limit=500"),
            fetch("/api/categories"),
          ]);
          const cats = catRes.ok
            ? ((await catRes.json()).categories as { id: string; name: string }[]).map((c) => ({
                id: c.id,
                name: c.name,
              }))
            : undefined;
          if (prodRes.ok) {
            const body = await prodRes.json();
            const mapped = (body.products as Record<string, unknown>[]).map(mapApiProductToManaged);
            get().seedManaged(mapped, cats);
          } else if (cats) {
            set({ categories: cats });
          }
        } finally {
          set({ loadingManaged: false });
        }
      },

      ensureCustomers: async ({ force } = {}) => {
        const { customersFetchedAt, customers, loadingCustomers } = get();
        const fresh = Date.now() - customersFetchedAt < STALE_MS;
        if (!force && customers.length > 0 && fresh) return;
        if (loadingCustomers) return;

        set({ loadingCustomers: true });
        try {
          const res = await fetch("/api/customers");
          if (res.ok) {
            const body = await res.json();
            const rows = (body.customers as Record<string, unknown>[]).map((c) => ({
              id: String(c.id),
              name: String(c.name),
              phone: (c.phone as string | null) ?? null,
              outstandingBalance: Number(c.outstandingBalance ?? 0),
            }));
            set({ customers: rows, customersFetchedAt: Date.now() });
          }
        } finally {
          set({ loadingCustomers: false });
        }
      },

      upsertManagedProduct: (product) => {
        const { managedProducts } = get();
        const idx = managedProducts.findIndex((p) => p.id === product.id);
        const next =
          idx >= 0
            ? managedProducts.map((p) => (p.id === product.id ? product : p))
            : [...managedProducts, product];
        get().seedManaged(next);
      },

      removeManagedProduct: (id) => {
        const next = get().managedProducts.filter((p) => p.id !== id);
        get().seedManaged(next);
      },

      patchPosStock: (productId, currentStock) => {
        set({
          products: get().products.map((p) => (p.id === productId ? { ...p, currentStock } : p)),
          managedProducts: get().managedProducts.map((p) =>
            p.id === productId ? { ...p, currentStock } : p
          ),
        });
      },
    }),
    {
      name: "pos-catalog-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        products: s.products,
        categories: s.categories,
        managedProducts: s.managedProducts,
        customers: s.customers,
        productsFetchedAt: s.productsFetchedAt,
        managedFetchedAt: s.managedFetchedAt,
        customersFetchedAt: s.customersFetchedAt,
      }),
    }
  )
);
