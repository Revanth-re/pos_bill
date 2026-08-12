import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { edgeAuthConfig } from "./edgeConfig";

/**
 * Full Auth.js config for Node.js contexts only (the NextAuth API route,
 * server components, server actions). Extends edgeAuthConfig with the
 * Credentials provider, which imports Prisma — this file must NEVER be
 * imported from proxy.ts (middleware runs on the Edge runtime and can't
 * load the `pg` driver Prisma depends on). See lib/auth/edgeConfig.ts.
 *
 * We use email + password rather than OAuth because most small Indian
 * food-business owners won't have a Google Workspace account tied to the
 * shop — email/phone + password (or a staff PIN) is the realistic login
 * for a cashier on a shared tablet.
 *
 * On successful login we attach the active Staff row (business + role) to
 * the session so every server action can authorize without another query.
 */
export const authConfig: NextAuthConfig = {
  ...edgeAuthConfig,
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
};
