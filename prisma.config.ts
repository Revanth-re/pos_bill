import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 moved connection settings out of schema.prisma. This file is
// used by the Prisma CLI (generate/migrate/studio) — the app's own runtime
// connection (via a driver adapter) is configured separately in
// lib/db/prisma.ts. See https://pris.ly/d/config-datasource
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
