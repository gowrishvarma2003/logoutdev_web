"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ProjectSpace,
  SpaceMember,
  HealthScore,
  Discussion,
  SpaceUpdate,
  SpaceIssue,
  DecisionEntry,
  JoinRequest,
  StackEntry,
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
    setState((current) => ({ ...current, loading: true, error: null }));
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

export function useSpaceList(filters?: {
  status?: string;
  visibility?: string;
  tag?: string;
  mine?: boolean;
  page?: number;
  limit?: number;
}) {
  return useAsync(
    () => api.listSpaces(filters),
    [filters?.status, filters?.visibility, filters?.tag, filters?.mine, filters?.page, filters?.limit]
  );
}

export function useSpace(spaceId: string) {
  const result = useAsync(() => api.getSpace(spaceId), [spaceId]);
  return {
    space: (result.data as { space: ProjectSpace } | null)?.space ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useStack(spaceId: string) {
  const result = useAsync(() => api.getStack(spaceId), [spaceId]);
  return {
    stack: (result.data as { stack: StackEntry[] } | null)?.stack ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useContributors(spaceId: string) {
  const result = useAsync(() => api.getContributors(spaceId), [spaceId]);
  return {
    contributors:
      (result.data as { contributors: SpaceMember[] } | null)?.contributors ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useJoinRequests(spaceId: string, status?: string) {
  const result = useAsync(
    () => api.listJoinRequests(spaceId, { status }),
    [spaceId, status]
  );
  return {
    requests:
      (result.data as { requests: JoinRequest[]; total?: number } | null)?.requests ?? [],
    total:
      (result.data as { requests: JoinRequest[]; total?: number } | null)?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useDiscussions(spaceId: string, page = 1) {
  const result = useAsync(
    () => api.listDiscussions(spaceId, { page }),
    [spaceId, page]
  );
  return {
    discussions:
      (result.data as { threads: Discussion[]; total?: number } | null)?.threads ?? [],
    total:
      (result.data as { threads: Discussion[]; total?: number } | null)?.total ?? 0,
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
    discussion: (result.data as { thread: Discussion } | null)?.thread ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useUpdates(spaceId: string, page = 1) {
  const result = useAsync(
    () => api.listUpdates(spaceId, { page }),
    [spaceId, page]
  );
  return {
    updates:
      (result.data as { updates: SpaceUpdate[]; total?: number } | null)?.updates ?? [],
    total:
      (result.data as { updates: SpaceUpdate[]; total?: number } | null)?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useIssues(
  spaceId: string,
  filters?: { status?: string; priority?: string; assignee?: string; page?: number; limit?: number }
) {
  const result = useAsync(
    () => api.listIssues(spaceId, filters),
    [spaceId, filters?.status, filters?.priority, filters?.assignee, filters?.page, filters?.limit]
  );
  return {
    issues:
      (result.data as { issues: SpaceIssue[]; total?: number } | null)?.issues ?? [],
    total:
      (result.data as { issues: SpaceIssue[]; total?: number } | null)?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useIssue(spaceId: string, issueId: string) {
  const result = useAsync(() => api.getIssue(spaceId, issueId), [spaceId, issueId]);
  return {
    issue: (result.data as { issue: SpaceIssue } | null)?.issue ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useHealth(spaceId: string) {
  const result = useAsync(() => api.getHealth(spaceId), [spaceId]);
  return {
    health: (result.data as { health: HealthScore } | null)?.health ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

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
