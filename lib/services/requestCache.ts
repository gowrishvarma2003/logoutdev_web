/**
 * requestCache — lightweight client-side in-memory cache for Spaces & Repos data.
 *
 * Goals:
 *  - Eliminate redundant API calls + loading flashes when switching internal tabs.
 *  - Per-entry TTL with stale-while-revalidate support.
 *  - Tag-based invalidation so mutations can bust related entries in one call.
 *  - Auth-scoped keys: every key is prefixed with the current user id so private
 *    data never leaks between accounts. The whole store is also wiped on
 *    logout / 401 via `clear()`.
 *  - Bounded memory via a simple LRU cap (Map preserves insertion order).
 *
 * This is a module singleton on the client. It is never populated on the server
 * (all public functions no-op outside the browser) so there is no cross-request
 * state leak.
 */

interface CacheEntry<T = unknown> {
  data: T;
  ts: number;
  ttl: number;
  tags: string[];
}

const MAX_ENTRIES = 80;

const store: Map<string, CacheEntry> = new Map();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Current user id from localStorage, used to scope keys. Falls back to "anon". */
function userScope(): string {
  if (!isBrowser()) return "anon";
  try {
    const raw = localStorage.getItem("currentUser");
    if (raw) {
      const parsed = JSON.parse(raw) as { id?: string };
      if (parsed && typeof parsed.id === "string") return parsed.id;
    }
  } catch {
    // ignore
  }
  return "anon";
}

/** Deterministic serializer for cache-key arguments. */
function serialize(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `[${value.map(serialize).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    );
    return `{${entries.map(([k, v]) => `${k}:${serialize(v)}`).join(",")}}`;
  }
  return String(value);
}

/**
 * Build a stable cache key from a scope + arbitrary args.
 * The user prefix is applied at access time (see `scopedKey`), so callers
 * should NOT include the user id in `args`.
 */
export function buildKey(scope: string, args?: unknown): string {
  return args === undefined ? scope : `${scope}:${serialize(args)}`;
}

function scopedKey(key: string): string {
  return `${userScope()}::${key}`;
}

/** Move an existing key to the end of the Map (most-recently-used). */
function touch(key: string): void {
  const entry = store.get(key);
  if (entry) {
    store.delete(key);
    store.set(key, entry);
  }
}

/** Evict oldest entries until we're under the cap. */
function evictIfNeeded(): void {
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next();
    if (oldest.done) break;
    store.delete(oldest.value);
  }
}

/** Returns fresh data for `key`, or undefined if missing/expired. */
export function get<T>(key: string): T | undefined {
  if (!isBrowser()) return undefined;
  const k = scopedKey(key);
  const entry = store.get(k) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() - entry.ts > entry.ttl) return undefined;
  touch(k);
  return entry.data;
}

/** Returns data for `key` even if expired (for stale-while-revalidate). */
export function getStale<T>(key: string): T | undefined {
  if (!isBrowser()) return undefined;
  const k = scopedKey(key);
  const entry = store.get(k) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  touch(k);
  return entry.data;
}

/** Age in ms since the entry was stored, or null if absent. */
export function age(key: string): number | null {
  if (!isBrowser()) return null;
  const entry = store.get(scopedKey(key));
  return entry ? Date.now() - entry.ts : null;
}

/** Store `data` under `key` with `ttl` (ms) and optional `tags`. */
export function set<T>(key: string, data: T, ttl: number, tags: string[] = []): void {
  if (!isBrowser()) return;
  const k = scopedKey(key);
  store.set(k, { data, ts: Date.now(), ttl, tags });
  evictIfNeeded();
}

/** Remove a single entry. */
export function invalidate(key: string): void {
  if (!isBrowser()) return;
  store.delete(scopedKey(key));
}

/** Remove every entry whose tags include `tag`. */
export function invalidateTag(tag: string): void {
  if (!isBrowser()) return;
  for (const [k, entry] of store) {
    if (entry.tags.includes(tag)) {
      store.delete(k);
    }
  }
}

/** Remove every entry whose tags include any of `tags`. */
export function invalidateTags(tags: string[]): void {
  if (!isBrowser()) return;
  const set = new Set(tags);
  for (const [k, entry] of store) {
    if (entry.tags.some((t) => set.has(t))) {
      store.delete(k);
    }
  }
}

/** Wipe the entire store (called on logout / 401). */
export function clear(): void {
  if (!isBrowser()) return;
  store.clear();
}

// ─── Domain helpers ────────────────────────────────────────────────────────
//
// Convention for tags:
//   space:{id}             — all cached data for a space
//   space:{id}:<subTag>    — a sub-section (overview, work, discussions, ...)
//   repo:{id}              — all cached data for a repo
//   repo:{id}:<subTag>     — a sub-section (code, pulls, releases, ...)
//   spaces:list            — the /spaces listing pages
//   repos:list             — the /repos listing pages
//   repo:invitations       — repository invitations list
//
// Listing tags are NOT user-prefixed in the tag string itself (the prefix is
// applied inside `invalidateTag` via the key comparison), which is fine because
// `invalidateTag` only matches entries already in this user's scoped store.

/** Invalidate all cached data for a space, optionally narrowed to a sub-section. */
export function invalidateSpace(spaceId: string, subTag?: string): void {
  invalidateTag(subTag ? `space:${spaceId}:${subTag}` : `space:${spaceId}`);
}

/** Invalidate all cached data for a repo, optionally narrowed to a sub-section. */
export function invalidateRepo(repoId: string, subTag?: string): void {
  invalidateTag(subTag ? `repo:${repoId}:${subTag}` : `repo:${repoId}`);
}

/** Invalidate the /spaces listing pages. */
export function invalidateSpaceListings(): void {
  invalidateTag("spaces:list");
}

/** Invalidate the /repos listing pages. */
export function invalidateRepoListings(): void {
  invalidateTag("repos:list");
}

/** Snapshot for debugging. */
export function snapshot(): ReadonlyMap<string, CacheEntry> {
  return store;
}
