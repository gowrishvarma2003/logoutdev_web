const CACHE_TTL_MS = 3 * 60 * 1000;

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function getCachedProfile(username: string) {
  return getCached<{
    profile: Record<string, unknown>;
    stats: Record<string, number> | null;
    skills: Array<{ skill: string; rank: number }>;
  }>(`profile:${username}`);
}

export function setCachedProfile(username: string, data: {
  profile: Record<string, unknown>;
  stats: Record<string, number> | null;
  skills: Array<{ skill: string; rank: number }>;
}) {
  setCache(`profile:${username}`, data);
}

export function getCachedSignals(username: string) {
  return getCached<{
    band: string | null;
    score: number | null;
  }>(`signals:${username}`);
}

export function setCachedSignals(username: string, data: {
  band: string | null;
  score: number | null;
}) {
  setCache(`signals:${username}`, data);
}
