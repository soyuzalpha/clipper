"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { storage } from "@/lib/storage/service";
import {
  MAX_UPLOAD_BYTES,
  mimeAllowed,
  kindForMime,
  buildStorageKey,
  sanitizeDisplayName,
  mimeFromExtension,
} from "@/lib/storage/config";

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

const importUrlSchema = z.object({
  url: z.string().trim().url("Enter a valid URL"),
  name: z.string().trim().max(200).optional(),
});

/**
 * Import a media file from a direct URL. The download happens server-side —
 * never from the browser — so the client never learns the storage path and
 * size/type limits are enforced while streaming. Plain media URLs only; no
 * social/YouTube/TikTok scraping.
 */
export async function importAssetFromUrl(raw: unknown): Promise<LibraryActionResult> {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const parsed = importUrlSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { url, name } = parsed.data;

  let protocol: string;
  try {
    protocol = new URL(url).protocol;
  } catch {
    return { ok: false, error: "Enter a valid URL." };
  }
  if (protocol !== "http:" && protocol !== "https:") {
    return { ok: false, error: "Only http(s) media URLs can be imported." };
  }

  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "clipper-content-library/0.1" },
    });
  } catch {
    return { ok: false, error: "Could not reach that URL." };
  }
  if (!res.ok) {
    return { ok: false, error: `Server responded with ${res.status}.` };
  }

  // Resolve mime from Content-Type first, falling back to the URL extension
  // for hosts that serve generic types. Reject anything outside the allowlist.
  const headerMime = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const mime =
    mimeAllowed(headerMime) ? headerMime
    : mimeFromExtension(url) ?? "";
  if (!mimeAllowed(mime)) {
    return { ok: false, error: "That URL isn't a supported video, image, audio, or PDF." };
  }

  // Stream the body to memory with a hard cap so an oversized host can't
  // exhaust the server. Nothing is written to disk until the whole file passes.
  const reader = res.body?.getReader();
  if (!reader) {
    return { ok: false, error: "Could not read the response." };
  }
  const chunks: Buffer[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_UPLOAD_BYTES) {
      await reader.cancel();
      return { ok: false, error: `File exceeds the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB limit.` };
    }
    chunks.push(Buffer.from(value));
  }
  if (total === 0) {
    return { ok: false, error: "That URL returned an empty file." };
  }
  const buffer = Buffer.concat(chunks);

  const storageKey = buildStorageKey(mime);
  try {
    await storage.upload(storageKey, buffer);
  } catch {
    return { ok: false, error: "Failed to store the file." };
  }

  const workspace = await prisma.workspace.findFirstOrThrow();
  try {
    await prisma.asset.create({
      data: {
        workspaceId: workspace.id,
        name: sanitizeDisplayName(name ?? importNameFromUrl(url)),
        kind: kindForMime(mime),
        mimeType: mime,
        storageKey,
        url, // source URL; null for browser uploads
        sizeBytes: buffer.length,
      },
    });
  } catch {
    await storage.delete(storageKey);
    return { ok: false, error: "Failed to save asset." };
  }

  revalidatePath("/library");
  return { ok: true };
}

/** Display name from the URL's last path segment when no explicit name is given. */
function importNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const segment = u.pathname.split("/").filter(Boolean).pop();
    if (segment) {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    }
    return u.hostname;
  } catch {
    return "Imported asset";
  }
}

export async function deleteAsset(assetId: string): Promise<LibraryActionResult> {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { storageKey: true },
  });
  if (!asset) {
    return { ok: false, error: "Asset not found." };
  }

  // Best-effort file removal, then the row (tags are cleaned by the m2m join).
  if (asset.storageKey) {
    await storage.delete(asset.storageKey);
  }
  await prisma.asset.delete({ where: { id: assetId } });

  revalidatePath("/library");
  return { ok: true };
}
