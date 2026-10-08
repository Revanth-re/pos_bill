import type { NextAuthConfig } from "next-auth";

// On Vercel the domain comes from the request itself. A leftover NEXTAUTH_URL / AUTH_URL
// (e.g. the old pos-bill-gamma.vercel.app) would make Auth.js send people to that dead domain.
// Old domain is dead — never let Auth.js use it, on Vercel or anywhere else.
for (const k of ["NEXTAUTH_URL", "AUTH_URL"] as const) {
  const v = process.env[k];
  if (process.env.VERCEL || (v && /pos-bill-gamma|billo-quick/.test(v))) delete process.env[k];
}

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
  // Use whatever domain the request came in on (getbillo.vercel.app, a custom domain, …)
  // instead of a hard-coded NEXTAUTH_URL — so login never jumps to an old domain.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    // Keep every post-login / logout redirect on the CURRENT site.
    // (If NEXTAUTH_URL still points at an old domain, Auth.js would otherwise send users there.)
    // Must return an ABSOLUTE url (next-auth/react does `new URL(data.url)`), always on the live domain.
    async redirect({ url, baseUrl }) {
      const base = /pos-bill-gamma|billo-quick/.test(baseUrl) ? "https://getbillo.vercel.app" : baseUrl;
      try {
        const u = new URL(url, base);
        return new URL(`${u.pathname}${u.search}${u.hash}`, base).href;
      } catch {
        return `${base}/dashboard`;
      }
    },
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
