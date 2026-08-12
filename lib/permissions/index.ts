import type { StaffRole } from "@prisma/client";

/**
 * Every gate-able action in the app lives here as a flat string key.
 * Server code MUST check permissions via `can()` before mutating anything —
 * never trust a hidden button on the client as the only guard.
 */
export type Permission =
  | "billing.create"
  | "billing.void"
  | "products.view"
  | "products.create"
  | "products.edit"
  | "products.delete"
  | "inventory.view"
  | "inventory.adjust"
  | "customers.view"
  | "customers.manage"
  | "payments.record"
  | "expenses.view"
  | "expenses.manage"
  | "sales.view.own"
  | "sales.view.all"
  | "reports.view"
  | "profit.view"
  | "staff.manage"
  | "settings.manage"
  | "dayClosing.perform"
  | "tiffin.manage";

const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  OWNER: [
    "billing.create",
    "billing.void",
    "products.view",
    "products.create",
    "products.edit",
    "products.delete",
    "inventory.view",
    "inventory.adjust",
    "customers.view",
    "customers.manage",
    "payments.record",
    "expenses.view",
    "expenses.manage",
    "sales.view.own",
    "sales.view.all",
    "reports.view",
    "profit.view",
    "staff.manage",
    "settings.manage",
    "dayClosing.perform",
    "tiffin.manage",
  ],
  MANAGER: [
    "billing.create",
    "billing.void",
    "products.view",
    "products.create",
    "products.edit",
    "inventory.view",
    "inventory.adjust",
    "customers.view",
    "customers.manage",
    "payments.record",
    "expenses.view",
    "expenses.manage",
    "sales.view.own",
    "sales.view.all",
    "reports.view",
    "dayClosing.perform",
    "tiffin.manage",
    // Deliberately excluded: profit.view, staff.manage, settings.manage
  ],
  CASHIER: [
    "billing.create",
    "products.view",
    "customers.view",
    "customers.manage",
    "payments.record",
    "sales.view.own",
    "tiffin.manage",
    // Deliberately excluded: everything destructive or owner-sensitive
  ],
};

export function can(role: StaffRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function assertPermission(role: StaffRole, permission: Permission) {
  if (!can(role, permission)) {
    throw new PermissionError(permission);
  }
}

export class PermissionError extends Error {
  constructor(permission: Permission) {
    super(`Not permitted: ${permission}`);
    this.name = "PermissionError";
  }
}
