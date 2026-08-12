"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type RangeKey = "today" | "yesterday" | "week" | "month";

export interface SalesReportData {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  byProduct: { name: string; quantity: number; revenue: number }[];
  byPayment: { method: string; amount: number }[];
  byCashier: { name: string; sales: number; bills: number }[];
  dailySeries: { date: string; sales: number }[];
}

interface SalesCacheState {
  byRange: Partial<Record<RangeKey, { data: SalesReportData; fetchedAt: number }>>;
  loading: boolean;
  ensure: (range: RangeKey, opts?: { force?: boolean }) => Promise<void>;
}

const STALE_MS = 2 * 60 * 1000; // sales can refresh more often

export const useSalesCache = create<SalesCacheState>()(
  persist(
    (set, get) => ({
      byRange: {},
      loading: false,

      ensure: async (range, { force } = {}) => {
        const cached = get().byRange[range];
        const fresh = cached && Date.now() - cached.fetchedAt < STALE_MS;
        if (!force && fresh) return;
        if (get().loading) return;

        const hasCache = !!cached;
        if (!hasCache) set({ loading: true });
        try {
          const res = await fetch(`/api/reports/sales?range=${range}`);
          if (res.ok) {
            const data = (await res.json()) as SalesReportData;
            set({
              byRange: {
                ...get().byRange,
                [range]: { data, fetchedAt: Date.now() },
              },
            });
          }
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "pos-sales-cache-v1",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ byRange: s.byRange }),
    }
  )
);
