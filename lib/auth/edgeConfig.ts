import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of the Auth.js config: session strategy, pages, and the
 * jwt/session callbacks that just read/write the token — no providers, no
 * Prisma import, nothing that touches a database driver. This is the ONLY
 * config that should ever be imported by proxy.ts (Next.js middleware),
 * because middleware runs on the Edge runtime, which can't execute
 * Node-native modules like the `pg` driver our Prisma client depends on.
 *
 * The full config (lib/auth/config.ts) extends this with the Credentials
 * provider and is used only in Node.js contexts: the NextAuth API route
 * handler and server components/actions via requireSession().
 */
export const edgeAuthConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.staffId = (user as unknown as { staffId: string }).staffId;
        token.businessId = (user as unknown as { businessId: string }).businessId;
        token.businessName = (user as unknown as { businessName: string }).businessName;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).staffId = token.staffId;
        (session.user as unknown as Record<string, unknown>).businessId = token.businessId;
        (session.user as unknown as Record<string, unknown>).businessName = token.businessName;
        (session.user as unknown as Record<string, unknown>).role = token.role;
      }
      return session;
    },
  },
};
