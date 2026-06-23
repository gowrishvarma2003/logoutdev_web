"use client";

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
import { useCachedAsync } from "./useCachedAsync";
import * as cache from "../services/requestCache";

// ─── TTL constants (ms) ──────────────────────────────────────────────────────
// Stable overview-ish data: long TTL with SWR for instant tab re-entry.
const TTL_STABLE = 10 * 60 * 1000; // 10 min
const TTL_MID = 5 * 60 * 1000; // 5 min
// Volatile activity feeds / work lists: short TTL with SWR.
const TTL_VOLATILE = 60 * 1000; // 1 min
const TTL_WORK = 45 * 1000; // 45 s
const TTL_SHORT = 30 * 1000; // 30 s
const TTL_LIST = 60 * 1000; // 1 min for listing pages

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
  return useCachedAsync(
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
    ],
    { cacheKey: cache.buildKey("spaces:list", filters), ttl: TTL_LIST, tags: ["spaces:list"] }
  );
}

export function useSpace(spaceId: string) {
  const result = useCachedAsync(() => api.getSpace(spaceId), [spaceId], {
    cacheKey: cache.buildKey(`space:${spaceId}`, "overview"),
    ttl: TTL_STABLE,
    tags: [`space:${spaceId}`, `space:${spaceId}:overview`],
  });
  return {
    space: (result.data as { space: ProjectSpace } | null)?.space ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useStack(spaceId: string) {
  const result = useCachedAsync(() => api.getStack(spaceId), [spaceId], {
    cacheKey: cache.buildKey(`space:${spaceId}`, "stack"),
    ttl: TTL_STABLE,
    tags: [`space:${spaceId}`],
  });
  return {
    stack: (result.data as { stack: StackEntry[] } | null)?.stack ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useContributors(spaceId: string) {
  const result = useCachedAsync(() => api.getContributors(spaceId), [spaceId], {
    cacheKey: cache.buildKey(`space:${spaceId}`, "contributors"),
    ttl: TTL_MID,
    tags: [`space:${spaceId}`, `space:${spaceId}:people`],
  });
  return {
    contributors: (result.data as { contributors: SpaceMember[] } | null)?.contributors ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useFollowers(spaceId: string) {
  const result = useCachedAsync(() => api.listFollowers(spaceId), [spaceId], {
    cacheKey: cache.buildKey(`space:${spaceId}`, "followers"),
    ttl: 2 * 60 * 1000,
    tags: [`space:${spaceId}`, `space:${spaceId}:followers`],
  });
  return {
    followers: (result.data as { followers: SpaceFollower[] } | null)?.followers ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useAttachments(spaceId: string) {
  const result = useCachedAsync(() => api.listAttachments(spaceId), [spaceId], {
    cacheKey: cache.buildKey(`space:${spaceId}`, "attachments"),
    ttl: TTL_MID,
    tags: [`space:${spaceId}`, `space:${spaceId}:attachments`],
  });
  return {
    attachments: (result.data as { attachments: SpaceRepoAttachment[] } | null)?.attachments ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useJoinRequests(spaceId: string, status?: string) {
  const result = useCachedAsync(() => api.listJoinRequests(spaceId, { status }), [spaceId, status], {
    cacheKey: cache.buildKey(`space:${spaceId}:join-requests`, { status }),
    ttl: TTL_SHORT,
    tags: [`space:${spaceId}`, `space:${spaceId}:join-requests`],
  });
  return {
    requests: (result.data as { requests: JoinRequest[]; total?: number } | null)?.requests ?? [],
    total: (result.data as { requests: JoinRequest[]; total?: number } | null)?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useDiscussions(spaceId: string, page = 1) {
  const result = useCachedAsync(() => api.listDiscussions(spaceId, { page }), [spaceId, page], {
    cacheKey: cache.buildKey(`space:${spaceId}:discussions`, { page }),
    ttl: TTL_VOLATILE,
    tags: [`space:${spaceId}`, `space:${spaceId}:discussions`],
  });
  return {
    discussions: (result.data as { threads: Discussion[]; total?: number } | null)?.threads ?? [],
    total: (result.data as { threads: Discussion[]; total?: number } | null)?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useDiscussion(spaceId: string, threadId: string) {
  const result = useCachedAsync(() => api.getDiscussion(spaceId, threadId), [spaceId, threadId], {
    cacheKey: cache.buildKey(`space:${spaceId}:discussion`, threadId),
    ttl: TTL_VOLATILE,
    tags: [`space:${spaceId}`, `space:${spaceId}:discussions`],
  });
  return {
    discussion: (result.data as { thread: Discussion } | null)?.thread ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useUpdates(spaceId: string, page = 1, filters?: { work_item_id?: string; limit?: number }) {
  const result = useCachedAsync(
    () => api.listUpdates(spaceId, { page, limit: filters?.limit, work_item_id: filters?.work_item_id }),
    [spaceId, page, filters?.work_item_id, filters?.limit],
    {
      cacheKey: cache.buildKey(`space:${spaceId}:updates`, { page, work_item_id: filters?.work_item_id, limit: filters?.limit }),
      ttl: TTL_VOLATILE,
      tags: [`space:${spaceId}`, `space:${spaceId}:updates`],
    }
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
  const result = useCachedAsync(
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
    ],
    {
      cacheKey: cache.buildKey(`space:${spaceId}:work`, filters),
      ttl: TTL_WORK,
      tags: [`space:${spaceId}`, `space:${spaceId}:work`],
    }
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
  const result = useCachedAsync(() => api.getWork(spaceId, issueId), [spaceId, issueId], {
    cacheKey: cache.buildKey(`space:${spaceId}:work-item`, issueId),
    ttl: TTL_WORK,
    tags: [`space:${spaceId}`, `space:${spaceId}:work`],
  });
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
  const result = useCachedAsync(
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
    ],
    {
      cacheKey: cache.buildKey(`space:${spaceId}:work-summary`, filters),
      ttl: TTL_WORK,
      tags: [`space:${spaceId}`, `space:${spaceId}:work`],
    }
  );

  return {
    summary: (result.data as { summary: SpaceWorkSummary } | null)?.summary ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useWorkComments(spaceId: string, issueId: string) {
  const result = useCachedAsync(() => api.listWorkComments(spaceId, issueId), [spaceId, issueId], {
    cacheKey: cache.buildKey(`space:${spaceId}:work-comments`, issueId),
    ttl: TTL_WORK,
    tags: [`space:${spaceId}`, `space:${spaceId}:work`],
  });
  return {
    comments: (result.data as { comments: SpaceWorkComment[] } | null)?.comments ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useWorkActivity(spaceId: string, issueId: string, page = 1, limit = 20) {
  const result = useCachedAsync(() => api.getWorkActivity(spaceId, issueId, { page, limit }), [spaceId, issueId, page, limit], {
    cacheKey: cache.buildKey(`space:${spaceId}:work-activity`, { issueId, page, limit }),
    ttl: TTL_WORK,
    tags: [`space:${spaceId}`, `space:${spaceId}:work`],
  });
  return {
    activity: (result.data as { activity: SpaceWorkActivity[] } | null)?.activity ?? [],
    total: (result.data as { activity: SpaceWorkActivity[]; total?: number } | null)?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useMilestones(spaceId: string) {
  const result = useCachedAsync(() => api.listMilestones(spaceId), [spaceId], {
    cacheKey: cache.buildKey(`space:${spaceId}`, "milestones"),
    ttl: TTL_MID,
    tags: [`space:${spaceId}`, `space:${spaceId}:milestones`],
  });
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
  const result = useCachedAsync(() => api.getHealth(spaceId), [spaceId], {
    cacheKey: cache.buildKey(`space:${spaceId}`, "health"),
    ttl: TTL_MID,
    tags: [`space:${spaceId}`],
  });
  return {
    health: (result.data as { health: HealthScore } | null)?.health ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useDecisions(spaceId: string) {
  const result = useCachedAsync(() => api.getDecisions(spaceId), [spaceId], {
    cacheKey: cache.buildKey(`space:${spaceId}`, "decisions"),
    ttl: TTL_MID,
    tags: [`space:${spaceId}`],
  });
  return {
    decisions: (result.data as { decisions: DecisionEntry[] } | null)?.decisions ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
