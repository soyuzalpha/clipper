import { mkdir, writeFile, stat, unlink, readFile } from "node:fs/promises";
import { createReadStream as createFsReadStream } from "node:fs";
import path from "node:path";

/**
 * Local-filesystem content storage. The only place a storageKey is turned
 * into a physical path — callers store keys, never paths. Backend is swappable
 * (an S3 implementation behind the same shape) without touching callers.
 */
export const CONTENT_STORAGE_ROOT = path.resolve(
  process.env.CONTENT_STORAGE_PATH ?? "./storage"
);

/** Subdirectories reserved per the storage layout; MVP writes only originals/. */
const SUBDIRS = ["originals", "thumbnails", "clips", "temp"];

async function ensureRoot() {
  await mkdir(CONTENT_STORAGE_ROOT, { recursive: true });
  await Promise.all(SUBDIRS.map((d) => mkdir(path.join(CONTENT_STORAGE_ROOT, d), { recursive: true })));
}

/** Resolve a key to a physical path, refusing any traversal outside the root. */
function resolve(key: string): string {
  const abs = path.resolve(CONTENT_STORAGE_ROOT, key);
  if (abs !== CONTENT_STORAGE_ROOT && !abs.startsWith(CONTENT_STORAGE_ROOT + path.sep)) {
    throw new Error(`Storage key escapes root: ${key}`);
  }
  return abs;
}

export const storage = {
  /** Write a file at key, creating parent dirs. Key must be server-generated. */
  async upload(key: string, data: Buffer): Promise<void> {
    const abs = resolve(key);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, data);
  },

  /** Node read stream for a key, or null when absent. Range options for media seeking. */
  async getStream(key: string, options?: { start?: number; end?: number }) {
    try {
      const abs = resolve(key);
      await stat(abs);
      return createFsReadStream(abs, options);
    } catch {
      return null;
    }
  },

  /** Whole file in memory — for small previews only; prefer getStream. */
  async getBuffer(key: string): Promise<Buffer | null> {
    try {
      return await readFile(resolve(key));
    } catch {
      return null;
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      await stat(resolve(key));
      return true;
    } catch {
      return false;
    }
  },

  /** File size in bytes for a key, or null when absent. */
  async stat(key: string): Promise<number | null> {
    try {
      const s = await stat(resolve(key));
      return s.size;
    } catch {
      return null;
    }
  },

  /** Remove a file, tolerating it already being gone. */
  async delete(key: string): Promise<void> {
    try {
      await unlink(resolve(key));
    } catch {
      // ENOENT — nothing to delete.
    }
  },
};

// Create the tree once at import so uploads never race a missing root.
void ensureRoot();
