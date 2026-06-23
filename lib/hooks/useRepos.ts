"use client";

import type {
  RepoBlobResponse,
  RepoCommit,
  RepoMember,
  RepoInvitation,
  RepoTreeEntry,
  Repository,
  SpaceRepo,
  SpaceRepoAttachment,
} from "../types";
import * as spacesApi from "../services/spacesApi";
import * as reposApi from "../services/reposApi";
import { useCachedAsync } from "./useCachedAsync";
import * as cache from "../services/requestCache";

// ─── TTL constants (ms) ──────────────────────────────────────────────────────
const TTL_STABLE = 10 * 60 * 1000; // 10 min — repo metadata, branches, tags
const TTL_MID = 5 * 60 * 1000; // 5 min — members, access, insights, releases
const TTL_VOLATILE = 60 * 1000; // 1 min — tree, readme, discussions
const TTL_CODE = 60 * 1000; // 1 min — tree/blob/commits (busted on edit)
const TTL_WORK = 45 * 1000; // 45 s — pulls + PR detail
const TTL_SHORT = 30 * 1000; // 30 s — invitations
const TTL_LIST = 60 * 1000; // 1 min — listing pages
// Commits are immutable per oid — safe to cache for the whole session.
const TTL_IMMUTABLE = 24 * 60 * 60 * 1000;

function normalizeRepoArgs(arg1: string, arg2?: string) {
  return arg2 ? { spaceId: arg1, repoId: arg2 } : { spaceId: undefined, repoId: arg1 };
}

function managedRepos(attachments: SpaceRepoAttachment[]) {
  return attachments
    .filter((attachment) => attachment.kind === "managed" && attachment.repo)
    .map((attachment) => attachment.repo as SpaceRepo);
}

