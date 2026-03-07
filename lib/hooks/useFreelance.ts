"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  FreelanceProject,
  FreelanceProposal,
} from "../types";
import * as api from "../services/freelanceApi";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

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

export function useFreelanceProjects(filters?: {
  q?: string;
  skill?: string;
  pricing_model?: string;
  experience_level?: string;
  engagement_type?: string;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const result = useAsync(() => api.listFreelanceProjects(filters), [
    filters?.q,
    filters?.skill,
    filters?.pricing_model,
    filters?.experience_level,
    filters?.engagement_type,
    filters?.status,
    filters?.sort,
    filters?.page,
    filters?.limit,
  ]);

  return {
    projects: result.data?.projects ?? [],
    total: result.data?.total ?? 0,
    page: result.data?.page ?? filters?.page ?? 1,
    limit: result.data?.limit ?? filters?.limit ?? 20,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useFreelanceProject(projectId: string) {
  const result = useAsync(() => api.getFreelanceProject(projectId), [projectId]);
  return {
    project: result.data?.project ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useProjectProposals(projectId: string, page = 1) {
  const result = useAsync(() => api.listProjectProposals(projectId, page), [projectId, page]);
  return {
    proposals: result.data?.proposals ?? [],
    total: result.data?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useMyFreelanceProjects() {
  const result = useAsync(() => api.getMyFreelanceProjects(), []);
  return {
    projects: result.data?.projects ?? [],
    total: result.data?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useMyFreelanceProposals() {
  const result = useAsync(() => api.getMyFreelanceProposals(), []);
  return {
    proposals: result.data?.proposals ?? [],
    total: result.data?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
