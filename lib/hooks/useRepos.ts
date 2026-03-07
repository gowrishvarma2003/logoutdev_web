"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  RepoBlobResponse,
  RepoCommit,
  RepoMember,
  RepoTreeEntry,
  SpaceRepo,
} from "../types";
import * as api from "../services/spacesApi";

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
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState({ data: null, loading: false, error: message });
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}

export function useRepos(spaceId: string) {
  const result = useAsync(() => api.listRepos(spaceId), [spaceId]);
  return {
    repos: (result.data as { repos: SpaceRepo[] } | null)?.repos ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepo(spaceId: string, repoId: string) {
  const result = useAsync(() => api.getRepo(spaceId, repoId), [spaceId, repoId]);
  return {
    repo: (result.data as { repo: SpaceRepo } | null)?.repo ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoMembers(spaceId: string, repoId: string) {
  const result = useAsync(() => api.listRepoMembers(spaceId, repoId), [spaceId, repoId]);
  return {
    members: (result.data as { members: RepoMember[] } | null)?.members ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoTree(spaceId: string, repoId: string, ref?: string, path?: string) {
  const result = useAsync(() => api.getRepoTree(spaceId, repoId, { ref, path }), [spaceId, repoId, ref, path]);
  return {
    entries: (result.data as { entries: RepoTreeEntry[] } | null)?.entries ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoBlob(spaceId: string, repoId: string, ref: string | undefined, path: string | undefined) {
  const result = useAsync(
    () => (path ? api.getRepoBlob(spaceId, repoId, { ref, path }) : Promise.resolve(null as RepoBlobResponse | null)),
    [spaceId, repoId, ref, path]
  );
  return {
    blob: result.data as RepoBlobResponse | null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoReadme(spaceId: string, repoId: string, ref?: string) {
  const result = useAsync(() => api.getRepoReadme(spaceId, repoId, { ref }), [spaceId, repoId, ref]);
  return {
    readme: (result.data as { readme: RepoBlobResponse | null } | null)?.readme ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoCommits(spaceId: string, repoId: string, ref?: string, path?: string, page = 1) {
  const result = useAsync(
    () => api.getRepoCommits(spaceId, repoId, { ref, path, page }),
    [spaceId, repoId, ref, path, page]
  );
  return {
    commits: (result.data as { commits: RepoCommit[] } | null)?.commits ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
