import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";

/** Business name + language for the app shell — cached so page loads don't hit the DB every time. */
export const getShellBusiness = (businessId: string) =>
  unstable_cache(
    () => prisma.business.findUniqueOrThrow({ where: { id: businessId }, select: { name: true, language: true } }),
    ["shell-business", businessId],
    { tags: [`business-${businessId}`], revalidate: 600 }
  )();
