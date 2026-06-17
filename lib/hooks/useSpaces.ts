"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ProjectSpace,
  SpaceMember,
  HealthScore,
  Discussion,
  SpaceUpdate,
  SpaceIssue,
  SpaceWorkItem,
  DecisionEntry,
  JoinRequest,
  StackEntry,
  SpaceFollower,
  SpaceRepoAttachment,
  SpaceIssueStatus,
  SpaceIssuePriority,
  WorkItemType,
  SpaceWorkSummary,
  SpaceWorkComment,
  SpaceWorkActivity,
  SpaceMilestone,
  WorkSort,
  WorkDueState,
  WorkReadiness,
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
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const data = await fetcher();
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (!cancelled) {
          setState({ data: null, loading: false, error: msg });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, ...deps]);

  const refetch = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return { ...state, refetch };
}

export function useSpaceList(filters?: {
  status?: string;
  visibility?: string;
  tag?: string;
  needed_skill?: string;
  working_in_public?: boolean;
  looking_for_contributors?: boolean;
  good_first_tasks?: boolean;
  recently_shipped?: boolean;
  mine?: boolean;
  followed?: boolean;
  working?: boolean;
  page?: number;
  limit?: number;
}) {
  return useAsync(
    () => api.listSpaces(filters),
    [
      filters?.status,
      filters?.visibility,
      filters?.tag,
      filters?.needed_skill,
      filters?.working_in_public,
      filters?.looking_for_contributors,
      filters?.good_first_tasks,
      filters?.recently_shipped,
      filters?.mine,
      filters?.followed,
      filters?.working,
      filters?.page,
      filters?.limit,
    ]
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
    contributors: (result.data as { contributors: SpaceMember[] } | null)?.contributors ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useFollowers(spaceId: string) {
  const result = useAsync(() => api.listFollowers(spaceId), [spaceId]);
  return {
    followers: (result.data as { followers: SpaceFollower[] } | null)?.followers ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useAttachments(spaceId: string) {
  const result = useAsync(() => api.listAttachments(spaceId), [spaceId]);
  return {
    attachments: (result.data as { attachments: SpaceRepoAttachment[] } | null)?.attachments ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useJoinRequests(spaceId: string, status?: string) {
  const result = useAsync(() => api.listJoinRequests(spaceId, { status }), [spaceId, status]);
  return {
    requests: (result.data as { requests: JoinRequest[]; total?: number } | null)?.requests ?? [],
    total: (result.data as { requests: JoinRequest[]; total?: number } | null)?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useDiscussions(spaceId: string, page = 1) {
  const result = useAsync(() => api.listDiscussions(spaceId, { page }), [spaceId, page]);
  return {
    discussions: (result.data as { threads: Discussion[]; total?: number } | null)?.threads ?? [],
    total: (result.data as { threads: Discussion[]; total?: number } | null)?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useDiscussion(spaceId: string, threadId: string) {
  const result = useAsync(() => api.getDiscussion(spaceId, threadId), [spaceId, threadId]);
  return {
    discussion: (result.data as { thread: Discussion } | null)?.thread ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useUpdates(spaceId: string, page = 1, filters?: { work_item_id?: string; limit?: number }) {
  const result = useAsync(
    () => api.listUpdates(spaceId, { page, limit: filters?.limit, work_item_id: filters?.work_item_id }),
    [spaceId, page, filters?.work_item_id, filters?.limit]
  );
  return {
    updates: (result.data as { updates: SpaceUpdate[]; total?: number } | null)?.updates ?? [],
    total: (result.data as { updates: SpaceUpdate[]; total?: number } | null)?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useWork(
  spaceId: string,
  filters?: {
    status?: SpaceIssueStatus;
    priority?: SpaceIssuePriority;
    assignee?: string;
    type?: WorkItemType;
    repo_id?: string;
    needed_skill?: string;
    good_first?: boolean;
    help_wanted?: boolean;
    blocked?: boolean;
    q?: string;
    sort?: WorkSort;
    due_state?: WorkDueState;
    stale?: boolean;
    readiness?: WorkReadiness;
    page?: number;
    limit?: number;
  }
) {
  const result = useAsync(
    () => api.listWork(spaceId, filters),
    [
      spaceId,
      filters?.status,
      filters?.priority,
      filters?.assignee,
      filters?.type,
      filters?.repo_id,
      filters?.needed_skill,
      filters?.good_first,
      filters?.help_wanted,
      filters?.blocked,
      filters?.q,
      filters?.sort,
      filters?.due_state,
      filters?.stale,
      filters?.readiness,
      filters?.page,
      filters?.limit,
    ]
  );
  return {
    issues: (result.data as { issues: SpaceWorkItem[]; total?: number } | null)?.issues ?? [],
    total: (result.data as { issues: SpaceWorkItem[]; total?: number } | null)?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useWorkItem(spaceId: string, issueId: string) {
  const result = useAsync(() => api.getWork(spaceId, issueId), [spaceId, issueId]);
  return {
    issue: (result.data as { issue: SpaceWorkItem } | null)?.issue ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useWorkSummary(
  spaceId: string,
  filters?: {
    status?: SpaceIssueStatus;
    priority?: SpaceIssuePriority;
    assignee?: string;
    type?: WorkItemType;
    repo_id?: string;
    needed_skill?: string;
    good_first?: boolean;
    help_wanted?: boolean;
    blocked?: boolean;
    q?: string;
    sort?: WorkSort;
    due_state?: WorkDueState;
    stale?: boolean;
    readiness?: WorkReadiness;
  }
) {
  const result = useAsync(
    () => api.getWorkSummary(spaceId, filters),
    [
      spaceId,
      filters?.status,
      filters?.priority,
      filters?.assignee,
      filters?.type,
      filters?.repo_id,
      filters?.needed_skill,
      filters?.good_first,
      filters?.help_wanted,
      filters?.blocked,
      filters?.q,
      filters?.sort,
      filters?.due_state,
      filters?.stale,
      filters?.readiness,
    ]
  );

  return {
    summary: (result.data as { summary: SpaceWorkSummary } | null)?.summary ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useWorkComments(spaceId: string, issueId: string) {
  const result = useAsync(() => api.listWorkComments(spaceId, issueId), [spaceId, issueId]);
  return {
    comments: (result.data as { comments: SpaceWorkComment[] } | null)?.comments ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useWorkActivity(spaceId: string, issueId: string, page = 1, limit = 20) {
  const result = useAsync(() => api.getWorkActivity(spaceId, issueId, { page, limit }), [spaceId, issueId, page, limit]);
  return {
    activity: (result.data as { activity: SpaceWorkActivity[] } | null)?.activity ?? [],
    total: (result.data as { activity: SpaceWorkActivity[]; total?: number } | null)?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useMilestones(spaceId: string) {
  const result = useAsync(() => api.listMilestones(spaceId), [spaceId]);
  return {
    milestones: (result.data as { milestones: SpaceMilestone[] } | null)?.milestones ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useIssues(
  spaceId: string,
  filters?: {
    status?: SpaceIssueStatus;
    priority?: SpaceIssuePriority;
    assignee?: string;
    type?: WorkItemType;
    repo_id?: string;
    needed_skill?: string;
    good_first?: boolean;
    help_wanted?: boolean;
    blocked?: boolean;
    q?: string;
    sort?: WorkSort;
    due_state?: WorkDueState;
    stale?: boolean;
    readiness?: WorkReadiness;
    page?: number;
    limit?: number;
  }
) {
  const result = useWork(spaceId, filters);
  return {
    issues: result.issues as SpaceIssue[],
    total: result.total,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useIssue(spaceId: string, issueId: string) {
  const result = useWorkItem(spaceId, issueId);
  return {
    issue: result.issue as SpaceIssue | null,
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
    decisions: (result.data as { decisions: DecisionEntry[] } | null)?.decisions ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
