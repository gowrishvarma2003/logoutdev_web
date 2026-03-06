"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ProjectSpace,
  SpaceMember,
  HealthScore,
  Discussion,
  SpaceUpdate,
  DecisionEntry,
  JoinRequest,
  StackEntry,
} from "../types";
import * as api from "../services/spacesApi";

// ─── Generic fetch hook ──────────────────────────────────────────────────────

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
      const msg = err instanceof Error ? err.message : "Unknown error";
      setState({ data: null, loading: false, error: msg });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}

// ─── Space list (Discover) ──────────────────────────────────────────────────

export function useSpaceList(filters?: {
  status?: string;
  tag?: string;
  page?: number;
}) {
  return useAsync(
    () => api.listSpaces(filters),
    [filters?.status, filters?.tag, filters?.page]
  );
}

// ─── Single space ────────────────────────────────────────────────────────────

export function useSpace(spaceId: string) {
  const result = useAsync(() => api.getSpace(spaceId), [spaceId]);
  return {
    space: (result.data as { space: ProjectSpace } | null)?.space ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ─── Stack ───────────────────────────────────────────────────────────────────

export function useStack(spaceId: string) {
  const result = useAsync(() => api.getStack(spaceId), [spaceId]);
  return {
    stack: (result.data as { stack: StackEntry[] } | null)?.stack ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ─── Contributors ────────────────────────────────────────────────────────────

export function useContributors(spaceId: string) {
  const result = useAsync(() => api.getContributors(spaceId), [spaceId]);
  return {
    contributors:
      (result.data as { contributors: SpaceMember[] } | null)?.contributors ??
      [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ─── Join Requests ───────────────────────────────────────────────────────────

export function useJoinRequests(spaceId: string, status?: string) {
  const result = useAsync(
    () => api.listJoinRequests(spaceId, { status }),
    [spaceId, status]
  );
  return {
    requests:
      (result.data as { requests: JoinRequest[]; total?: number } | null)
        ?.requests ?? [],
    total:
      (result.data as { requests: JoinRequest[]; total?: number } | null)
        ?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ─── Discussions ─────────────────────────────────────────────────────────────

export function useDiscussions(spaceId: string, page = 1) {
  const result = useAsync(
    () => api.listDiscussions(spaceId, { page }),
    [spaceId, page]
  );
  return {
    discussions:
      (result.data as { threads: Discussion[]; total?: number } | null)
        ?.threads ?? [],
    total:
      (result.data as { threads: Discussion[]; total?: number } | null)
        ?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useDiscussion(spaceId: string, threadId: string) {
  const result = useAsync(
    () => api.getDiscussion(spaceId, threadId),
    [spaceId, threadId]
  );
  return {
    discussion:
      (result.data as { thread: Discussion } | null)?.thread ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ─── Updates ─────────────────────────────────────────────────────────────────

export function useUpdates(spaceId: string, page = 1) {
  const result = useAsync(
    () => api.listUpdates(spaceId, { page }),
    [spaceId, page]
  );
  return {
    updates:
      (result.data as { updates: SpaceUpdate[]; total?: number } | null)
        ?.updates ?? [],
    total:
      (result.data as { updates: SpaceUpdate[]; total?: number } | null)
        ?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ─── Health Score ────────────────────────────────────────────────────────────

export function useHealth(spaceId: string) {
  const result = useAsync(() => api.getHealth(spaceId), [spaceId]);
  return {
    health:
      (result.data as { health: HealthScore } | null)?.health ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ─── Decisions ───────────────────────────────────────────────────────────────

export function useDecisions(spaceId: string) {
  const result = useAsync(() => api.getDecisions(spaceId), [spaceId]);
  return {
    decisions:
      (result.data as { decisions: DecisionEntry[] } | null)?.decisions ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
