import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

/**
 * Auth.js config. We use a Credentials provider (email + password) rather
 * than OAuth because most small Indian food-business owners will not have
 * a Google Workspace account tied to the shop — email/phone + password or
 * a staff PIN is the realistic login for a cashier on a shared tablet.
 *
 * On successful login we attach the active Staff row (business + role) to
 * the session so every server action can authorize without another query.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: {
            staff: {
              where: { status: "ACTIVE" },
              include: { business: true },
            },
          },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        const activeStaff = user.staff[0];
        if (!activeStaff) return null; // no active business membership

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          staffId: activeStaff.id,
          businessId: activeStaff.businessId,
          businessName: activeStaff.business.name,
          role: activeStaff.role,
        };
      },
    }),
  ],
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
