import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";

/**
 * Shared menu across outlets. Every outlet shows the MAIN shop's menu (the owner's first shop)
 * plus its own extra items. If an outlet has its own item with the same name, that version wins
 * (e.g. a different price at that outlet).
 */
export const getMenuScope = (businessId: string) =>
  unstable_cache(
    async () => {
      const owners = await prisma.staff.findMany({
        where: { businessId, role: "OWNER", status: "ACTIVE" },
        select: { userId: true },
      });
      const main = owners.length
        ? await prisma.staff.findFirst({
            where: { userId: { in: owners.map((o) => o.userId) }, role: "OWNER", status: "ACTIVE" },
            orderBy: { business: { createdAt: "asc" } },
            select: { businessId: true, business: { select: { name: true } } },
          })
        : null;
      const mainId = main?.businessId ?? businessId;
      return {
        mainId,
        mainName: main?.business.name ?? null,
        /** Businesses whose products this outlet can see and bill. */
        ids: mainId === businessId ? [businessId] : [businessId, mainId],
      };
    },
    ["menu-scope", businessId],
    { tags: [`menu-${businessId}`], revalidate: 300 }
  )();

const key = (s: string) => s.trim().toLowerCase();

/** Merge own + main-shop rows: own first, main-shop rows with the same name are dropped. */
export function mergeByName<T extends { name: string; businessId: string }>(rows: T[], ownBusinessId: string): (T & { shared: boolean })[] {
  const own = rows.filter((r) => r.businessId === ownBusinessId);
  const names = new Set(own.map((r) => key(r.name)));
  const shared = rows.filter((r) => r.businessId !== ownBusinessId && !names.has(key(r.name)));
  return [...own.map((r) => ({ ...r, shared: false })), ...shared.map((r) => ({ ...r, shared: true }))];
}
