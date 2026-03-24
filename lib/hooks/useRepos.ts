"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  RepoBlobResponse,
  RepoCommit,
  RepoMember,
  RepoTreeEntry,
  Repository,
  SpaceRepo,
  SpaceRepoAttachment,
} from "../types";
import * as spacesApi from "../services/spacesApi";
import * as reposApi from "../services/reposApi";

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
        const message = err instanceof Error ? err.message : "Unknown error";
        if (!cancelled) {
          setState({ data: null, loading: false, error: message });
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

function normalizeRepoArgs(arg1: string, arg2?: string) {
  return arg2 ? { spaceId: arg1, repoId: arg2 } : { spaceId: undefined, repoId: arg1 };
}

function managedRepos(attachments: SpaceRepoAttachment[]) {
  return attachments
    .filter((attachment) => attachment.kind === "managed" && attachment.repo)
    .map((attachment) => attachment.repo as SpaceRepo);
}

export function useRepositoryList(filters?: {
  scope?: "all" | "mine" | "shared" | "public";
  visibility?: "public" | "private";
  attached?: boolean;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const result = useAsync(
    () => reposApi.listRepositories(filters),
    [filters?.scope, filters?.visibility, filters?.attached, filters?.q, filters?.page, filters?.limit]
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

export function useAttachments(spaceId: string) {
  const result = useAsync(() => spacesApi.listAttachments(spaceId), [spaceId]);
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
  const result = useAsync(() => reposApi.getRepository(repoId), [repoId]);
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
  const result = useAsync(() => reposApi.listRepositoryMembers(repoId), [repoId]);
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
  const result = useAsync(() => reposApi.getRepositoryAccessOverview(repoId), [repoId]);
  return {
    access: (result.data as import("../types").RepoAccessOverview | null)?.access ?? null,
    collaborators: (result.data as import("../types").RepoAccessOverview | null)?.collaborators ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoInsights(repoId: string) {
  const result = useAsync(() => reposApi.getRepositoryInsights(repoId), [repoId]);
  return {
    insights: (result.data as import("../types").RepoInsights | null) ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepositoryTree(repoId: string, ref?: string, path?: string) {
  const result = useAsync(() => reposApi.getRepositoryTree(repoId, { ref, path }), [repoId, ref, path]);
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
  const result = useAsync(
    () => (path ? reposApi.getRepositoryBlob(repoId, { ref, path }) : Promise.resolve(null as RepoBlobResponse | null)),
    [repoId, ref, path]
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
  const result = useAsync(() => reposApi.getRepositoryReadme(repoId, { ref }), [repoId, ref]);
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
  const result = useAsync(
    () => reposApi.getRepositoryCommits(repoId, { ref, path, page }),
    [repoId, ref, path, page]
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
  const result = useAsync(() => reposApi.listBranches(repoId), [repoId]);
  return {
    branches: (result.data as { branches: import("../types").RepoBranch[] } | null)?.branches ?? [],
    default_branch: (result.data as { default_branch?: string } | null)?.default_branch ?? "main",
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useTags(repoId: string) {
  const result = useAsync(() => reposApi.listTags(repoId), [repoId]);
  return {
    tags: (result.data as { tags: import("../types").RepoTag[] } | null)?.tags ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useCommitDetail(repoId: string, oid: string | undefined) {
  const result = useAsync(
    () => (oid ? reposApi.getCommitDetail(repoId, oid) : Promise.resolve(null)),
    [repoId, oid]
  );
  return {
    commit: (result.data as { commit: import("../types").CommitDetail } | null)?.commit ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoReleases(repoId: string) {
  const result = useAsync(() => reposApi.listReleases(repoId), [repoId]);
  return {
    releases: (result.data as { releases: import("../types").RepoRelease[] } | null)?.releases ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ─── Pull Requests ───────────────────────────────────────────────────

export function usePullRequests(repoId: string, state?: "open" | "closed" | "all") {
  const result = useAsync(() => reposApi.listPullRequests(repoId, { state }), [repoId, state]);
  return {
    pullRequests: (result.data as import("../types").PullRequest[] | null) ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function usePullRequestHeadOptions(repoId: string) {
  const result = useAsync(() => reposApi.getPullRequestHeadOptions(repoId), [repoId]);
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
  const result = useAsync(
    () => (
      enabled
        ? reposApi.getPullRequestCompare(repoId, {
            base_branch: params?.base_branch || "",
            head_branch: params?.head_branch || "",
            head_repo_id: params?.head_repo_id,
          })
        : Promise.resolve(null)
    ),
    [repoId, params?.base_branch, params?.head_branch, params?.head_repo_id, enabled]
  );
  return {
    comparison: (result.data as import("../types").PullRequestCompare | null) ?? null,
    loading: enabled ? result.loading : false,
    error: result.error,
    refetch: result.refetch,
  };
}

export function usePullRequest(repoId: string, number: number | string) {
  const result = useAsync(() => reposApi.getPullRequest(repoId, number), [repoId, number]);
  return {
    pullRequest: (result.data as import("../types").PullRequest | null) ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function usePullRequestDiff(repoId: string, number: number | string) {
  const result = useAsync(() => reposApi.getPullRequestDiff(repoId, number), [repoId, number]);
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
  const result = useAsync(() => reposApi.listPullRequestCommits(repoId, number), [repoId, number]);
  return {
    commits: (result.data as import("../types").RepoCommit[] | null) ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ─── Pull Request Reviews ────────────────────────────────────────────

export function usePullRequestReviews(repoId: string, number: number | string) {
  const result = useAsync(() => reposApi.listPullRequestReviews(repoId, number), [repoId, number]);
  return {
    reviews: (result.data as import("../types").PullRequestReview[] | null) ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ─── Pull Request Comments ───────────────────────────────────────────

export function usePullRequestComments(repoId: string, number: number | string) {
  const result = useAsync(() => reposApi.listPullRequestComments(repoId, number), [repoId, number]);
  return {
    comments: (result.data as import("../types").PullRequestComment[] | null) ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoForks(repoId: string) {
  const result = useAsync(() => reposApi.listForks(repoId), [repoId]);
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
  const result = useAsync(() => reposApi.listBranchProtectionRules(repoId), [repoId]);
  return {
    rules: (result.data as import("../types").BranchProtectionRule[] | null) ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoDiscussions(repoId: string, category?: string) {
  const result = useAsync(() => reposApi.listRepoDiscussions(repoId, category), [repoId, category]);
  return {
    state: (result.data as import("../types").RepoDiscussionState | null) ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useRepoDiscussion(repoId: string, discussionId: string) {
  const result = useAsync(() => reposApi.getRepoDiscussion(repoId, discussionId), [repoId, discussionId]);
  return {
    state: (result.data as import("../types").RepoDiscussionState | null) ?? null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
