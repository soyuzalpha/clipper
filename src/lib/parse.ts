export function parseJsonArray<T = string>(value: string | null | undefined, fallback: T[] = []): T[] {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T[];
  } catch {
    return fallback;
  }
}
