"use client";

import { useCallback, useEffect, useState } from "react";
import type { GitAccessToken } from "../types";
import * as api from "../services/tokensApi";

export function useAccessTokens() {
  const [tokens, setTokens] = useState<GitAccessToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listAccessTokens();
      setTokens(data.tokens);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tokens.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    tokens,
    loading,
    error,
    refetch: load,
  };
}
