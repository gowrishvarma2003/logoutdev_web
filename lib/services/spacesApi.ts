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
  SpaceWorkItem,
  HealthScore,
  DecisionEntry,
  SpaceRepoAttachment,
  SpaceFollower,
  RepositoryVisibility,
  WorkItemType,
  SpaceIssuePriority,
  SpaceIssueStatus,
  SpaceMilestone,
  SpaceWorkActivity,
  SpaceWorkComment,
  SpaceWorkSummary,
  WorkDueState,
  WorkReadiness,
  WorkSort,
} from "../types";
import { API_BASE_URL } from "../apiBaseUrl";
import { clearClientSessionAndRedirect } from "../auth/logoutCleanup";

const API = API_BASE_URL;

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleRes<T>(res: Response): Promise<T> {
  if (res.status === 401 && typeof window !== "undefined") {
    clearClientSessionAndRedirect("/login");
    throw new Error("Unauthorized");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

function qs(params: Record<string, string | number | undefined | boolean | null>): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!entries.length) return "";
  return `?${entries.map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join("&")}`;
}

function mapManagedRepos(attachments: SpaceRepoAttachment[]): SpaceRepo[] {
  return attachments
    .filter((attachment) => attachment.kind === "managed" && attachment.repo)
    .map((attachment) => attachment.repo as SpaceRepo);
}

