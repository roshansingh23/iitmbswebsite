import { db } from "./db";
import { DEFAULT_CONFIG, type ConfigKey } from "./config-defaults";

// Tiny in-memory cache so we don't hit DB for every Hook click. Keyed by key
// and invalidated on a 30-second clock — short enough that admin edits land
// fast, long enough to keep the hot path quiet.
type Entry = { value: string; expiresAt: number };
const cache = new Map<string, Entry>();
const TTL = 30_000;

export async function getConfigRaw(key: ConfigKey): Promise<string> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.value;

  try {
    const row = await db.config.findUnique({ where: { key } });
    const value = row?.value ?? String(DEFAULT_CONFIG[key]);
    cache.set(key, { value, expiresAt: now + TTL });
    return value;
  } catch {
    // DB unavailable (build time, dev with no DB). Fall back silently.
    return String(DEFAULT_CONFIG[key]);
  }
}

export async function getConfigInt(key: ConfigKey): Promise<number> {
  const raw = await getConfigRaw(key);
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : Number(DEFAULT_CONFIG[key]);
}

export async function setConfig(key: ConfigKey, value: string | number) {
  cache.delete(key);
  await db.config.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) }
  });
}
