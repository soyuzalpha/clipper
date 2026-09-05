import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage/service";

/**
 * Stream a stored asset's bytes to the browser. Auth on every request; 404
 * when the row or its file is missing. `mode` controls inline (preview) vs
 * attachment (download). Range requests are honored so <video>/<audio> can
 * seek in previews. All path resolution goes through `storage`.
 */
export async function streamAsset(
  request: Request,
  assetId: string,
  mode: "inline" | "attachment"
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset?.storageKey) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  const size = await storage.stat(asset.storageKey);
  if (size === null) {
    return NextResponse.json({ error: "File missing on disk." }, { status: 404 });
  }

  const contentType = asset.mimeType ?? "application/octet-stream";

  // Display filename sanitized for a header value (no CR/LF injection, no quotes).
  const safe = asset.name.replace(/[\r\n]/g, "").replace(/[\\/"]/g, "_") || "download";
  const ascii = safe.replace(/[^\x20-\x7e]/g, "_");
  const disposition =
    mode === "attachment"
      ? `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`
      : "inline";

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Disposition": disposition,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
  };

  let status = 200;
  let start = 0;
  let end = size - 1;

  const range = request.headers.get("range");
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (m && m[1]) {
      start = parseInt(m[1], 10);
      end = m[2] ? Math.min(parseInt(m[2], 10), size - 1) : size - 1;
      if (start >= size || start > end) {
        return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      }
    } else if (m && m[2]) {
      // suffix range bytes=-N → last N bytes
      start = Math.max(size - parseInt(m[2], 10), 0);
      end = size - 1;
    } else {
      // Multi-part/unsatisfiable range → serve the whole file.
      start = 0;
      end = size - 1;
    }
    if (start !== 0 || end !== size - 1) {
      status = 206;
      headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
    }
  }

  const stream = await storage.getStream(asset.storageKey, { start, end });
  if (!stream) {
    return NextResponse.json({ error: "File missing on disk." }, { status: 404 });
  }

  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    status,
    headers: { ...headers, "Content-Length": String(end - start + 1) },
  });
}
