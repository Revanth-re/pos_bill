import NextAuth from "next-auth";
import { authConfig } from "./config";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/**
 * Convenience helper for server code (API routes, server actions): returns
 * the authenticated session's business context or throws. Centralizing this
 * means every mutation route gets businessId/staffId/role from the server
 * session, never from the request body — the client can't spoof its role.
 */
export async function requireSession() {
  const session = await auth();
  const user = session?.user as
    | { staffId?: string; businessId?: string; role?: string; name?: string; email?: string }
    | undefined;

  if (!session || !user?.staffId || !user?.businessId || !user?.role) {
    throw new UnauthenticatedError();
  }

  return {
    staffId: user.staffId,
    businessId: user.businessId,
    role: user.role as "OWNER" | "MANAGER" | "CASHIER",
    name: user.name ?? "",
    email: user.email ?? "",
  };
}

export class UnauthenticatedError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "UnauthenticatedError";
  }
}
