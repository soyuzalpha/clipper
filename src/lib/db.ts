import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = getEnv().DATABASE_URL;

  // file: URLs need an existing parent dir; SQLite/LibSQL won't create it.
  if (url.startsWith("file:")) {
    mkdirSync(dirname(url.slice("file:".length)), { recursive: true });
  }

  return new PrismaClient({
    adapter: new PrismaLibSql({ url }),
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma =
  globalForPrisma.prisma ??
  (globalForPrisma.prisma = createPrismaClient());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;