"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as cache from "../services/requestCache";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface CachedAsyncConfig {
  /**
   * Stable cache key. Omit to disable caching for this hook (behaves like the
   * original useAsync). When provided, the key should already be built via
   * `cache.buildKey(...)` and must NOT include the user id (the store scopes
   * keys by user internally).
   */
  cacheKey?: string;
  /** Time-to-live in ms. Default 60_000. Ignored if `cacheKey` is unset. */
  ttl?: number;
  /** Tags for grouped invalidation. Ignored if `cacheKey` is unset. */
  tags?: string[];
  /**
   * If true (default), serve a stale entry immediately on mount while kicking
   * off a background refetch that silently updates state. If false, a stale
   * entry is treated as a miss (refetch with loading=true).
   */
  swr?: boolean;
  /** If false, the hook does nothing (data stays null, loading false). */
  enabled?: boolean;
}

type Result<T> = AsyncState<T> & { refetch: () => void };

const DEFAULT_TTL = 60_000;

/**
 * Cache-aware replacement for the duplicated `useAsync` hooks across
 * useSpaces / useRepos / useProfile.
 *
 * Mount / dependency-change behavior when `cacheKey` is set:
 *  1. Fresh entry exists → return it instantly, loading=false, no network call.
 *  2. Stale entry exists & swr=true → return stale instantly (loading=false),
 *     fetch in the background, and silently swap in the new data on success.
 *  3. No entry (or swr=false & stale) → fetch with loading=true as before.
 *
 * On a successful fetch the result is written to the cache. Errors are never
 * cached. `refetch()` always bypasses the cache (forces a network call) and
 * updates the cache on success.
 */
export function useCachedAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  config: CachedAsyncConfig = {}
): Result<T> {
  const { cacheKey, ttl = DEFAULT_TTL, tags = [], swr = true, enabled = true } = config;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  // Tracks whether the initial hydration has settled, so background SWR
  // updates don't flip loading back on.
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      hydratedRef.current = false;
      setState({ data: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    // 1. Try a fresh cache hit first.
    if (cacheKey) {
      const fresh = cache.get<T>(cacheKey);
      if (fresh !== undefined) {
        hydratedRef.current = true;
        setState({ data: fresh, loading: false, error: null });
        return () => {
          cancelled = true;
        };
      }

      // 2. Stale entry + SWR: show stale immediately, refetch in background.
      if (swr) {
        const stale = cache.getStale<T>(cacheKey);
        if (stale !== undefined) {
          hydratedRef.current = true;
          setState({ data: stale, loading: false, error: null });
          // Fall through to a background refetch (no loading flag).
          void runFetch(true);
          return () => {
            cancelled = true;
          };
        }
      }
    }

    // 3. Miss: fetch with loading=true.
    hydratedRef.current = false;
    setState((current) => ({ data: current.data, loading: true, error: null }));
    void runFetch(false);

    async function runFetch(background: boolean) {
      try {
        const data = await fetcher();
        if (cancelled) return;
        if (cacheKey) cache.set(cacheKey, data, ttl, tags);
        setState({ data, loading: false, error: null });
      } catch (err: unknown) {
        if (cancelled) return;
        // Never cache errors. On a background SWR failure, keep the stale
        // data visible rather than blanking the UI.
        if (background) {
          setState((current) =>
            current.data !== null ? { data: current.data, loading: false, error: null } : {
              data: null,
              loading: false,
              error: err instanceof Error ? err.message : "Unknown error",
            }
          );
        } else {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, cacheKey, enabled, ttl, swr, JSON.stringify(tags), ...deps]);

  const refetch = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return { ...state, refetch };
}
