"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export type LibraryActionResult = { ok: true } | { ok: false; error: string };

export async function toggleAssetFavorite(assetId: string): Promise<LibraryActionResult> {
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