export function useRepositoryList(filters?: {
  scope?: "all" | "mine" | "shared" | "starred" | "public" | "recommended";
  visibility?: "public" | "private";
  attached?: boolean;
  q?: string;
  stack?: string;
  language?: string;
  sort?: "updated" | "newest" | "stars";
  page?: number;
  limit?: number;
}) {
  const result = useCachedAsync(
    () => reposApi.listRepositories(filters),
    [
      filters?.scope,
      filters?.visibility,
      filters?.attached,
      filters?.q,
      filters?.stack,
      filters?.language,
      filters?.sort,
      filters?.page,
      filters?.limit,
    ],
    { cacheKey: cache.buildKey("repos:list", filters), ttl: TTL_LIST, tags: ["repos:list"] }
  );

  return {
    repos: (result.data as { repos: Repository[]; total?: number; page?: number; limit?: number } | null)?.repos ?? [],
    total: (result.data as { repos: Repository[]; total?: number } | null)?.total ?? 0,
    page: (result.data as { page?: number } | null)?.page ?? filters?.page ?? 1,
    limit: (result.data as { limit?: number } | null)?.limit ?? filters?.limit ?? 20,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepositoryInvitations() {
  const result = useCachedAsync(() => reposApi.listRepositoryInvitations(), [], {
    cacheKey: "repo:invitations",
    ttl: TTL_SHORT,
    tags: ["repo:invitations"],
  });
  return {
    invitations: (result.data as { invitations: RepoInvitation[] } | null)?.invitations ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useAttachments(spaceId: string) {
  const result = useCachedAsync(() => spacesApi.listAttachments(spaceId), [spaceId], {
    cacheKey: cache.buildKey(`space:${spaceId}`, "attachments"),
    ttl: 5 * 60 * 1000,
    tags: [`space:${spaceId}`, `space:${spaceId}:attachments`],
  });
  const attachments = (result.data as { attachments: SpaceRepoAttachment[] } | null)?.attachments ?? [];

  return {
    attachments,
    repos: managedRepos(attachments),
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepos(spaceId: string) {
  const { repos, attachments, loading, error, refetch } = useAttachments(spaceId);
  return { repos, attachments, loading, error, refetch };
}

export function useRepository(repoId: string) {
  const result = useCachedAsync(() => reposApi.getRepository(repoId), [repoId], {
    cacheKey: cache.buildKey(`repo:${repoId}`, "overview"),
    ttl: TTL_STABLE,
    tags: [`repo:${repoId}`, `repo:${repoId}:overview`],
  });
  return {
    repo: (result.data as { repo: Repository } | null)?.repo ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepo(arg1: string, arg2?: string) {
  const { repoId } = normalizeRepoArgs(arg1, arg2);
  return useRepository(repoId);
}

export function useRepositoryMembers(repoId: string) {
  const result = useCachedAsync(() => reposApi.listRepositoryMembers(repoId), [repoId], {
    cacheKey: cache.buildKey(`repo:${repoId}`, "members"),
    ttl: TTL_MID,
    tags: [`repo:${repoId}`, `repo:${repoId}:members`],
  });
  return {
    members: (result.data as { members: RepoMember[] } | null)?.members ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoMembers(arg1: string, arg2?: string) {
  const { repoId } = normalizeRepoArgs(arg1, arg2);
  return useRepositoryMembers(repoId);
}

export function useRepoAccess(repoId: string) {
  const result = useCachedAsync(() => reposApi.getRepositoryAccessOverview(repoId), [repoId], {
    cacheKey: cache.buildKey(`repo:${repoId}`, "access"),
    ttl: TTL_MID,
    tags: [`repo:${repoId}`, `repo:${repoId}:access`],
  });
  return {
    access: (result.data as import("../types").RepoAccessOverview | null)?.access ?? null,
    collaborators: (result.data as import("../types").RepoAccessOverview | null)?.collaborators ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoInsights(repoId: string) {
  const result = useCachedAsync(() => reposApi.getRepositoryInsights(repoId), [repoId], {
    cacheKey: cache.buildKey(`repo:${repoId}`, "insights"),
    ttl: TTL_MID,
    tags: [`repo:${repoId}`],
  });
  return {
    insights: (result.data as import("../types").RepoInsights | null) ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepositoryTree(repoId: string, ref?: string, path?: string) {
  const result = useCachedAsync(() => reposApi.getRepositoryTree(repoId, { ref, path }), [repoId, ref, path], {
    cacheKey: cache.buildKey(`repo:${repoId}:tree`, { ref, path }),
    ttl: TTL_CODE,
    tags: [`repo:${repoId}`, `repo:${repoId}:code`],
  });
  return {
    entries: (result.data as { entries: RepoTreeEntry[] } | null)?.entries ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoTree(arg1: string, arg2: string, arg3?: string, arg4?: string) {
  const { repoId } = normalizeRepoArgs(arg1, arg4 === undefined ? undefined : arg2);
  const ref = arg4 === undefined ? arg2 : arg3;
  const path = arg4 === undefined ? arg3 : arg4;
  return useRepositoryTree(repoId, ref, path);
}

export function useRepositoryBlob(repoId: string, ref: string | undefined, path: string | undefined) {
  const result = useCachedAsync(
    () => (path ? reposApi.getRepositoryBlob(repoId, { ref, path }) : Promise.resolve(null as RepoBlobResponse | null)),
    [repoId, ref, path],
    {
      // Only cache when we actually fetch (path present); a null placeholder
      // must not poison the cache for future real fetches.
      cacheKey: path ? cache.buildKey(`repo:${repoId}:blob`, { ref, path }) : undefined,
      ttl: TTL_CODE,
      tags: [`repo:${repoId}`, `repo:${repoId}:code`],
    }
  );
  return {
    blob: result.data as RepoBlobResponse | null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoBlob(arg1: string, arg2: string, arg3?: string, arg4?: string) {
  const { repoId } = normalizeRepoArgs(arg1, arg4 === undefined ? undefined : arg2);
  const ref = arg4 === undefined ? arg2 : arg3;
  const path = arg4 === undefined ? arg3 : arg4;
  return useRepositoryBlob(repoId, ref, path);
}

export function useRepositoryReadme(repoId: string, ref?: string) {
  const result = useCachedAsync(() => reposApi.getRepositoryReadme(repoId, { ref }), [repoId, ref], {
    cacheKey: cache.buildKey(`repo:${repoId}:readme`, { ref }),
    ttl: TTL_CODE,
    tags: [`repo:${repoId}`, `repo:${repoId}:code`],
  });
  return {
    readme: (result.data as { readme: RepoBlobResponse | null } | null)?.readme ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoReadme(arg1: string, arg2: string, arg3?: string) {
  const { repoId } = normalizeRepoArgs(arg1, arg3 === undefined ? undefined : arg2);
  const ref = arg3 === undefined ? arg2 : arg3;
  return useRepositoryReadme(repoId, ref);
}

export function useRepositoryCommits(repoId: string, ref?: string, path?: string, page = 1) {
  const result = useCachedAsync(
    () => reposApi.getRepositoryCommits(repoId, { ref, path, page }),
    [repoId, ref, path, page],
    {
      cacheKey: cache.buildKey(`repo:${repoId}:commits`, { ref, path, page }),
      ttl: TTL_CODE,
      tags: [`repo:${repoId}`, `repo:${repoId}:code`],
    }
  );
  return {
    commits: (result.data as { commits: RepoCommit[] } | null)?.commits ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoCommits(arg1: string, arg2: string, arg3?: string, arg4?: string, arg5?: number) {
  const { repoId } = normalizeRepoArgs(arg1, typeof arg5 === "number" ? arg2 : undefined);
  const ref = typeof arg5 === "number" ? arg3 : arg2;
  const path = typeof arg5 === "number" ? arg4 : arg3;
  const page = typeof arg5 === "number" ? arg5 : arg4 ?? 1;
  return useRepositoryCommits(repoId, ref, path, page as number);
}

// ─── Branch, Tag, Commit Detail, Release, Fork Hooks ─────────────────

export function useBranches(repoId: string) {
  const result = useCachedAsync(() => reposApi.listBranches(repoId), [repoId], {
    cacheKey: cache.buildKey(`repo:${repoId}`, "branches"),
    ttl: TTL_MID,
    tags: [`repo:${repoId}`, `repo:${repoId}:branches`],
  });
  return {
    branches: (result.data as { branches: import("../types").RepoBranch[] } | null)?.branches ?? [],
    default_branch: (result.data as { default_branch?: string } | null)?.default_branch ?? "main",
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useTags(repoId: string) {
  const result = useCachedAsync(() => reposApi.listTags(repoId), [repoId], {
    cacheKey: cache.buildKey(`repo:${repoId}`, "tags"),
    ttl: TTL_MID,
    tags: [`repo:${repoId}`, `repo:${repoId}:tags`],
  });
  return {
    tags: (result.data as { tags: import("../types").RepoTag[] } | null)?.tags ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useCommitDetail(repoId: string, oid: string | undefined) {
  const result = useCachedAsync(
    () => (oid ? reposApi.getCommitDetail(repoId, oid) : Promise.resolve(null)),
    [repoId, oid],
    {
      // Commits are immutable per oid — safe to cache long. Skip caching the
      // null placeholder when oid is absent.
      cacheKey: oid ? cache.buildKey(`repo:${repoId}:commit`, oid) : undefined,
      ttl: TTL_IMMUTABLE,
      tags: [`repo:${repoId}`],
    }
  );
  return {
    commit: (result.data as { commit: import("../types").CommitDetail } | null)?.commit ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoReleases(repoId: string) {
  const result = useCachedAsync(() => reposApi.listReleases(repoId), [repoId], {
    cacheKey: cache.buildKey(`repo:${repoId}`, "releases"),
    ttl: TTL_MID,
    tags: [`repo:${repoId}`, `repo:${repoId}:releases`],
  });
  return {
    releases: (result.data as { releases: import("../types").RepoRelease[] } | null)?.releases ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ─── Pull Requests ───────────────────────────────────────────────────

export function usePullRequests(repoId: string, state?: "open" | "closed" | "all") {
  const result = useCachedAsync(() => reposApi.listPullRequests(repoId, { state }), [repoId, state], {
    cacheKey: cache.buildKey(`repo:${repoId}:pulls`, { state }),
    ttl: TTL_WORK,
    tags: [`repo:${repoId}`, `repo:${repoId}:pulls`],
  });
  return {
    pullRequests: (result.data as import("../types").PullRequest[] | null) ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function usePullRequestHeadOptions(repoId: string) {
  const result = useCachedAsync(() => reposApi.getPullRequestHeadOptions(repoId), [repoId], {
    cacheKey: cache.buildKey(`repo:${repoId}`, "pull-head-options"),
    ttl: TTL_MID,
    tags: [`repo:${repoId}`, `repo:${repoId}:pulls`],
  });
  return {
    options: (result.data as { options: import("../types").PullRequestHeadOption[] } | null)?.options ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function usePullRequestCompare(
  repoId: string,
  params?: { base_branch?: string; head_branch?: string; head_repo_id?: string }
) {
  const enabled = Boolean(params?.base_branch && params?.head_branch);
  const result = useCachedAsync(
    () => (
      enabled
        ? reposApi.getPullRequestCompare(repoId, {
            base_branch: params?.base_branch || "",
            head_branch: params?.head_branch || "",
            head_repo_id: params?.head_repo_id,
          })
        : Promise.resolve(null)
    ),
    [repoId, params?.base_branch, params?.head_branch, params?.head_repo_id, enabled],
    {
      cacheKey: enabled ? cache.buildKey(`repo:${repoId}:pull-compare`, params) : undefined,
      ttl: TTL_WORK,
      tags: [`repo:${repoId}`, `repo:${repoId}:pulls`],
    }
  );
  return {
    comparison: (result.data as import("../types").PullRequestCompare | null) ?? null,
    loading: enabled ? result.loading : false,
    error: result.error,
    refetch: result.refetch,
  };
}

export function usePullRequest(repoId: string, number: number | string) {
  const result = useCachedAsync(() => reposApi.getPullRequest(repoId, number), [repoId, number], {
    cacheKey: cache.buildKey(`repo:${repoId}:pull`, number),
    ttl: TTL_WORK,
    tags: [`repo:${repoId}`, `repo:${repoId}:pulls`],
  });
  return {
    pullRequest: (result.data as import("../types").PullRequest | null) ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function usePullRequestDiff(repoId: string, number: number | string) {
  const result = useCachedAsync(() => reposApi.getPullRequestDiff(repoId, number), [repoId, number], {
    cacheKey: cache.buildKey(`repo:${repoId}:pull-diff`, number),
    ttl: TTL_WORK,
    tags: [`repo:${repoId}`, `repo:${repoId}:pulls`],
  });
  return {
    diff: (result.data as {
      stats: { additions: number; deletions: number; files_changed: number };
      files: import("../types").CommitDiffFile[];
    } | null) ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function usePullRequestCommits(repoId: string, number: number | string) {
  const result = useCachedAsync(() => reposApi.listPullRequestCommits(repoId, number), [repoId, number], {
    cacheKey: cache.buildKey(`repo:${repoId}:pull-commits`, number),
    ttl: TTL_WORK,
    tags: [`repo:${repoId}`, `repo:${repoId}:pulls`],
  });
  return {
    commits: (result.data as import("../types").RepoCommit[] | null) ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ─── Pull Request Reviews ────────────────────────────────────────────

export function usePullRequestReviews(repoId: string, number: number | string) {
  const result = useCachedAsync(() => reposApi.listPullRequestReviews(repoId, number), [repoId, number], {
    cacheKey: cache.buildKey(`repo:${repoId}:pull-reviews`, number),
    ttl: TTL_WORK,
    tags: [`repo:${repoId}`, `repo:${repoId}:pulls`],
  });
  return {
    reviews: (result.data as import("../types").PullRequestReview[] | null) ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ─── Pull Request Comments ───────────────────────────────────────────

export function usePullRequestComments(repoId: string, number: number | string) {
  const result = useCachedAsync(() => reposApi.listPullRequestComments(repoId, number), [repoId, number], {
    cacheKey: cache.buildKey(`repo:${repoId}:pull-comments`, number),
    ttl: TTL_WORK,
    tags: [`repo:${repoId}`, `repo:${repoId}:pulls`],
  });
  return {
    comments: (result.data as import("../types").PullRequestComment[] | null) ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoForks(repoId: string) {
  const result = useCachedAsync(() => reposApi.listForks(repoId), [repoId], {
    cacheKey: cache.buildKey(`repo:${repoId}`, "forks"),
    ttl: TTL_MID,
    tags: [`repo:${repoId}`, `repo:${repoId}:forks`],
  });
  return {
    forks: (result.data as { forks: import("../types").RepoForkEntry[] } | null)?.forks ?? [],
    fork_count: (result.data as { fork_count?: number } | null)?.fork_count ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ─── Governance & Community (Phase 3) ────────────────────────────────

export function useBranchProtectionRules(repoId: string) {
  const result = useCachedAsync(() => reposApi.listBranchProtectionRules(repoId), [repoId], {
    cacheKey: cache.buildKey(`repo:${repoId}`, "branch-protection"),
    ttl: TTL_MID,
    tags: [`repo:${repoId}`, `repo:${repoId}:branch-protection`],
  });
  return {
    rules: (result.data as import("../types").BranchProtectionRule[] | null) ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoDiscussions(repoId: string, category?: string) {
  const result = useCachedAsync(() => reposApi.listRepoDiscussions(repoId, category), [repoId, category], {
    cacheKey: cache.buildKey(`repo:${repoId}:discussions`, { category }),
    ttl: TTL_VOLATILE,
    tags: [`repo:${repoId}`, `repo:${repoId}:discussions`],
  });
  return {
    state: (result.data as import("../types").RepoDiscussionState | null) ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoDiscussion(repoId: string, discussionId: string) {
  const result = useCachedAsync(() => reposApi.getRepoDiscussion(repoId, discussionId), [repoId, discussionId], {
    cacheKey: cache.buildKey(`repo:${repoId}:discussion`, discussionId),
    ttl: TTL_VOLATILE,
    tags: [`repo:${repoId}`, `repo:${repoId}:discussions`],
  });
  return {
    state: (result.data as import("../types").RepoDiscussionState | null) ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
