import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma 7 requires every PrismaClient to be constructed with a driver
 * adapter — `new PrismaClient()` alone is no longer valid. We use
 * @prisma/adapter-pg (the standard Postgres adapter, backed by the `pg`
 * npm driver) since Supabase is Postgres under the hood.
 *
 * Supabase gives you two connection strings:
 *  - Direct connection (port 5432) — best for local dev and migrations.
 *  - Transaction pooler / PgBouncer (port 6543) — required for serverless
 *    environments like Vercel, where each function invocation would
 *    otherwise open its own DB connection and quickly exhaust Postgres's
 *    connection limit. Use the pooler URL for DATABASE_URL in production.
 *
 * The adapter just needs the connection string; it works the same either
 * way, so nothing here needs to change based on which one you use.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildAdapter() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return new PrismaPg({ connectionString });
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: buildAdapter(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
