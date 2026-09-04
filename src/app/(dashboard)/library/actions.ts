"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export type LibraryActionResult = { ok: true } | { ok: false; error: string };

export async function toggleAssetFavorite(assetId: string): Promise<LibraryActionResult> {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { favorite: true },
  });
  if (!asset) {
    return { ok: false, error: "Asset not found." };
  }
  await prisma.asset.update({
    where: { id: assetId },
    data: { favorite: !asset.favorite },
  });
  revalidatePath("/library");
  return { ok: true };
}
