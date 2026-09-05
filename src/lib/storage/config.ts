/**
 * Content storage limits. Server-side only — never exposed to the client.
 * Both values are env-overridable for ops (e.g. a home server with a small
 * disk can cap uploads lower than the app default).
 */

/** Hard cap for any single stored file (bytes). Default 512 MB. */
export const MAX_UPLOAD_BYTES = Number(process.env.CONTENT_MAX_UPLOAD_MB ?? 512) * 1024 * 1024;

/**
 * Allowed content types. Entries are either an exact mime or a `type/*` prefix.
 * Anything else (scripts, executables, plain text, …) is rejected before it
 * touches disk.
 */
export const ALLOWED_MIMES = [
  "video/*",
  "image/*",
  "audio/*",
  "application/pdf",
] as const;

/** File-category kind (library tab) derived from mime. Unknown → document. */
export function kindForMime(mime: string): "video" | "image" | "audio" | "document" {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}

/**
 * Server-generated safe storage key, e.g. `originals/2026/09/abc123.mp4`.
 * Date-partitioned so a home server can prune by age. The id and extension
 * come from the server — never from the client filename.
 */
export function buildStorageKey(mime: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `originals/${yyyy}/${mm}/${id}.${extensionForMime(mime)}`;
}

/** Client filename → display name only. Never a path: strips separators/control chars. */
export function sanitizeDisplayName(name: string | undefined | null, fallback = "Untitled"): string {
  const cleaned = (name ?? "")
    .replace(/[\\/\0\r\n]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 200);
  return cleaned || fallback;
}

export function mimeAllowed(mime: string): boolean {
  const [type] = mime.split("/");
  return ALLOWED_MIMES.some((a) => {
    if (a.endsWith("/*")) return `${type}/` === a.replace("*", "");
    return a === mime;
  });
}

const EXT_TO_MIME: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/mp4",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  ogg: "audio/ogg",
  pdf: "application/pdf",
};

/** Best-effort mime guess from a URL path extension. Returns null when unknown. */
export function mimeFromExtension(url: string): string | null {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return null;
  }
  const ext = pathname.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? null;
}

/**
 * Whitelisted file extension for a mime, used to build safe storage keys.
 * The extension is never taken from the client filename.
 */
export function extensionForMime(mime: string): string {
  const ext: Record<string, string> = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "application/pdf": "pdf",
  };
  const known = ext[mime];
  if (known) return known;
  // video/*, image/*, audio/* that aren't in the map get a generic suffix —
  // the browser still plays them via the stored mimeType.
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "img";
  if (mime.startsWith("audio/")) return "audio";
  return "bin";
}
