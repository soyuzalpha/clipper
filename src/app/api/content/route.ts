import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage/service";
import {
  MAX_UPLOAD_BYTES,
  mimeAllowed,
  kindForMime,
  buildStorageKey,
  sanitizeDisplayName,
} from "@/lib/storage/config";

export const dynamic = "force-dynamic";

/**
 * Multipart upload → stored file + Asset row. Server actions can't take a
 * binary body cleanly, so this is a raw route handler. Server-side only:
 * returns metadata, never the storage path or key internals.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const entry = form.get("file");
    file = entry instanceof File ? entry : null;
  } catch {
    return NextResponse.json({ error: "Could not read upload body." }, { status: 400 });
  }

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File exceeds the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB limit.` },
      { status: 413 }
    );
  }

  const mime = file.type.toLowerCase();
  if (!mimeAllowed(mime)) {
    return NextResponse.json(
      { error: "File type not supported. Upload a video, image, audio, or PDF." },
      { status: 415 }
    );
  }

  const name = sanitizeDisplayName(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = buildStorageKey(mime);

  // Write to disk before the DB row so a failed row insert leaves no orphan.
  await storage.upload(storageKey, buffer);

  const workspace = await prisma.workspace.findFirstOrThrow();
  try {
    const asset = await prisma.asset.create({
      data: {
        workspaceId: workspace.id,
        name,
        kind: kindForMime(mime),
        mimeType: mime,
        storageKey,
        sizeBytes: buffer.length,
      },
    });
    return NextResponse.json({ ok: true, asset }, { status: 201 });
  } catch {
    await storage.delete(storageKey);
    return NextResponse.json({ error: "Failed to save asset." }, { status: 500 });
  }
}
