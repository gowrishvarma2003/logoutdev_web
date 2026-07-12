"use client";

import { useCallback, useEffect, useState } from "react";
import { opportunitiesApi, type OpportunityProfile } from "@/lib/services/opportunitiesApi";

export function useOpportunityProfile() {
  const [profile, setProfile] = useState<OpportunityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await opportunitiesApi.getProfile());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load opportunity profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, setProfile, loading, error, refetch };
}
