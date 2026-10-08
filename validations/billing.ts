import { z } from "zod";

/**
 * IMPORTANT: The client sends product ids + quantities + *requested*
 * discounts, never final prices or totals. The server re-reads live
 * product prices from the DB and recomputes everything — see
 * lib/billing/calculateTotals.ts. Treat every field here as "what the
 * cashier asked for", not "what the bill costs".
 */

export const discountSchema = z.object({
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().nonnegative(),
});

export const cartLineSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().positive().max(9999),
  discount: discountSchema.optional(),
});

export const splitPaymentSchema = z.object({
  method: z.enum(["CASH", "UPI", "CARD", "CREDIT"]),
  amount: z.number().nonnegative(),
  reference: z.string().max(100).optional(),
});

export const checkoutSchema = z
  .object({
    orderType: z.enum(["DINE_IN", "TAKEAWAY"]),
    items: z.array(cartLineSchema).min(1, "Cart is empty"),
    billDiscount: discountSchema.optional(),
    customerId: z.string().cuid().optional(),
    payments: z.array(splitPaymentSchema).min(1, "At least one payment is required"),
    heldBillId: z.string().cuid().optional(), // if resuming a held bill, delete it on success
    // For offline-created bills synced later: the client-generated id lets
    // the server dedupe if the same bill is retried after a flaky sync.
    clientId: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      const hasCredit = data.payments.some((p) => p.method === "CREDIT");
      return !hasCredit || !!data.customerId;
    },
    { message: "A customer must be selected for credit payments", path: ["customerId"] }
  );

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const holdBillSchema = z.object({
  label: z.string().max(80).optional(),
  orderType: z.enum(["DINE_IN", "TAKEAWAY"]),
  items: z.array(cartLineSchema).min(1),
  billDiscount: discountSchema.optional(),
  customerId: z.string().cuid().optional(),
});

export type HoldBillInput = z.infer<typeof holdBillSchema>;

export const stockAdjustmentSchema = z.object({
  productId: z.string().cuid().optional(),
  ingredientId: z.string().cuid().optional(),
  quantity: z.number(), // signed
  reason: z.string().min(1, "Reason is required").max(200),
});
