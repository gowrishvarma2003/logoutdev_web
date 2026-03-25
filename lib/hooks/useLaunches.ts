"use client";

import { useCallback, useEffect, useState } from "react";
import type { LaunchBetaRegistration, LaunchFeedbackItem, LaunchReview } from "../types";
import * as api from "../services/launchesApi";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState({ data: null, loading: false, error: message });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}

export function useLaunches(filters?: {
  q?: string;
  product_type?: string;
  development_stage?: string;
  launch_phase?: string;
  stack?: string;
  seeking_collaborators?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const result = useAsync(() => api.listLaunches(filters), [
    filters?.q,
    filters?.product_type,
    filters?.development_stage,
    filters?.launch_phase,
    filters?.stack,
    filters?.seeking_collaborators,
    filters?.sort,
    filters?.page,
    filters?.limit,
  ]);

  return {
    launches: result.data?.launches ?? [],
    total: result.data?.total ?? 0,
    page: result.data?.page ?? filters?.page ?? 1,
    limit: result.data?.limit ?? filters?.limit ?? 20,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useMyLaunches() {
  const result = useAsync(() => api.getMyLaunches(), []);
  return {
    launches: result.data?.launches ?? [],
    total: result.data?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useLaunch(launchId: string) {
  const result = useAsync(() => api.getLaunch(launchId), [launchId]);
  return {
    launch: result.data?.launch ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useLaunchReviews(launchId: string, page = 1) {
  const result = useAsync(() => api.listLaunchReviews(launchId, page), [launchId, page]);
  return {
    reviews: result.data?.reviews ?? ([] as LaunchReview[]),
    total: result.data?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useLaunchFeedback(
  launchId: string,
  filters?: { type?: string; status?: string; page?: number; limit?: number }
) {
  const result = useAsync(() => api.listLaunchFeedback(launchId, filters), [
    launchId,
    filters?.type,
    filters?.status,
    filters?.page,
    filters?.limit,
  ]);

  return {
    feedback: result.data?.feedback ?? ([] as LaunchFeedbackItem[]),
    total: result.data?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useLaunchBetaRegistrations(launchId: string, enabled = true) {
  const result = useAsync(
    () => (enabled ? api.listBetaRegistrations(launchId) : Promise.resolve({ registrations: [] as LaunchBetaRegistration[] })),
    [launchId, enabled]
  );

  return {
    registrations: result.data?.registrations ?? ([] as LaunchBetaRegistration[]),
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
