import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

/**
 * Prisma 7 requires every PrismaClient to be constructed with a driver
 * adapter — `new PrismaClient()` alone is no longer valid. We use
 * @prisma/adapter-mariadb (the officially supported adapter for both
 * MariaDB and plain MySQL, backed by the `mariadb` npm driver).
 *
 * We parse DATABASE_URL ourselves into discrete fields (host/port/user/
 * password/database) rather than passing the raw string to PrismaMariaDb —
 * its connection-string parser only accepts a literal `mariadb://` scheme
 * and has known issues with special characters in credentials, so a plain
 * `mysql://...` URL (as used by Railway, PlanetScale-via-MySQL, etc.) is
 * safer to hand-parse. See prisma/prisma#27598 and #29097.
 */
function buildAdapter() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const url = new URL(connectionString);

  return new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    connectionLimit: 5,
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: buildAdapter(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

