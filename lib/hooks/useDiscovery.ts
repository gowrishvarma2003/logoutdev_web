"use client";

import { useCallback, useEffect, useState } from "react";
import type { DiscoveryResult } from "../types";
import { getDiscovery, type DiscoveryFilters } from "../services/discoveryApi";

export function useDiscovery(filters: DiscoveryFilters, enabled = true) {
  const [data, setData] = useState<DiscoveryResult | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const next = await getDiscovery(filters);
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch discovery.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, filters.collab, filters.q, filters.sort, filters.stack, filters.status, filters.tag, filters.type]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    refetch: load,
  };
}