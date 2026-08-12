import { create } from "zustand";

export type DiscountType = "PERCENT" | "FIXED";

export interface CartProduct {
  id: string;
  name: string;
  sellingPrice: number;
  gstPercent: number;
  unit: string;
  currentStock: number;
  trackInventory: boolean;
  imageUrl: string | null;
}

export interface CartLine {
  product: CartProduct;
  quantity: number;
  discount?: { type: DiscountType; value: number };
}

interface CartState {
  lines: CartLine[];
  orderType: "DINE_IN" | "TAKEAWAY";
  billDiscount?: { type: DiscountType; value: number };
  customerId?: string;
  customerName?: string;
  heldBillId?: string;

  addProduct: (product: CartProduct) => void;
  incrementLine: (productId: string) => void;
  decrementLine: (productId: string) => void;
  setLineQuantity: (productId: string, quantity: number) => void;
  removeLine: (productId: string) => void;
  setLineDiscount: (productId: string, discount?: { type: DiscountType; value: number }) => void;
  setBillDiscount: (discount?: { type: DiscountType; value: number }) => void;
  setOrderType: (type: "DINE_IN" | "TAKEAWAY") => void;
  setCustomer: (id?: string, name?: string) => void;
  loadHeldBill: (heldBillId: string, lines: CartLine[], orderType: "DINE_IN" | "TAKEAWAY") => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  orderType: "TAKEAWAY",
  billDiscount: undefined,
  customerId: undefined,
  customerName: undefined,
  heldBillId: undefined,

  addProduct: (product) => {
    const lines = get().lines;
    const existing = lines.find((l) => l.product.id === product.id);
    if (existing) {
      set({
        lines: lines.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
        ),
      });
    } else {
      set({ lines: [...lines, { product, quantity: 1 }] });
    }
  },

  incrementLine: (productId) => {
    set({
      lines: get().lines.map((l) =>
        l.product.id === productId ? { ...l, quantity: l.quantity + 1 } : l
      ),
    });
  },

  decrementLine: (productId) => {
    const lines = get().lines
      .map((l) => (l.product.id === productId ? { ...l, quantity: l.quantity - 1 } : l))
      .filter((l) => l.quantity > 0);
    set({ lines });
  },

  setLineQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      set({ lines: get().lines.filter((l) => l.product.id !== productId) });
      return;
    }
    set({
      lines: get().lines.map((l) => (l.product.id === productId ? { ...l, quantity } : l)),
    });
  },

  removeLine: (productId) => {
    set({ lines: get().lines.filter((l) => l.product.id !== productId) });
  },

  setLineDiscount: (productId, discount) => {
    set({
      lines: get().lines.map((l) => (l.product.id === productId ? { ...l, discount } : l)),
    });
  },

  setBillDiscount: (discount) => set({ billDiscount: discount }),
  setOrderType: (type) => set({ orderType: type }),
  setCustomer: (id, name) => set({ customerId: id, customerName: name }),

  loadHeldBill: (heldBillId, lines, orderType) => set({ heldBillId, lines, orderType }),

  clear: () =>
    set({
      lines: [],
      billDiscount: undefined,
      customerId: undefined,
      customerName: undefined,
      heldBillId: undefined,
      orderType: "TAKEAWAY",
    }),
}));

/** Client-side estimate only, for display while typing — the server in
 * /api/billing/checkout recomputes this authoritatively before any money
 * or inventory actually moves. */
export function estimateCartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => {
    const base = l.product.sellingPrice * l.quantity;
    const discount = !l.discount
      ? 0
      : l.discount.type === "PERCENT"
      ? (base * l.discount.value) / 100
      : Math.min(l.discount.value, base);
    return sum + (base - discount);
  }, 0);
}