export async function listSpaces(filters?: {
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
}): Promise<{ spaces: ProjectSpace[]; page: number; limit: number; total?: number }> {
  const res = await fetch(
    `${API}/api/spaces${qs({
      status: filters?.status,
      visibility: filters?.visibility,
      tag: filters?.tag,
      needed_skill: filters?.needed_skill,
      working_in_public: filters?.working_in_public,
      looking_for_contributors: filters?.looking_for_contributors,
      good_first_tasks: filters?.good_first_tasks,
      recently_shipped: filters?.recently_shipped,
      mine: filters?.mine,
      followed: filters?.followed,
      working: filters?.working,
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
  working_in_public?: boolean;
  current_focus?: string;
  open_roles?: string[];
  needed_skills?: string[];
  contribution_guide?: string;
  response_sla?: string;
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
    working_in_public: boolean;
    current_focus: string;
    open_roles: string[];
    needed_skills: string[];
    contribution_guide: string;
    response_sla: string;
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

export async function listAttachments(spaceId: string): Promise<{ attachments: SpaceRepoAttachment[] }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/attachments`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function createAttachment(
  spaceId: string,
  body: {
    repo_id?: string;
    external_url?: string;
    label?: string;
    is_primary?: boolean;
  }
): Promise<{ attachment: SpaceRepoAttachment }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function updateAttachment(
  spaceId: string,
  attachmentId: string,
  body: Partial<{
    label: string;
    external_url: string;
    position: number;
    is_primary: boolean;
  }>
): Promise<{ attachment: SpaceRepoAttachment }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/attachments/${attachmentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function deleteAttachment(spaceId: string, attachmentId: string): Promise<{ removed: boolean }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function listRepos(spaceId: string): Promise<{ repos: SpaceRepo[] }> {
  const { attachments } = await listAttachments(spaceId);
  return { repos: mapManagedRepos(attachments) };
}

export async function createRepo(
  spaceId: string,
  body: {
    name: string;
    description?: string;
    default_branch?: string;
    visibility?: RepositoryVisibility;
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
    visibility: RepositoryVisibility;
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

export async function listFollowers(spaceId: string): Promise<{ followers: SpaceFollower[] }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/followers`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function followSpace(spaceId: string): Promise<{ follow: SpaceFollower }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/followers`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function unfollowSpace(spaceId: string): Promise<{ removed: boolean }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/followers`, {
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
    answer_reply_id: string | null;
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
    repo_id?: string;
    work_item_id?: string;
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
  params?: { page?: number; limit?: number; work_item_id?: string }
): Promise<{ updates: SpaceUpdate[]; page: number; limit: number; total?: number }> {
  const res = await fetch(
    `${API}/api/spaces/${spaceId}/updates${qs({
      page: params?.page,
      limit: params?.limit,
      work_item_id: params?.work_item_id,
    })}`,
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
    repo_id: string | null;
    work_item_id: string | null;
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

export async function listWork(
  spaceId: string,
  params?: {
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
): Promise<{ issues: SpaceWorkItem[]; page: number; limit: number; total?: number; sort?: WorkSort }> {
  const res = await fetch(
    `${API}/api/spaces/${spaceId}/work${qs({
      status: params?.status,
      priority: params?.priority,
      assignee: params?.assignee,
      type: params?.type,
      repo_id: params?.repo_id,
      needed_skill: params?.needed_skill,
      good_first: params?.good_first,
      help_wanted: params?.help_wanted,
      blocked: params?.blocked,
      q: params?.q,
      sort: params?.sort,
      due_state: params?.due_state,
      stale: params?.stale,
      readiness: params?.readiness,
      page: params?.page,
      limit: params?.limit,
    })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function getWork(spaceId: string, issueId: string): Promise<{ issue: SpaceWorkItem }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/work/${issueId}`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function getWorkSummary(
  spaceId: string,
  params?: {
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
): Promise<{ summary: SpaceWorkSummary }> {
  const res = await fetch(
    `${API}/api/spaces/${spaceId}/work/summary${qs({
      status: params?.status,
      priority: params?.priority,
      assignee: params?.assignee,
      type: params?.type,
      repo_id: params?.repo_id,
      needed_skill: params?.needed_skill,
      good_first: params?.good_first,
      help_wanted: params?.help_wanted,
      blocked: params?.blocked,
      q: params?.q,
      sort: params?.sort,
      due_state: params?.due_state,
      stale: params?.stale,
      readiness: params?.readiness,
    })}`,
    { headers: { ...authHeaders() } }
  );
  return handleRes(res);
}

export async function createWork(
  spaceId: string,
  body: {
    title: string;
    body: string;
    type?: WorkItemType;
    priority?: SpaceIssuePriority;
    repo_id?: string | null;
    assignee_user_id?: string | null;
    milestone_id?: string | null;
    good_first_task?: boolean;
    help_wanted?: boolean;
    blocked_reason?: string;
    estimate?: string;
    target_date?: string;
    needed_skill?: string;
    attachments?: File[];
  }
): Promise<{ issue: SpaceWorkItem }> {
  if (body.attachments?.length) {
    const formData = new FormData();
    formData.set("title", body.title);
    formData.set("body", body.body);
    if (body.type) formData.set("type", body.type);
    if (body.priority) formData.set("priority", body.priority);
    if (body.repo_id) formData.set("repo_id", body.repo_id);
    if (body.assignee_user_id) formData.set("assignee_user_id", body.assignee_user_id);
    if (body.milestone_id) formData.set("milestone_id", body.milestone_id);
    if (body.good_first_task !== undefined) formData.set("good_first_task", String(body.good_first_task));
    if (body.help_wanted !== undefined) formData.set("help_wanted", String(body.help_wanted));
    if (body.blocked_reason) formData.set("blocked_reason", body.blocked_reason);
    if (body.estimate) formData.set("estimate", body.estimate);
    if (body.target_date) formData.set("target_date", body.target_date);
    if (body.needed_skill) formData.set("needed_skill", body.needed_skill);
    body.attachments.forEach((file) => formData.append("attachments", file));

    const res = await fetch(`${API}/api/spaces/${spaceId}/work`, {
      method: "POST",
      headers: { ...authHeaders() },
      body: formData,
    });
    return handleRes(res);
  }

  const jsonBody = { ...body };
  delete jsonBody.attachments;
  const res = await fetch(`${API}/api/spaces/${spaceId}/work`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(jsonBody),
  });
  return handleRes(res);
}

export async function updateWork(
  spaceId: string,
  issueId: string,
  body: Partial<{
    title: string;
    body: string;
    status: SpaceIssueStatus;
    priority: SpaceIssuePriority;
    type: WorkItemType;
    repo_id: string | null;
    assignee_user_id: string | null;
    milestone_id: string | null;
    good_first_task: boolean;
    help_wanted: boolean;
    blocked_reason: string | null;
    close_reason: string | null;
    estimate: string | null;
    target_date: string | null;
    needed_skill: string | null;
  }>
): Promise<{ issue: SpaceWorkItem }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/work/${issueId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function bulkUpdateWork(
  spaceId: string,
  issueIds: string[],
  changes: Partial<{
    status: SpaceIssueStatus;
    priority: SpaceIssuePriority;
    type: WorkItemType;
    repo_id: string | null;
    assignee_user_id: string | null;
    milestone_id: string | null;
    good_first_task: boolean;
    help_wanted: boolean;
    blocked_reason: string | null;
    close_reason: string | null;
    estimate: string | null;
    target_date: string | null;
    needed_skill: string | null;
  }>
): Promise<{ issues: SpaceWorkItem[]; updated: number }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/work/bulk`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ issue_ids: issueIds, changes }),
  });
  return handleRes(res);
}

export async function listWorkComments(spaceId: string, issueId: string): Promise<{ comments: SpaceWorkComment[] }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/work/${issueId}/comments`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function createWorkComment(
  spaceId: string,
  issueId: string,
  body: string,
  parentCommentId?: string
): Promise<{ comment: SpaceWorkComment }> {
  const path = parentCommentId
    ? `${API}/api/spaces/${spaceId}/work/${issueId}/comments/${parentCommentId}/replies`
    : `${API}/api/spaces/${spaceId}/work/${issueId}/comments`;
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ body }),
  });
  return handleRes(res);
}

export async function getWorkActivity(
  spaceId: string,
  issueId: string,
  params?: { page?: number; limit?: number }
): Promise<{ activity: SpaceWorkActivity[]; page: number; limit: number; total?: number }> {
  const res = await fetch(
    `${API}/api/spaces/${spaceId}/work/${issueId}/activity${qs({ page: params?.page, limit: params?.limit })}`,
    {
    headers: { ...authHeaders() },
    }
  );
  return handleRes(res);
}

export async function listMilestones(spaceId: string): Promise<{ milestones: SpaceMilestone[] }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/milestones`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function createMilestone(
  spaceId: string,
  body: {
    title: string;
    description?: string | null;
    status?: SpaceMilestone["status"];
    target_date?: string | null;
  }
): Promise<{ milestone: SpaceMilestone }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/milestones`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function updateMilestone(
  spaceId: string,
  milestoneId: string,
  body: Partial<{
    title: string;
    description: string | null;
    status: SpaceMilestone["status"];
    target_date: string | null;
    position: number;
  }>
): Promise<{ milestone: SpaceMilestone }> {
  const res = await fetch(`${API}/api/spaces/${spaceId}/milestones/${milestoneId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function listIssues(
  spaceId: string,
  params?: {
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
): Promise<{ issues: SpaceIssue[]; page: number; limit: number; total?: number }> {
  return listWork(spaceId, params);
}

export async function getIssue(spaceId: string, issueId: string): Promise<{ issue: SpaceIssue }> {
  return getWork(spaceId, issueId);
}

export async function createIssue(
  spaceId: string,
  body: {
    title: string;
    body: string;
    type?: WorkItemType;
    priority?: SpaceIssuePriority;
    repo_id?: string | null;
    assignee_user_id?: string | null;
    milestone_id?: string | null;
    good_first_task?: boolean;
    help_wanted?: boolean;
    blocked_reason?: string;
    estimate?: string;
    target_date?: string;
    needed_skill?: string;
  }
): Promise<{ issue: SpaceIssue }> {
  return createWork(spaceId, body);
}

export async function updateIssue(
  spaceId: string,
  issueId: string,
  body: Partial<{
    title: string;
    body: string;
    status: SpaceIssueStatus;
    priority: SpaceIssuePriority;
    type: WorkItemType;
    repo_id: string | null;
    assignee_user_id: string | null;
    milestone_id: string | null;
    good_first_task: boolean;
    help_wanted: boolean;
    blocked_reason: string | null;
    close_reason: string | null;
    estimate: string | null;
    target_date: string | null;
    needed_skill: string | null;
  }>
): Promise<{ issue: SpaceIssue }> {
  return updateWork(spaceId, issueId, body);
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
