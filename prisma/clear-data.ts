import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

/**
 * Clear ALL data except the admin user + workspace (keeps login working).
 * Inverse of the demo reseed in prisma/seed.ts.
 *
 * Safety: refuses to run unless DATABASE_URL is explicitly set in the
 * environment. Without this guard a typo'd CWD would fall back to the dev
 * default (./data/content.db) and clear the wrong database. Running it in the
 * same shell/env as `pnpm db:seed` targets the same database the seed used.
 *
 * Run with: pnpm db:clear
 */
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error(
    "Refusing to clear: DATABASE_URL is not set. Run with the same environment your app uses, e.g. DATABASE_URL=file:/var/lib/clipper/content.db pnpm db:clear"
  );
  process.exit(1);
}
if (dbUrl.startsWith("file:")) {
  mkdirSync(dirname(dbUrl.slice("file:".length)), { recursive: true });
}

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: dbUrl }),
});

/** FK-safe child-first order, mirroring the wipe in prisma/seed.ts. */
const CLEAR_ORDER = [
  "analyticsSnapshot",
  "publication",
  "content",
  "clip",
  "video",
  "contentPlan",
  "script",
  "contentIdea",
  "campaignRequirement",
  "aIAnalysis",
  "aIRecommendation",
  "asset",
  "tag",
  "campaign",
] as const;

/** Any Prisma delegate exposing deleteMany (all listed models do). */
type ClearableModel = {
  deleteMany: () => Promise<{ count: number }>;
};

async function main() {
  console.log(`Clearing data in: ${dbUrl}`);
  for (const model of CLEAR_ORDER) {
    const delegate = prisma[model] as unknown as ClearableModel;
    const { count } = await delegate.deleteMany();
    if (count > 0) console.log(`  - ${model}: ${count} deleted`);
  }
  const [users, workspaces] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
  ]);
  console.log(`Done. Kept ${users} user(s) and ${workspaces} workspace(s) — login intact.`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
