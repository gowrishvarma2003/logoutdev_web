import type {
  RepoAccessOverview,
  RepoCollaboratorCandidate,
  Repository,
  RepoMember,
  RepoTreeResponse,
  RepoBlobResponse,
  RepoReadmeResponse,
  RepoCommitResponse,
  RepoInsights,
  RepoRole,
  SpaceRepoAttachment,
  RepositoryVisibility,
  RepoDiscussionState,
  RepoAiDocStatus,
  RepoAiDocRun,
  RepoAiPolicy,
  RepoAiIssue,
  RepoAiDetectionSummary,
  RepoAiProductResponse,
  RepoAiProductHistoryResponse,
} from "../types";
import { API_BASE_URL } from "../apiBaseUrl";

const API = API_BASE_URL;

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleRes<T>(res: Response): Promise<T> {
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

function qs(params: Record<string, string | number | undefined | boolean>): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== "");
  if (!entries.length) return "";
  return `?${entries.map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join("&")}`;
}

export async function listRepositories(filters?: {
  scope?: "all" | "mine" | "shared" | "public";
  visibility?: RepositoryVisibility;
  attached?: boolean;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<{ repos: Repository[]; page: number; limit: number; total?: number }> {
  const res = await fetch(
    `${API}/api/repos${qs({
      scope: filters?.scope,
      visibility: filters?.visibility,
      attached: filters?.attached,
      q: filters?.q,
      page: filters?.page,
      limit: filters?.limit,
    })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function createRepository(body: {
  name: string;
  description?: string;
  default_branch?: string;
  visibility?: RepositoryVisibility;
  space_id?: string;
}): Promise<{ repo: Repository }> {
  const res = await fetch(`${API}/api/repos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function getRepository(repoId: string): Promise<{ repo: Repository }> {
  const res = await fetch(`${API}/api/repos/${repoId}`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function updateRepository(
  repoId: string,
  body: Partial<{
    name: string;
    description: string;
    slug: string;
    default_branch: string;
    visibility: RepositoryVisibility;
  }>
): Promise<{ repo: Repository }> {
  const res = await fetch(`${API}/api/repos/${repoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function archiveRepository(repoId: string): Promise<{ archived: boolean }> {
  const res = await fetch(`${API}/api/repos/${repoId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function listRepositoryMembers(repoId: string): Promise<{ members: RepoMember[] }> {
  const res = await fetch(`${API}/api/repos/${repoId}/members`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function upsertRepositoryMember(
  repoId: string,
  userId: string,
  role: RepoRole
): Promise<{ member: RepoMember }> {
  const res = await fetch(`${API}/api/repos/${repoId}/members/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ role }),
  });
  return handleRes(res);
}

export async function removeRepositoryMember(repoId: string, userId: string): Promise<{ removed: boolean }> {
  const res = await fetch(`${API}/api/repos/${repoId}/members/${userId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function getRepositoryAccessOverview(repoId: string): Promise<RepoAccessOverview> {
  const res = await fetch(`${API}/api/repos/${repoId}/access`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function searchRepositoryCollaborators(
  repoId: string,
  q: string
): Promise<{ users: RepoCollaboratorCandidate[] }> {
  const res = await fetch(`${API}/api/repos/${repoId}/collaborators/search${qs({ q })}`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function getRepositoryInsights(repoId: string): Promise<RepoInsights> {
  const res = await fetch(`${API}/api/repos/${repoId}/insights`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function getRepositoryAiDocStatus(repoId: string): Promise<RepoAiDocStatus> {
  const res = await fetch(`${API}/api/repos/${repoId}/ai-doc`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function getRepositoryAiDocRuns(repoId: string): Promise<{ repo_id: string; runs: RepoAiDocRun[] }> {
  const res = await fetch(`${API}/api/repos/${repoId}/ai-doc/runs`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function getRepositoryAiProduct(repoId: string): Promise<RepoAiProductResponse> {
  const res = await fetch(`${API}/api/repos/${repoId}/ai-team/product`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function getRepositoryAiProductHistory(
  repoId: string,
  params?: { limit?: number }
): Promise<RepoAiProductHistoryResponse> {
  const res = await fetch(`${API}/api/repos/${repoId}/ai-team/product/history${qs({ limit: params?.limit })}`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function getRepositoryAiSettings(repoId: string): Promise<{ policy: RepoAiPolicy }> {
  const res = await fetch(`${API}/api/repos/${repoId}/ai-team/settings`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function updateRepositoryAiSettings(
  repoId: string,
  body: Partial<RepoAiPolicy>
): Promise<{ policy: RepoAiPolicy }> {
  const res = await fetch(`${API}/api/repos/${repoId}/ai-team/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function getRepositoryAiDetectionSummary(repoId: string): Promise<RepoAiDetectionSummary> {
  const res = await fetch(`${API}/api/repos/${repoId}/ai-team/detection`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function getRepositoryAiReviewSummary(
  repoId: string
): Promise<import("../types").RepoAiReviewSummaryResponse> {
  const res = await fetch(`${API}/api/repos/${repoId}/ai-team/review`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function listRepositoryAiIssues(
  repoId: string,
  params?: {
    status?: string;
    severity?: string;
    classification?: string;
    confidence_band?: string;
    related_feature_id?: string;
    origin_agent?: string;
    detection_source?: string;
    auto_fixable?: boolean;
    safe_autofix_candidate?: boolean;
    q?: string;
    limit?: number;
  }
): Promise<{ repo_id: string; issues: RepoAiIssue[] }> {
  const res = await fetch(`${API}/api/repos/${repoId}/issues${qs({
    status: params?.status,
    severity: params?.severity,
    classification: params?.classification,
    confidence_band: params?.confidence_band,
    related_feature_id: params?.related_feature_id,
    origin_agent: params?.origin_agent,
    detection_source: params?.detection_source,
    auto_fixable: params?.auto_fixable,
    safe_autofix_candidate: params?.safe_autofix_candidate,
    q: params?.q,
    limit: params?.limit,
  })}`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function ensureRepositoryAiDoc(
  repoId: string,
  body?: { source_branch?: string; trigger?: string }
): Promise<{ job_id: string; status: string; deduplicated?: boolean }> {
  const res = await fetch(`${API}/api/repos/${repoId}/ai-doc/ensure`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body ?? {}),
  });
  return handleRes(res);
}

export async function regenerateRepositoryAiDoc(
  repoId: string,
  body?: { source_branch?: string }
): Promise<{ job_id: string; status: string; deduplicated?: boolean }> {
  const res = await fetch(`${API}/api/repos/${repoId}/ai-doc/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body ?? {}),
  });
  return handleRes(res);
}

export async function getRepositoryTree(
  repoId: string,
  params?: { ref?: string; path?: string }
): Promise<RepoTreeResponse> {
  const res = await fetch(`${API}/api/repos/${repoId}/tree${qs({ ref: params?.ref, path: params?.path })}`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function getRepositoryBlob(
  repoId: string,
  params: { ref?: string; path: string }
): Promise<RepoBlobResponse> {
  const res = await fetch(`${API}/api/repos/${repoId}/blob${qs({ ref: params?.ref, path: params.path })}`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function getRepositoryReadme(
  repoId: string,
  params?: { ref?: string }
): Promise<RepoReadmeResponse> {
  const res = await fetch(`${API}/api/repos/${repoId}/readme${qs({ ref: params?.ref })}`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function getRepositoryCommits(
  repoId: string,
  params?: { ref?: string; path?: string; page?: number; limit?: number }
): Promise<RepoCommitResponse> {
  const res = await fetch(
    `${API}/api/repos/${repoId}/commits${qs({
      ref: params?.ref,
      path: params?.path,
      page: params?.page,
      limit: params?.limit,
    })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function getRepositoryAttachment(repoId: string): Promise<{ attachment: SpaceRepoAttachment | null }> {
  const res = await fetch(`${API}/api/repos/${repoId}/attachment`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function setRepositoryAttachment(
  repoId: string,
  body: {
    space_id: string;
    label?: string;
    is_primary?: boolean;
  }
): Promise<{ attachment: SpaceRepoAttachment }> {
  const res = await fetch(`${API}/api/repos/${repoId}/attachment`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function removeRepositoryAttachment(repoId: string): Promise<{ removed: boolean }> {
  const res = await fetch(`${API}/api/repos/${repoId}/attachment`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

// ─── Branches ────────────────────────────────────────────────────────

export async function listBranches(repoId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/branches`, { headers: { ...authHeaders() } });
  return handleRes<{ branches: import("../types").RepoBranch[]; default_branch: string }>(res);
}

export async function createBranch(repoId: string, body: { name: string; start_point?: string }) {
  const res = await fetch(`${API}/api/repos/${repoId}/branches`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes<{ branch: { name: string; start_point: string } }>(res);
}

export async function deleteBranch(repoId: string, name: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/branches/${encodeURIComponent(name)}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes<{ deleted: boolean }>(res);
}

// ─── Tags ────────────────────────────────────────────────────────────

export async function listTags(repoId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/tags`, { headers: { ...authHeaders() } });
  return handleRes<{ tags: import("../types").RepoTag[] }>(res);
}

export async function createTag(repoId: string, body: { name: string; ref?: string; message?: string }) {
  const res = await fetch(`${API}/api/repos/${repoId}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes<{ tag: { name: string; ref: string } }>(res);
}

export async function deleteTag(repoId: string, name: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/tags/${encodeURIComponent(name)}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes<{ deleted: boolean }>(res);
}

// ─── Commit Detail ───────────────────────────────────────────────────

export async function getCommitDetail(repoId: string, oid: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/commits/${encodeURIComponent(oid)}`, {
    headers: { ...authHeaders() },
  });
  return handleRes<{ commit: import("../types").CommitDetail }>(res);
}

// ─── File Editing ────────────────────────────────────────────────────

export async function writeFileContent(
  repoId: string,
  body: { branch?: string; path: string; content: string; message: string }
) {
  const res = await fetch(`${API}/api/repos/${repoId}/contents`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes<{ commit: { oid: string; path: string } }>(res);
}

export async function deleteFileContent(
  repoId: string,
  body: { branch?: string; path: string; message: string }
) {
  const res = await fetch(`${API}/api/repos/${repoId}/contents`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes<{ commit: { oid: string; path: string } }>(res);
}

// ─── Stars ───────────────────────────────────────────────────────────

export async function toggleStar(repoId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/star`, {
    method: "PUT",
    headers: { ...authHeaders() },
  });
  return handleRes<{ starred: boolean; star_count: number }>(res);
}

export async function unstar(repoId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/star`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes<{ starred: boolean; star_count: number }>(res);
}

export async function listStargazers(repoId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/stars`, { headers: { ...authHeaders() } });
  return handleRes<{ stargazers: import("../types").User[]; star_count: number }>(res);
}

// ─── Watch ───────────────────────────────────────────────────────────

export async function setWatch(repoId: string, level: "all" | "releases" | "ignore" = "all") {
  const res = await fetch(`${API}/api/repos/${repoId}/watch`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ level }),
  });
  return handleRes<{ watching: boolean; level: string; watcher_count: number }>(res);
}

export async function unwatch(repoId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/watch`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes<{ watching: boolean; watcher_count: number }>(res);
}

// ─── Forks ───────────────────────────────────────────────────────────

export async function forkRepository(repoId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/forks`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleRes<{ repo: import("../types").Repository; fork: { source_repo_id: string } }>(res);
}

export async function listForks(repoId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/forks`, { headers: { ...authHeaders() } });
  return handleRes<{ forks: import("../types").RepoForkEntry[]; fork_count: number }>(res);
}

// ─── Releases ────────────────────────────────────────────────────────

export async function listReleases(repoId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/releases`, { headers: { ...authHeaders() } });
  return handleRes<{ releases: import("../types").RepoRelease[] }>(res);
}

export async function createRelease(
  repoId: string,
  body: { tag_name: string; title: string; body?: string; is_prerelease?: boolean; is_draft?: boolean }
) {
  const res = await fetch(`${API}/api/repos/${repoId}/releases`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes<{ release: import("../types").RepoRelease }>(res);
}

export async function getRelease(repoId: string, releaseId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/releases/${releaseId}`, {
    headers: { ...authHeaders() },
  });
  return handleRes<{ release: import("../types").RepoRelease }>(res);
}

export async function updateRelease(
  repoId: string,
  releaseId: string,
  body: Partial<{ title: string; body: string; is_prerelease: boolean; is_draft: boolean }>
) {
  const res = await fetch(`${API}/api/repos/${repoId}/releases/${releaseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes<{ release: import("../types").RepoRelease }>(res);
}

export async function deleteRelease(repoId: string, releaseId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/releases/${releaseId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes<{ deleted: boolean }>(res);
}

// ─── Pull Requests ───────────────────────────────────────────────────

export async function listPullRequests(repoId: string, params?: { state?: "open" | "closed" | "all" }) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls${qs({ state: params?.state })}`, {
    headers: { ...authHeaders() },
  });
  return handleRes<import("../types").PullRequest[]>(res);
}

export async function getPullRequestHeadOptions(repoId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls/head-options`, {
    headers: { ...authHeaders() },
  });
  return handleRes<{ options: import("../types").PullRequestHeadOption[] }>(res);
}

export async function getPullRequestCompare(
  repoId: string,
  params: { base_branch: string; head_branch: string; head_repo_id?: string }
) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls/compare${qs({
    base_branch: params.base_branch,
    head_branch: params.head_branch,
    head_repo_id: params.head_repo_id,
  })}`, {
    headers: { ...authHeaders() },
  });
  return handleRes<import("../types").PullRequestCompare>(res);
}

export async function createPullRequest(
  repoId: string,
  body: { title: string; body?: string; source_branch: string; target_branch: string; is_draft?: boolean; source_repo_id?: string; status_checks?: string[] }
) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes<import("../types").PullRequest>(res);
}

export async function getPullRequest(repoId: string, number: number | string) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls/${number}`, {
    headers: { ...authHeaders() },
  });
  // Stats and commits_count are included
  return handleRes<import("../types").PullRequest>(res);
}

export async function updatePullRequest(
  repoId: string,
  number: number | string,
  body: Partial<{ title: string; body: string; is_draft: boolean; status_checks: string[] }>
) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls/${number}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes<import("../types").PullRequest>(res);
}

export async function mergePullRequest(repoId: string, number: number | string, body?: { message?: string }) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls/${number}/merge`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body || {}),
  });
  return handleRes<import("../types").PullRequest>(res);
}

export async function closePullRequest(repoId: string, number: number | string) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls/${number}/close`, {
    method: "PUT",
    headers: { ...authHeaders() },
  });
  return handleRes<import("../types").PullRequest>(res);
}

export async function reopenPullRequest(repoId: string, number: number | string) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls/${number}/reopen`, {
    method: "PUT",
    headers: { ...authHeaders() },
  });
  return handleRes<import("../types").PullRequest>(res);
}

export async function getPullRequestDiff(repoId: string, number: number | string) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls/${number}/diff`, {
    headers: { ...authHeaders() },
  });
  return handleRes<{
    stats: { additions: number; deletions: number; files_changed: number };
    files: import("../types").CommitDiffFile[];
  }>(res);
}

export async function listPullRequestCommits(repoId: string, number: number | string) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls/${number}/commits`, {
    headers: { ...authHeaders() },
  });
  return handleRes<import("../types").RepoCommit[]>(res);
}

// ─── Pull Request Reviews ────────────────────────────────────────────

export async function submitPullRequestReview(
  repoId: string,
  number: number | string,
  body: { status: import("../types").PullRequestReviewStatus; body?: string }
) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls/${number}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes<import("../types").PullRequestReview>(res);
}

export async function listPullRequestReviews(repoId: string, number: number | string) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls/${number}/reviews`, {
    headers: { ...authHeaders() },
  });
  return handleRes<import("../types").PullRequestReview[]>(res);
}

// ─── Pull Request Comments ───────────────────────────────────────────

export async function addPullRequestComment(
  repoId: string,
  number: number | string,
  body: { body: string; path?: string; position?: number; review_id?: string; parent_comment_id?: string }
) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls/${number}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes<import("../types").PullRequestComment>(res);
}

export async function listPullRequestComments(repoId: string, number: number | string) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls/${number}/comments`, {
    headers: { ...authHeaders() },
  });
  return handleRes<import("../types").PullRequestComment[]>(res);
}

export async function updatePullRequestComment(
  repoId: string,
  number: number | string,
  commentId: string,
  body: { body: string }
) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls/${number}/comments/${commentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes<import("../types").PullRequestComment>(res);
}

export async function deletePullRequestComment(repoId: string, number: number | string, commentId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls/${number}/comments/${commentId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes<{ message: string }>(res);
}

export async function resolvePullRequestThread(repoId: string, number: number | string, commentId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/pulls/${number}/comments/${commentId}/resolve`, {
    method: "PUT",
    headers: { ...authHeaders() },
  });
  return handleRes<import("../types").PullRequestComment>(res);
}

// ─── Branch Protection Rules ─────────────────────────────────────────

export async function listBranchProtectionRules(repoId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/branches/protection`, {
    headers: { ...authHeaders() },
  });
  return handleRes<import("../types").BranchProtectionRule[]>(res);
}

export async function createBranchProtectionRule(
  repoId: string,
  body: Partial<import("../types").BranchProtectionRule>
) {
  const res = await fetch(`${API}/api/repos/${repoId}/branches/protection`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes<{ rule: import("../types").BranchProtectionRule }>(res);
}

export async function deleteBranchProtectionRule(repoId: string, ruleId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/branches/protection/${ruleId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes<{ message: string }>(res);
}

// ─── Repository Discussions ──────────────────────────────────────────

export async function listRepoDiscussions(repoId: string, category?: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/discussions${qs({ category })}`, {
    headers: { ...authHeaders() },
  });
  return handleRes<RepoDiscussionState>(res);
}

export async function getRepoDiscussion(repoId: string, discussionId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/discussions/${discussionId}`, {
    headers: { ...authHeaders() },
  });
  return handleRes<RepoDiscussionState>(res);
}

export async function createRepoDiscussion(
  repoId: string,
  body: { title: string; body: string; category?: string }
) {
  const res = await fetch(`${API}/api/repos/${repoId}/discussions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes<RepoDiscussionState>(res);
}

export async function addRepoDiscussionComment(
  repoId: string,
  discussionId: string,
  body: { body: string; parent_comment_id?: string }
) {
  const res = await fetch(`${API}/api/repos/${repoId}/discussions/${discussionId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes<RepoDiscussionState>(res);
}

export async function markRepoDiscussionAnswer(repoId: string, discussionId: string, commentId: string) {
  const res = await fetch(`${API}/api/repos/${repoId}/discussions/${discussionId}/answer/${commentId}`, {
    method: "PUT",
    headers: { ...authHeaders() },
  });
  return handleRes<RepoDiscussionState>(res);
}
