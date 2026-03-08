import type {
  ProjectSpace,
  StackEntry,
  SpaceMember,
  SpaceRepo,
  RepoMember,
  RepoTreeResponse,
  RepoBlobResponse,
  RepoReadmeResponse,
  RepoCommitResponse,
  JoinRequest,
  Discussion,
  DiscussionReply,
  SpaceUpdate,
  SpaceIssue,
  HealthScore,
  DecisionEntry,
} from "../types";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

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

export async function listSpaces(filters?: {
  status?: string;
  visibility?: string;
  tag?: string;
  mine?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ spaces: ProjectSpace[]; page: number; limit: number; total?: number }> {
  const res = await fetch(
    `${API}/api/spaces${qs({
      status: filters?.status,
      visibility: filters?.visibility,
      tag: filters?.tag,
      mine: filters?.mine,
      page: filters?.page,
      limit: filters?.limit,
    })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function getSpace(spaceId: string): Promise<{ space: ProjectSpace }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function createSpace(body: {
  name: string;
  summary: string;
  description?: string;
  status?: string;
  visibility?: string;
  primary_repo_url?: string;
}): Promise<{ space: ProjectSpace }> {
  const res = await fetch(`${API}/api/spaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function updateSpace(
  spaceId: string,
  body: Partial<{
    name: string;
    summary: string;
    description: string;
    status: string;
    visibility: string;
    primary_repo_url: string;
  }>
): Promise<{ space: ProjectSpace }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function deleteSpace(spaceId: string): Promise<{ archived: boolean }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function listRepos(spaceId: string): Promise<{ repos: SpaceRepo[] }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/repos`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function createRepo(
  spaceId: string,
  body: {
    name: string;
    description?: string;
    default_branch?: string;
  }
): Promise<{ repo: SpaceRepo }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/repos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function getRepo(spaceId: string, repoId: string): Promise<{ repo: SpaceRepo }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/repos/${repoId}`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function updateRepo(
  spaceId: string,
  repoId: string,
  body: Partial<{
    name: string;
    description: string;
    slug: string;
    default_branch: string;
  }>
): Promise<{ repo: SpaceRepo }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/repos/${repoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function archiveRepo(spaceId: string, repoId: string): Promise<{ archived: boolean }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/repos/${repoId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function listRepoMembers(
  spaceId: string,
  repoId: string
): Promise<{ members: RepoMember[] }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/repos/${repoId}/members`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function upsertRepoMember(
  spaceId: string,
  repoId: string,
  userId: string,
  role: "read" | "write"
): Promise<{ member: RepoMember }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/repos/${repoId}/members/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ role }),
  });
  return handleRes(res);
}

export async function removeRepoMember(
  spaceId: string,
  repoId: string,
  userId: string
): Promise<{ removed: boolean }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/repos/${repoId}/members/${userId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function getRepoTree(
  spaceId: string,
  repoId: string,
  params?: { ref?: string; path?: string }
): Promise<RepoTreeResponse> {
  const res = await fetch(
    `${API}/api/spaces/${spaceId}/repos/${repoId}/tree${qs({ ref: params?.ref, path: params?.path })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function getRepoBlob(
  spaceId: string,
  repoId: string,
  params: { ref?: string; path: string }
): Promise<RepoBlobResponse> {
  const res = await fetch(
    `${API}/api/spaces/${spaceId}/repos/${repoId}/blob${qs({ ref: params?.ref, path: params.path })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function getRepoReadme(
  spaceId: string,
  repoId: string,
  params?: { ref?: string }
): Promise<RepoReadmeResponse> {
  const res = await fetch(
    `${API}/api/spaces/${spaceId}/repos/${repoId}/readme${qs({ ref: params?.ref })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function getRepoCommits(
  spaceId: string,
  repoId: string,
  params?: { ref?: string; path?: string; page?: number; limit?: number }
): Promise<RepoCommitResponse> {
  const res = await fetch(
    `${API}/api/spaces/${spaceId}/repos/${repoId}/commits${qs({
      ref: params?.ref,
      path: params?.path,
      page: params?.page,
      limit: params?.limit,
    })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function getStack(spaceId: string): Promise<{ stack: StackEntry[] }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/stack`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function replaceStack(
  spaceId: string,
  stack: Array<{ category: string; technology: string; maturity?: string }>
): Promise<{ stack: StackEntry[] }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/stack`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ stack }),
  });
  return handleRes(res);
}

export async function getContributors(spaceId: string): Promise<{ contributors: SpaceMember[] }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/contributors`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function updateContributorRole(
  spaceId: string,
  userId: string,
  role: string
): Promise<{ contributor: SpaceMember }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/contributors/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ role }),
  });
  return handleRes(res);
}

export async function removeContributor(
  spaceId: string,
  userId: string
): Promise<{ removed: boolean }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/contributors/${userId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function createJoinRequest(
  spaceId: string,
  body: {
    message: string;
    skills?: string[];
    availability_hours?: number;
    proof_links?: string[];
  }
): Promise<{ joinRequest: JoinRequest }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/join-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function listJoinRequests(
  spaceId: string,
  params?: { status?: string; page?: number; limit?: number }
): Promise<{ requests: JoinRequest[]; page: number; limit: number; total?: number }> {
  const res = await fetch(
    `${API}/api/spaces/${spaceId}/join-requests${qs({ status: params?.status, page: params?.page, limit: params?.limit })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function reviewJoinRequest(
  spaceId: string,
  requestId: string,
  action: "accept" | "reject" | "need-info"
): Promise<{ joinRequest: JoinRequest }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/join-requests/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action }),
  });
  return handleRes(res);
}

export async function createDiscussion(
  spaceId: string,
  body: { title: string; body: string; category?: string }
): Promise<{ thread: Discussion }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/discussions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function listDiscussions(
  spaceId: string,
  params?: { page?: number; limit?: number }
): Promise<{ threads: Discussion[]; page: number; limit: number; total?: number }> {
  const res = await fetch(
    `${API}/api/spaces/${spaceId}/discussions${qs({ page: params?.page, limit: params?.limit })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function getDiscussion(spaceId: string, threadId: string): Promise<{ thread: Discussion }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/discussions/${threadId}`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function addReply(
  spaceId: string,
  threadId: string,
  body: string,
  parentReplyId?: string
): Promise<{ reply: DiscussionReply }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/discussions/${threadId}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      body,
      ...(parentReplyId ? { parent_reply_id: parentReplyId } : {}),
    }),
  });
  return handleRes(res);
}

export async function updateDiscussion(
  spaceId: string,
  threadId: string,
  body: Partial<{
    status: string;
    is_pinned: boolean;
    category: string;
    decision_summary: string;
  }>
): Promise<{ thread: Discussion }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/discussions/${threadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function createUpdate(
  spaceId: string,
  body: {
    type: string;
    title: string;
    content: string;
    what_shipped?: string;
    next_up?: string;
    blockers?: string;
    evidence_links?: string[];
  }
): Promise<{ update: SpaceUpdate }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/updates`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function listUpdates(
  spaceId: string,
  params?: { page?: number; limit?: number }
): Promise<{ updates: SpaceUpdate[]; page: number; limit: number; total?: number }> {
  const res = await fetch(
    `${API}/api/spaces/${spaceId}/updates${qs({ page: params?.page, limit: params?.limit })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function patchUpdate(
  spaceId: string,
  updateId: string,
  body: Partial<{
    title: string;
    content: string;
    what_shipped: string;
    next_up: string;
    blockers: string;
    evidence_links: string[];
  }>
): Promise<{ update: SpaceUpdate }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/updates/${updateId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function deleteUpdate(
  spaceId: string,
  updateId: string
): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/updates/${updateId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function listIssues(
  spaceId: string,
  params?: { status?: string; priority?: string; assignee?: string; page?: number; limit?: number }
): Promise<{ issues: SpaceIssue[]; page: number; limit: number; total?: number }> {
  const res = await fetch(
    `${API}/api/spaces/${spaceId}/issues${qs({
      status: params?.status,
      priority: params?.priority,
      assignee: params?.assignee,
      page: params?.page,
      limit: params?.limit,
    })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function getIssue(spaceId: string, issueId: string): Promise<{ issue: SpaceIssue }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/issues/${issueId}`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function createIssue(
  spaceId: string,
  body: { title: string; body: string }
): Promise<{ issue: SpaceIssue }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/issues`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function updateIssue(
  spaceId: string,
  issueId: string,
  body: Partial<{
    title: string;
    body: string;
    status: string;
    priority: string;
    assignee_user_id: string | null;
  }>
): Promise<{ issue: SpaceIssue }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/issues/${issueId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function getHealth(spaceId: string): Promise<{ health: HealthScore }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/health`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function getDecisions(spaceId: string): Promise<{ decisions: DecisionEntry[] }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/decisions`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}
